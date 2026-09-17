import { useState, type ReactNode } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'
import { CalendarDays, Check, ChevronRight, Copy, Globe, Mail, Share2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BrandIcon } from '@/components/brand-icons'
import { Glass, GlassFilter } from '@/components/glass'
import { profile, projects, socials, type Social } from '@/data'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  return (
    <TooltipProvider>
      <GlassFilter />
      <Background />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:max-w-lg sm:pt-8">
        <TopBar />
        <Hero />
        <Actions />
        <Section title="Connect">
          <Glass>
            <ul>
              <LinkRow href={profile.site} icon={<Globe />} tile="bg-[#00a3cc]" label="Portfolio" sub="sitsit.dev" />
              {socials.map((s) => (
                <LinkRow key={s.id} href={s.href} icon={<BrandIcon id={s.id} />} tile={tiles[s.id]} label={s.label} sub={s.handle} />
              ))}
              <LinkRow href={`mailto:${profile.email}`} icon={<Mail />} tile="bg-[#ea4335]" label="Gmail" sub={profile.email} />
            </ul>
          </Glass>
        </Section>
        <Section
          title="Selected work"
          action={
            <a href={`${profile.site}/work/`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
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
                        <span className={p.status === 'Building' ? 'text-[13px] text-[#ff9ec0]' : 'text-[13px] text-[#5eead4]'}>{p.status}</span>
                      </span>
                      <span className="text-[15px] leading-snug text-white/70">{p.blurb}</span>
                      <span className="mt-0.5 text-[13px] text-white/45">{p.stack.join(' · ')}</span>
                    </span>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-white/35" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </Glass>
        </Section>
        <footer className="mt-auto pt-4 text-sm text-muted-foreground">© {new Date().getFullYear()} {profile.name}</footer>
      </main>
      <Toaster theme="dark" position="top-center" />
    </TooltipProvider>
  )
}

// Animated WebGL mesh gradient behind the whole page so glass surfaces always have color to refract.
function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <MeshGradient
        className="absolute inset-0 size-full"
        colors={['#0f0f0f', '#00d4aa', '#00a3cc', '#ff6b9d', '#0f0f0f']}
        distortion={0.9}
        swirl={0.35}
        grainOverlay={0.12}
        speed={reducedMotion ? 0 : 0.2}
      />
      <div className="absolute inset-0 bg-linear-to-b from-background/25 via-background/45 to-background/60" />
    </div>
  )
}

function TopBar() {
  async function share() {
    const data = { title: profile.name, text: profile.role, url: location.href }
    if (navigator.share) {
      // User cancelling the share sheet rejects; nothing to report.
      await navigator.share(data).catch(() => {})
      return
    }
    await copy(location.href, 'Link copied')
  }

  return (
    <header className="flex h-12 items-center justify-between">
      <a href={profile.site} className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
        sitsit.dev
      </a>
      <Glass className="rounded-full">
        <Button variant="ghost" className="size-11 rounded-full hover:bg-transparent active:scale-95" onClick={share} aria-label="Share this page">
          <Share2 />
        </Button>
      </Glass>
    </header>
  )
}

function Hero() {
  return (
    <section className="flex flex-col gap-5">
      <Avatar className="size-22 ring-2 ring-white/20 after:hidden">
        <AvatarImage src="/avatar.jpg" alt={profile.name} />
        <AvatarFallback className="text-xl">JC</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">{profile.name}</h1>
        <p className="mt-1 text-foreground/80">{profile.role}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{profile.location}</p>
      </div>
      <p className="text-[15px] leading-relaxed text-pretty text-foreground/75">{profile.bio}</p>
      <p className="flex items-center gap-2 text-sm text-foreground/90">
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        {profile.availability}
      </p>
    </section>
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
    <section className="flex flex-col gap-2">
      <Button asChild size="lg" className="h-13 rounded-full text-[16px] font-semibold shadow-[0_8px_24px_-8px_rgb(0_212_170/0.6)] active:scale-[0.98]">
        <a href={profile.booking} target="_blank" rel="noopener">
          <CalendarDays />
          Book a 20-min intro call
        </a>
      </Button>
      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <Glass className="rounded-full">
          <Button asChild variant="ghost" size="lg" className={glassButton('w-full text-[16px]')}>
            <a href={`mailto:${profile.email}?subject=Project%20inquiry`}>
              <Mail />
              Email me
            </a>
          </Button>
        </Glass>
        <Glass className="rounded-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className={glassButton('w-13')} onClick={copyEmail} aria-label="Copy email address">
                {copied ? <Check className="text-[#5eead4]" /> : <Copy />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy email</TooltipContent>
          </Tooltip>
        </Glass>
        <Glass className="rounded-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" className={glassButton('w-13')}>
                <a href="/james-carl-sitsit.vcf" download aria-label="Save contact">
                  <UserPlus />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save contact</TooltipContent>
          </Tooltip>
        </Glass>
      </div>
    </section>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[22px] font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const tiles: Record<Social, string> = {
  linkedin: 'bg-[#0a66c2]',
  github: 'bg-[#24292f]',
  instagram: 'bg-[linear-gradient(45deg,#f9ce34,#ee2a7b_55%,#6228d7)]',
}

// iOS grouped-list separator: hairline inset past the icon, hidden on the first row.
const rowClass = (inset: string) =>
  `relative before:absolute before:right-0 before:top-0 before:h-px before:bg-white/12 first:before:hidden ${inset}`

const linkClass = (extra: string) =>
  `flex outline-none transition-colors duration-150 hover:bg-white/[0.06] focus-visible:bg-white/[0.08] active:bg-white/10 ${extra}`

const glassButton = (extra: string) =>
  `h-13 rounded-full bg-transparent text-white hover:bg-white/[0.06] active:scale-[0.97] transition-[background-color,transform] duration-200 ${extra}`

function LinkRow({ href, icon, tile, label, sub }: { href: string; icon: ReactNode; tile: string; label: string; sub: string }) {
  const external = href.startsWith('http')
  return (
    <li className={rowClass('before:left-[60px]')}>
      <a href={href} {...(external && { target: '_blank', rel: 'noopener me' })} className={linkClass('min-h-14 items-center gap-3 px-4 py-2.5')}>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-[9px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] [&_svg]:size-[18px] ${tile}`}>
          {icon}
        </span>
        <span className="text-[17px]">{label}</span>
        <span className="ml-auto min-w-0 truncate text-[15px] text-white/50">{sub}</span>
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
