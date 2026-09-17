import { useState, type ReactNode } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'
import { CalendarDays, Check, ChevronRight, Copy, Globe, Mail, MapPin, Share2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { BrandIcon } from '@/components/brand-icons'
import { Glass, GlassFilter } from '@/components/glass'
import { highlights, profile, projects, socials } from '@/data'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const shadow = '[text-shadow:0_1px_12px_rgb(0_0_0/0.6)]'

export default function App() {
  return (
    <>
      <GlassFilter />
      <Background />
      <div className="relative mx-auto w-full sm:max-w-lg sm:px-4 sm:pt-6">
        <Cover />
      </div>
      <main className="relative mx-auto flex w-full max-w-md flex-col gap-8 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:max-w-lg">
        <p className="px-1 text-[16px] leading-relaxed text-pretty text-white/80">{profile.bio}</p>
        <Actions />
        <Glass>
          <dl className="grid grid-cols-3 divide-x divide-white/12 py-4 text-center">
            {highlights.map((h) => (
              <div key={h.label} className="flex flex-col-reverse gap-0.5">
                <dt className="text-[12px] text-white/55">{h.label}</dt>
                <dd className="text-[19px] font-semibold tracking-tight">{h.value}</dd>
              </div>
            ))}
          </dl>
        </Glass>
        <Section title="Connect">
          <Glass>
            <ul>
              <LinkRow href={profile.site} icon={<Globe />} label="Portfolio" sub="sitsit.dev" />
              {socials.map((s) => (
                <LinkRow key={s.id} href={s.href} icon={<BrandIcon id={s.id} />} label={s.label} sub={s.handle} />
              ))}
              <LinkRow href={`mailto:${profile.email}`} icon={<Mail />} label="Gmail" sub={profile.email} />
            </ul>
          </Glass>
        </Section>
        <Section
          title="Selected work"
          action={
            <a href={`${profile.site}/work/`} className={`text-[15px] text-white/80 transition-colors ${shadow} hover:text-white`}>
              See all
            </a>
          }
        >
          <Glass>
            <ul>
              {projects.map((p) => (
                <li key={p.name} className={rowClass('before:left-4')}>
                  <a href={p.href} target="_blank" rel="noopener" className={linkClass('items-start gap-3 px-4 py-3.5')}>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="text-[17px] font-semibold tracking-tight">{p.name}</span>
                        <span className={p.status === 'Building' ? 'text-[13px] text-white/45' : 'text-[13px] text-white/70'}>{p.status}</span>
                      </span>
                      <span className="text-[15px] leading-snug text-white/80">{p.blurb}</span>
                      <span className="mt-0.5 text-[13px] text-white/55">{p.stack.join(' · ')}</span>
                    </span>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-white/35" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </Glass>
        </Section>
        <footer className="pt-4 text-center text-[13px] text-white/55">© {new Date().getFullYear()} {profile.name}</footer>
      </main>
      <Toaster theme="dark" position="top-center" />
    </>
  )
}

// Animated WebGL mesh gradient behind the whole page so glass surfaces always have something to refract.
function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <MeshGradient
        className="absolute inset-0 size-full"
        colors={['#0a0a0b', '#23262c', '#3d424c', '#8d939e', '#0a0a0b']}
        distortion={0.9}
        swirl={0.35}
        grainOverlay={0.14}
        speed={reducedMotion ? 0 : 0.2}
      />
      <div className="absolute inset-0 bg-linear-to-b from-background/30 via-background/35 to-background/60" />
    </div>
  )
}

// Apple Music artist-page header: edge-to-edge photo fading into the page, name set over it.
function Cover() {
  async function share() {
    const data = { title: profile.name, text: profile.role, url: location.href }
    if (navigator.share) {
      // User cancelling the share sheet rejects; nothing to report.
      await navigator.share(data).catch(() => {})
      return
    }
    await copy(location.href, 'Link copied')
  }

  const split = profile.name.lastIndexOf(' ')

  return (
    <header className="relative isolate aspect-[4/5] max-h-[82svh] w-full overflow-hidden sm:rounded-t-[32px]">
      {/* Masked (not overlaid) fade, so the photo dissolves into the live gradient without a seam. */}
      <div aria-hidden className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent_92%)]">
        <img src="/cover.jpg" alt="" className="h-full w-full object-cover object-[50%_0%] brightness-90 contrast-[1.05] saturate-[0.75]" />
        <div className="absolute inset-0 bg-linear-to-b from-black/45 via-transparent via-25% to-black/60" />
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <a href={profile.site} className={`text-[15px] font-semibold text-white transition-opacity ${shadow} hover:opacity-80`}>
          sitsit.dev
        </a>
        <Glass className="rounded-full">
          <Button variant="ghost" className="size-11 rounded-full text-white hover:bg-transparent active:scale-95" onClick={share} aria-label="Share this page">
            <Share2 />
          </Button>
        </Glass>
      </div>
      <div className={`absolute inset-x-0 bottom-0 px-5 pb-5 ${shadow}`}>
        <p className="mb-3 flex items-center gap-2 text-[13px] font-medium text-white/85">
          <span className="size-1.5 rounded-full bg-white" aria-hidden />
          {profile.availability}
        </p>
        <h1 className="text-[48px] leading-[0.95] font-bold tracking-[-0.035em]">
          {profile.name.slice(0, split)}
          <br />
          {profile.name.slice(split + 1)}
        </h1>
        <p className="mt-3 text-[17px] text-white/90">{profile.role}</p>
        <p className="mt-1 flex items-center gap-1 text-[15px] text-white/65">
          <MapPin className="size-3.5" aria-hidden />
          {profile.location}
        </p>
      </div>
    </header>
  )
}

