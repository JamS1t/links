import { useEffect, useRef } from 'react'

const RAMP = ' .:-=+*#%@' // dark → bright

const LEVELS = RAMP.length - 1 // drawable levels 1..9 (0 is a space)

type Grid = {
  width: number
  height: number
  dpr: number
  cols: number
  rows: number
  cellW: number
  cellH: number
  font: number
  tone: Float32Array
  seed: Float32Array
}

// Draws `src` as ASCII art (object-fit: cover, top-anchored, or zoomed onto `focus`).
// ink 'dark' draws zinc characters for a white page (dense = dark); 'light' draws pale characters for a dark ground (dense = bright).
// fontSize/maxDpr/intensity default to the site's values; the print card passes a smaller font, full DPR, stronger ink.
//
// alive: the portrait types itself in on load and a few characters twinkle. Off under reduced motion; paused while
// hidden or scrolled away. Built for phones: every glyph is pre-drawn once into an atlas, the settled portrait is cached
// as a bitmap, and each frame blits that bitmap and redraws the few twinkling cells (no fillText). Drops to 15fps if
// frames run long.
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
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.decoding = 'async'
    const animate = alive && !matchMedia('(prefers-reduced-motion: reduce)').matches
    const inkRGB = ink === 'dark' ? [39, 39, 42] : [214, 218, 226]
    let raf = 0
    let grid: Grid | null = null
    let atlas: HTMLCanvasElement | null = null
    let base: HTMLCanvasElement | null = null
    let gw = 0
    let gh = 0
    let start = 0
    let last = 0
    let frameMs = 1000 / 24
    let cost = 0

    const levelOf = (t: number) => (t < 0.08 ? 0 : Math.min(LEVELS, Math.ceil(Math.min(1, t) * LEVELS)))

    function layout() {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height || !img.naturalWidth) return false

      // The static render keeps 20% headroom for the CSS scroll zoom; the live one skips it to save fill rate.
      const dpr = Math.min(devicePixelRatio || 1, maxDpr) * (animate ? 1 : 1.2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)

      const font = fontSize ?? (width < 480 ? 7 : 8)
      const cols = Math.floor(width / (font * 0.62))
      const rows = Math.floor(height / font)

      // Let the browser average each cell by downscaling the cropped photo to cols × rows.
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

      grid = { width, height, dpr, cols, rows, cellW: width / cols, cellH: height / rows, font, tone, seed }
      if (animate) buildSprites(grid)
      return true
    }

    // Atlas: one glyph per level, in device pixels. Base: the settled portrait, drawn once from the atlas.
    function buildSprites(g: Grid) {
      gw = Math.ceil(g.cellW * g.dpr) + 2
      gh = Math.ceil(g.cellH * g.dpr) + 2
      atlas = document.createElement('canvas')
      atlas.width = gw * LEVELS
      atlas.height = gh
      const a = atlas.getContext('2d')!
      a.font = `600 ${g.font * g.dpr}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
      a.textBaseline = 'top'
      for (let l = 1; l <= LEVELS; l++) {
        const alpha = Math.min(1, (0.12 + (l / LEVELS) * 0.43) * intensity)
        a.fillStyle = `rgb(${inkRGB[0]} ${inkRGB[1]} ${inkRGB[2]} / ${alpha})`
        a.fillText(RAMP[l], (l - 1) * gw + 1, 1)
      }
      base = document.createElement('canvas')
      base.width = canvas.width
      base.height = canvas.height
      const bx = base.getContext('2d')!
      bx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0)
      for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) stamp(bx, g, levelOf(g.tone[y * g.cols + x]), x, y)
    }

    function stamp(c: CanvasRenderingContext2D, g: Grid, level: number, x: number, y: number) {
      if (level) c.drawImage(atlas!, (level - 1) * gw, 0, gw, gh, x * g.cellW - 1 / g.dpr, y * g.cellH - 1 / g.dpr, gw / g.dpr, gh / g.dpr)
    }

    // Exact original look, one pass: used by the print card and under reduced motion.
    function paintStatic() {
      const g = grid!
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0)
      ctx.clearRect(0, 0, g.width, g.height)
      ctx.font = `600 ${g.font}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
      ctx.textBaseline = 'top'
      for (let y = 0; y < g.rows; y++) {
        for (let x = 0; x < g.cols; x++) {
          const t = g.tone[y * g.cols + x]
          if (t < 0.08) continue // empty where the ink would be faintest
          const ch = RAMP[Math.min(RAMP.length - 1, Math.ceil(t * (RAMP.length - 1)))]
          const alpha = Math.min(1, (0.12 + t * 0.43) * intensity) // capped so text on top stays legible
          ctx.fillStyle = `rgb(${inkRGB[0]} ${inkRGB[1]} ${inkRGB[2]} / ${alpha})`
          ctx.fillText(ch, x * g.cellW, y * g.cellH)
        }
      }
    }

    const WAVE = 0.9 // seconds for the type-in wave to cross the portrait
    const SPREAD = 0.2 // per-cell jitter on that wave
    const SCRAMBLE = 0.14 // seconds a cell shows random characters before settling
    const REVEAL = WAVE + SPREAD + SCRAMBLE

    function paintLive(now: number) {
      const g = grid!
      const { cols, rows, cellW, cellH, tone, seed, width, height } = g
      const t0 = (now - start) / 1000
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0)

      if (t0 < REVEAL) {
        // Type-in: cells appear on a top-down wave, scrambling briefly before they settle. Rows that have
        // fully settled are one blit from the cached portrait; only the moving band is drawn cell by cell.
        ctx.clearRect(0, 0, width, height)
        const settledRows = Math.max(0, Math.min(rows, Math.floor(((t0 - SPREAD - SCRAMBLE) / WAVE) * rows)))
        if (settledRows) ctx.drawImage(base!, 0, 0, base!.width, settledRows * cellH * g.dpr, 0, 0, width, settledRows * cellH)
        const lastRow = Math.min(rows, Math.ceil((t0 / WAVE) * rows) + 1)
        for (let y = settledRows; y < lastRow; y++) {
          for (let x = 0; x < cols; x++) {
            const i = y * cols + x
            const age = t0 - ((y / rows) * WAVE + seed[i] * SPREAD)
            if (age < 0) continue
            stamp(ctx, g, age < SCRAMBLE ? 1 + Math.floor(seed[(i * 7) % seed.length] * LEVELS) : levelOf(tone[i]), x, y)
          }
        }
        return
      }

      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(base!, 0, 0, width, height)

      // Sparse twinkle: a handful of cells step one character up or down for a moment.
      for (let i = 0; i < tone.length; i++) {
        if (Math.sin(t0 * 1.3 + seed[i] * 60) <= 0.985) continue
        const x = i % cols
        const y = (i - x) / cols
        ctx.clearRect(x * cellW, y * cellH, cellW, cellH)
        stamp(ctx, g, levelOf(tone[i] + (seed[i] > 0.5 ? 0.12 : -0.12)), x, y)
      }
    }

    function loop(now: number) {
      raf = requestAnimationFrame(loop)
      if (now - last < frameMs - 2 || document.hidden) return
      if (grid && scrollY > grid.height * 1.1) return
      last = now
      const t = performance.now()
      paintLive(now)
      // Slow device: if frames average over 10ms, settle for 15fps.
      cost = cost * 0.9 + (performance.now() - t) * 0.1
      if (cost > 10 && now - start > REVEAL * 1000) frameMs = 1000 / 15
    }

    function rebuild() {
      cancelAnimationFrame(raf)
      if (!layout()) return
      if (animate) {
        if (!start) start = performance.now()
        raf = requestAnimationFrame(loop)
      } else {
        raf = requestAnimationFrame(paintStatic)
      }
    }

    img.onload = rebuild
    img.src = src
    const ro = new ResizeObserver(rebuild)
    ro.observe(canvas)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
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
