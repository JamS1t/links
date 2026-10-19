import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Project } from '@/data'

const isLive = (s: Project['status']) => s === 'Live' || s === 'Maintained'

// Reels are a nice-to-have: skip them for reduced motion, Save-Data, or a 2G-class connection (the poster stays).
function reelsAllowed() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !(c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? ''))
}

/** sitsit.dev's product window. The poster is a lazy <img>; the video file is only attached once the card is
 *  mostly on screen, plays only while it stays there (so one reel at a time in the row), and fades in over the
 *  poster once it is actually playing. Paused while the tab is hidden. */
function Reel({ project }: { project: Project }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video || !reelsAllowed()) return
    let visible = false
    const sync = () => {
      if (visible && !document.hidden) {
        if (!video.src) video.src = project.video!
        video.play().catch(() => {}) // iOS Low Power Mode refuses autoplay: the poster stays
      } else if (!video.paused) video.pause()
    }
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        sync()
      },
      { threshold: 0.6 },
    )
    io.observe(video)
    document.addEventListener('visibilitychange', sync)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [project.video])

  return (
    <div className="frame transition-[box-shadow,transform] duration-400 ease-(--ease-out-expo) group-hover:-translate-y-0.5 group-hover:shadow-(--shadow-frame-hover)">
      <div className="frame-inner relative aspect-[16/10]">
        <img
          src={project.image}
          alt={`${project.name}: ${project.tagline}`}
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-top"
        />
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-300 ${playing ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </div>
  )
}

/** Projects with reels as a swipeable row of product windows; the rest as a compact list. */
export function Work({ projects }: { projects: Project[] }) {
  const withMedia = projects.filter((p) => p.video)
  const rest = projects.filter((p) => !p.video)

  return (
    <div className="flex flex-col gap-5">
      <ul className="-mx-5 flex snap-x overscroll-x-contain snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {withMedia.map((p) => (
          <li key={p.name} className="w-[84%] shrink-0 snap-start sm:w-[78%]">
            <a href={p.href} target="_blank" rel="noopener" className="group flex flex-col gap-3">
              <Reel project={p} />
              <span className="flex flex-col gap-1 px-0.5">
                <span className="flex items-baseline gap-2.5">
                  <span className="text-[17px] font-semibold tracking-tight transition-colors group-hover:text-accent">{p.name}</span>
                  <span className={isLive(p.status) ? 'status is-live' : 'status'}>{p.status}</span>
                </span>
                <span className="text-[15px] leading-snug text-fg-3">{p.tagline}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <ul className="panel">
          {rest.map((p) => (
            <li key={p.name} className="border-t border-line first:border-t-0">
              <a href={p.href} target="_blank" rel="noopener" className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-subtle">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline gap-2.5">
                    <span className="text-[16px] font-semibold tracking-tight transition-colors group-hover:text-accent">{p.name}</span>
                    <span className={isLive(p.status) ? 'status is-live' : 'status'}>{p.status}</span>
                  </span>
                  <span className="text-[14px] leading-snug text-fg-3">{p.tagline}</span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-fg-4" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