function Actions() {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    if (await copy(profile.email, 'Email copied')) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <section className="flex flex-col gap-2.5">
      <Button
        asChild
        size="lg"
        className="h-13 rounded-full bg-white text-[16px] font-semibold text-[#0a0a0b] shadow-[0_8px_24px_-10px_rgb(0_0_0/0.8)] hover:bg-white/90 active:scale-[0.98]"
      >
        <a href={profile.booking} target="_blank" rel="noopener">
          <CalendarDays />
          Book a 20-min intro call
        </a>
      </Button>
      <div className="grid grid-cols-3 gap-2.5">
        <ActionTile label="Email" icon={<Mail />} href={`mailto:${profile.email}?subject=Project%20inquiry`} />
        <ActionTile label={copied ? 'Copied' : 'Copy email'} icon={copied ? <Check /> : <Copy />} onClick={copyEmail} />
        <ActionTile label="Save contact" icon={<UserPlus />} href="/james-carl-sitsit.vcf" download />
      </div>
    </section>
  )
}

// iOS Contacts-style action: glass tile, icon over a small label.
function ActionTile({ label, icon, href, download, onClick }: { label: string; icon: ReactNode; href?: string; download?: boolean; onClick?: () => void }) {
  const cls =
    'flex h-[68px] w-full flex-col items-center justify-center gap-1.5 text-[13px] font-medium text-white outline-none transition-[background-color,transform] duration-200 hover:bg-white/[0.06] focus-visible:bg-white/10 active:scale-[0.96] [&_svg]:size-5'
  return (
    <Glass className="rounded-[20px]">
      {href ? (
        <a href={href} download={download} className={cls}>
          {icon}
          {label}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={cls}>
          {icon}
          {label}
        </button>
      )}
    </Glass>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className={`text-[22px] font-bold tracking-tight ${shadow}`}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// iOS grouped-list separator: hairline inset past the icon, hidden on the first row.
const rowClass = (inset: string) =>
  `relative before:absolute before:right-0 before:top-0 before:h-px before:bg-white/12 first:before:hidden ${inset}`

const linkClass = (extra: string) =>
  `flex outline-none transition-colors duration-150 hover:bg-white/[0.06] focus-visible:bg-white/[0.08] active:bg-white/10 ${extra}`

function LinkRow({ href, icon, label, sub }: { href: string; icon: ReactNode; label: string; sub: string }) {
  const external = href.startsWith('http')
  return (
    <li className={rowClass('before:left-[60px]')}>
      <a href={href} {...(external && { target: '_blank', rel: 'noopener me' })} className={linkClass('min-h-14 items-center gap-3 px-4 py-2.5')}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-linear-to-b from-[#5b6270] to-[#2a2d34] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] [&_svg]:size-[18px]">
          {icon}
        </span>
        <span className="text-[17px]">{label}</span>
        <span className="ml-auto min-w-0 truncate text-[15px] text-white/65">{sub}</span>
        <ChevronRight className="size-4 shrink-0 text-white/35" aria-hidden />
      </a>
    </li>
  )
}

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(message)
    return true
  } catch {
    toast.error("Couldn't copy. Long-press the address instead.")
    return false
  }
}
