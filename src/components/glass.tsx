import type { PointerEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Web take on Apple's Liquid Glass: refracted + blurred backdrop, tint, specular rim, pointer sheen (see .glass in index.css).
export function Glass({ className, children }: { className?: string; children: ReactNode }) {
  function track(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div className={cn('glass', className)} onPointerMove={track}>
      <div aria-hidden className="glass-refract" />
      <div aria-hidden className="glass-tint" />
      {children}
    </div>
  )
}

// Rendered once; referenced by .glass-refract via filter: url(#glass-distortion).
export function GlassFilter() {
  return (
    <svg aria-hidden className="absolute size-0">
      <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2.5" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="46" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
