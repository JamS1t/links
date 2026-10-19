import { useEffect, useState } from 'react'
import { TOAST_EVENT as EVENT, type Toast } from '@/lib/toast'

// A one-line status pill for copy/share feedback. Replaces sonner (~68 KB of source) for two messages.

export function Toaster() {
  const [current, setCurrent] = useState<Toast | null>(null)

  useEffect(() => {
    let timer = 0
    const on = (e: Event) => {
      setCurrent((e as CustomEvent<Toast>).detail)
      clearTimeout(timer)
      timer = window.setTimeout(() => setCurrent(null), 2200)
    }
    window.addEventListener(EVENT, on)
    return () => {
      window.removeEventListener(EVENT, on)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4">
      {current && (
        <p
          key={current.id}
          className={`toast-in rounded-full bg-fg px-4 py-2.5 text-[14px] font-medium shadow-[0_8px_24px_-8px_rgb(9_9_11/0.35)] ${current.error ? 'text-[#fecaca]' : 'text-canvas'}`}
        >
          {current.text}
        </p>
      )}
    </div>
  )
}
