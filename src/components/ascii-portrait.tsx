import { useEffect, useRef } from 'react'

const RAMP = ' .:-=+*#%@' // dark → bright

const INDIGO = [59, 79, 216]

// Draws `src` as ASCII art (object-fit: cover, top-anchored).
// ink 'dark' draws zinc characters for a white page (dense = dark); 'light' draws pale characters for a dark ground (dense = bright).
// alive: the portrait types itself in on load, shimmers slowly, and an indigo spotlight follows the pointer
// (or wanders over the face until someone touches the page). Off under reduced motion, and paused while off screen.
// fontSize/maxDpr/intensity default to the site's values; the print card passes a smaller font, full DPR, stronger ink.
export function AsciiPortrait({
  src,
  className,
  fontSize,
  maxDpr = 2,
  intensity = 1,
  ink = 'light',
  alive = false,
  focus,
}: {
  src: string
  className?: string
  fontSize?: number
  maxDpr?: number
  intensity?: number
  ink?: 'light' | 'dark'
  alive?: boolean
  /** Zoom in on a point of the photo: fx/fy are 0–1 in the photo, placed at cx/cy (0–1) of the canvas. */
  focus?: { fx: number; fy: number; cx: number; cy: number; zoom: number }
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const img = new Image()
    const animate = alive && !matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let grid: { width: number; height: number; cols: number; rows: number; cellW: number; cellH: number; font: number; tone: Float32Array; seed: Float32Array } | null = null
    let start = 0
    let last = 0
    const spot = { x: 0, y: 0, tx: 0, ty: 0, at: -1e9 }

    function layout() {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height || !img.naturalWidth) return false

      const dpr = Math.min(devicePixelRatio || 1, maxDpr) * 1.2 // headroom for the scroll zoom
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)

      const font = fontSize ?? (width < 480 ? 7 : 8)
      const cols = Math.floor(width / (font * 0.62))
      const rows = Math.floor(height / font)

      // Let the browser average each cell by downscaling the cover-cropped photo to cols × rows.
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const scale = Math.max(width / iw, height / ih) * (focus?.zoom ?? 1)
      const sw = width / scale
      const sh = height / scale
      const clamp = (v: number, max: number) => Math.min(Math.max(0, v), max)
      const sx = focus ? clamp(focus.fx * iw - focus.cx * sw, iw - sw) : (iw - sw) / 2
      const sy = focus ? clamp(focus.fy * ih - focus.cy * sh, ih - sh) : 0
      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)
      const tone = toneMap(sctx.getImageData(0, 0, cols, rows).data, cols, rows)
      if (ink === 'dark') for (let i = 0; i < tone.length; i++) tone[i] = 1 - tone[i]
      const seed = new Float32Array(cols * rows).map(() => Math.random())

      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      grid = { width, height, cols, rows, cellW: width / cols, cellH: height / rows, font, tone, seed }
      return true
    }

    function paint(now: number) {
      if (!grid) return
      const { width, height, cols, rows, cellW, cellH, font, tone, seed } = grid
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, width, height)
      ctx.font = `600 ${font}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
      ctx.textBaseline = 'top'

      const t0 = (now - start) / 1000
      const radius = Math.min(width, height) * 0.3
      if (animate) {
        // No recent pointer: drift slowly around the face.
        if (now - spot.at > 2500) {
          spot.tx = width * (0.5 + 0.22 * Math.sin(t0 * 0.35))
          spot.ty = height * (0.4 + 0.14 * Math.sin(t0 * 0.53 + 1))
        }
        spot.x += (spot.tx - spot.x) * 0.12
        spot.y += (spot.ty - spot.y) * 0.12
      }

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          let t = tone[i]
          let glow = 0
          if (animate) {
            // Type-in: each cell appears on a top-down wave, scrambling briefly before it settles.
            const age = t0 - ((y / rows) * 0.9 + seed[i] * 0.35)
            if (age < 0) continue
            if (age < 0.18) t = seed[(i * 7) % seed.length]
            t += 0.07 * Math.sin(t0 * 1.6 + seed[i] * 6.283) // slow shimmer
            const dx = x * cellW - spot.x
            const dy = y * cellH - spot.y
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d < radius) {
              glow = 1 - d / radius
              glow *= glow
              t += glow * 0.45
            }
          }
          if (t < 0.08) continue // empty where the ink would be faintest
          const ch = RAMP[Math.min(RAMP.length - 1, Math.ceil(Math.min(1, t) * (RAMP.length - 1)))]
          const alpha = Math.min(1, (0.12 + Math.min(1, t) * 0.43) * intensity + glow * 0.5) // capped so text on top stays legible
          if (glow > 0.02) {
            const [r, g, b] = ink === 'dark' ? [39, 39, 42] : [214, 218, 226]
            const k = Math.min(1, glow * 2.2)
            ctx.fillStyle = `rgb(${r + (INDIGO[0] - r) * k} ${g + (INDIGO[1] - g) * k} ${b + (INDIGO[2] - b) * k} / ${alpha})`
          } else {
            ctx.fillStyle = ink === 'dark' ? `rgb(39 39 42 / ${alpha})` : `rgb(214 218 226 / ${alpha})`
          }
          ctx.fillText(ch, x * cellW, y * cellH)
        }
      }
    }

    // ~24fps is plenty for a shimmer; skip frames while the page is hidden or the cover is scrolled away.
    function loop(now: number) {
      raf = requestAnimationFrame(loop)
      if (now - last < 1000 / 24 || document.hidden) return
      if (grid && scrollY > grid.height * 1.1) return
      last = now
      paint(now)
    }

    function rebuild() {
      cancelAnimationFrame(raf)
      if (!layout()) return
      if (animate) {
        if (!start) {
          start = performance.now()
          spot.x = spot.tx = grid!.width * 0.5
          spot.y = spot.ty = grid!.height * 0.4
        }
        raf = requestAnimationFrame(loop)
      } else {
        raf = requestAnimationFrame(() => paint(performance.now()))
      }
    }

    // The canvas sits behind the page (pointer-events: none), so follow the pointer on the window.
    function onPointer(e: PointerEvent) {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) return
      // Undo the CSS scroll zoom so the spotlight lands under the finger.
      spot.tx = x * (canvas.clientWidth / r.width)
      spot.ty = y * (canvas.clientHeight / r.height)
      spot.at = performance.now()
    }

    img.onload = rebuild
    img.src = src
    const ro = new ResizeObserver(rebuild)
    ro.observe(canvas)
    if (animate) {
      addEventListener('pointermove', onPointer, { passive: true })
      addEventListener('pointerdown', onPointer, { passive: true })
    }
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onPointer)
      removeEventListener('pointerdown', onPointer)
    }
  }, [src, fontSize, maxDpr, intensity, ink, alive, focus?.fx, focus?.fy, focus?.cx, focus?.cy, focus?.zoom])

  return <canvas ref={ref} aria-hidden className={className} />
}

// 0–1 tone per cell. Blends global brightness with local contrast (each cell vs. its ~11×11
// neighbourhood, like CLAHE), so a dim face under a flash-lit hat still shows nose, lips and edges.
function toneMap(px: Uint8ClampedArray, cols: number, rows: number, radius = 5) {
  const n = cols * rows
  const lum = new Float64Array(n)
  for (let i = 0; i < n; i++) lum[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255

  // Integral images of lum and lum² → O(1) window mean and variance.
  const w = cols + 1
  const sum = new Float64Array(w * (rows + 1))
  const sq = new Float64Array(w * (rows + 1))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const l = lum[y * cols + x]
      const i = (y + 1) * w + x + 1
      sum[i] = l + sum[i - 1] + sum[i - w] - sum[i - w - 1]
      sq[i] = l * l + sq[i - 1] + sq[i - w] - sq[i - w - 1]
    }
  }

  const tone = new Float32Array(n)
  for (let y = 0; y < rows; y++) {
    const y0 = Math.max(0, y - radius)
    const y1 = Math.min(rows, y + radius + 1)
    for (let x = 0; x < cols; x++) {
      const x0 = Math.max(0, x - radius)
      const x1 = Math.min(cols, x + radius + 1)
      const area = (y1 - y0) * (x1 - x0)
      const box = (a: Float64Array) => a[y1 * w + x1] - a[y0 * w + x1] - a[y1 * w + x0] + a[y0 * w + x0]
      const mean = box(sum) / area
      const std = Math.sqrt(Math.max(0, box(sq) / area - mean * mean))
      const l = lum[y * cols + x]
      const local = 0.5 + (l - mean) / (2.5 * std + 0.04) // +0.04 keeps flat areas from amplifying noise
      tone[y * cols + x] = Math.min(1, Math.max(0, 0.35 * l + 0.65 * local))
    }
  }
  return tone
}
