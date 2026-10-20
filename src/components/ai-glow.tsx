import type { ReactNode } from 'react'

/** The "AI" treatment for assistant buttons: an indigo gradient border that slowly rotates, with a soft blurred
 *  halo that breathes behind it. Pure CSS (.ai-glow in index.css), transform and opacity only, so it stays
 *  smooth on phones; static under reduced motion. Wrap one button; it fills the ring. */
export function AiGlow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`ai-glow ${className}`}>
      <span aria-hidden className="ai-glow-ring" />
      {children}
    </span>
  )
}
