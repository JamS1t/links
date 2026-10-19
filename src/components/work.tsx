import { useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Project } from '@/data'

const isLive = (s: Project['status']) => s === 'Live' || s === 'Maintained'

/** sitsit.dev's product window: the reel plays only while mostly on screen, never under reduced motion. */
function Reel({ project }: { project: Project }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause()), { threshold: 0.6 })
    io.observe(video)
    return () => io.disconnect()
  }, [])

  return (
    <div className="frame transition-[box-shadow,transform] duration-400 ease-(--ease-out-expo) group-hover:-translate-y-0.5 group-hover:shadow-(--shadow-frame-hover)">
      <div className="frame-inner relative aspect-[16/10]">
        <video
          ref={ref}
          src={project.video}
          poster={project.image}
          muted
          loop
          playsInline
          preload="none"
          aria-label={`${project.name}: ${project.tagline}`}
          className="absolute inset-0 size-full object-cover object-top"
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
      <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
