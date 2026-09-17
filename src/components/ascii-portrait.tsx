import { useEffect, useRef } from 'react'

const RAMP = ' .:-=+*#%@' // dark → bright

// Draws `src` as ASCII art (object-fit: cover, top-anchored, same framing as the cover <img>).
// Rendered once per size; CSS (.cover-ascii) fades it in on scroll.
export function AsciiPortrait({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const img = new Image()
    let raf = 0

    function draw() {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height || !img.naturalWidth) return

      const dpr = Math.min(devicePixelRatio || 1, 2) * 1.2 // headroom for the scroll zoom
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)

      const font = width < 480 ? 7 : 8
      const cols = Math.floor(width / (font * 0.62))
      const rows = Math.floor(height / font)
      const cellW = width / cols
      const cellH = height / rows

      // Let the browser average each cell by downscaling the cover-cropped photo to cols × rows.
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
      const sw = width / scale
      const sh = height / scale
      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(img, (img.naturalWidth - sw) / 2, 0, sw, sh, 0, 0, cols, rows)
      const px = sctx.getImageData(0, 0, cols, rows).data

      const tone = toneMap(px, cols, rows)

      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.font = `600 ${font}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
      ctx.textBaseline = 'top'
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const t = tone[y * cols + x]
          if (t < 0.08) continue // deepest shadows stay empty
          const ch = RAMP[Math.min(RAMP.length - 1, Math.ceil(t * (RAMP.length - 1)))]
          ctx.fillStyle = `rgb(214 218 226 / ${0.12 + t * 0.43})` // capped so text and glass on top stay legible
          ctx.fillText(ch, x * cellW, y * cellH)
        }
      }
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(draw)
    }
    img.onload = schedule
    img.src = src
    const ro = new ResizeObserver(schedule)
    ro.observe(canvas)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [src])

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
