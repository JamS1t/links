import { useState, type ReactNode } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'
import { ArrowUpRight, CalendarDays, Check, Copy, Globe, Mail, Share2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BrandIcon } from '@/components/brand-icons'
import { profile, projects, socials } from '@/data'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  return (
    <TooltipProvider>
      <Background />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:max-w-lg sm:pt-8">
        <TopBar />
        <Hero />
        <Actions />
        <Section title="Connect">
          <ul className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
            <LinkRow href={profile.site} icon={<Globe />} label="Portfolio" sub="sitsit.dev" />
            {socials.map((s) => (
              <LinkRow key={s.id} href={s.href} icon={<BrandIcon id={s.id} />} label={s.label} sub={s.handle} />
            ))}
            <LinkRow href={`mailto:${profile.email}`} icon={<Mail />} label="Gmail" sub={profile.email} />
          </ul>
        </Section>
        <Section
          title="Selected work"
          action={
            <a href={`${profile.site}/work/`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              See all
            </a>
          }
        >
          <ul className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
            {projects.map((p) => (
              <li key={p.name}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener"
                  className="group flex flex-col gap-1 p-4 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className={p.status === 'Building' ? 'text-xs text-[#ff6b9d]' : 'text-xs text-primary'}>{p.status}</span>
                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{p.blurb}</span>
                  <span className="text-xs text-muted-foreground/70">{p.stack.join(' · ')}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
        <footer className="mt-auto pt-4 text-sm text-muted-foreground">© {new Date().getFullYear()} {profile.name}</footer>
      </main>
      <Toaster theme="dark" position="top-center" />
    </TooltipProvider>
  )
}

// Animated WebGL mesh gradient, faded to solid background so content below stays readable.
function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <MeshGradient
        className="absolute inset-x-0 top-0 h-[70vh] w-full"
        colors={['#0f0f0f', '#00d4aa', '#00a3cc', '#ff6b9d', '#0f0f0f']}
        distortion={0.9}
        swirl={0.35}
        grainOverlay={0.12}
        speed={reducedMotion ? 0 : 0.2}
      />
      <div className="absolute inset-x-0 top-0 h-[70vh] bg-linear-to-b from-background/20 via-background/70 to-background" />
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
      <Button variant="outline" size="icon-lg" className="bg-background/40" onClick={share} aria-label="Share this page">
        <Share2 />
      </Button>
    </header>
  )
}

function Hero() {
  return (
    <section className="flex flex-col gap-5">
      <Avatar className="size-20 rounded-lg ring-1 ring-white/15 after:hidden">
        <AvatarImage src="/avatar.jpg" alt={profile.name} className="rounded-lg" />
        <AvatarFallback className="rounded-lg text-xl">JC</AvatarFallback>
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
      <Button asChild size="lg" className="h-12 text-[15px] font-semibold">
        <a href={profile.booking} target="_blank" rel="noopener">
          <CalendarDays />
          Book a 20-min intro call
        </a>
      </Button>
      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <Button asChild variant="outline" size="lg" className="h-12 bg-card text-[15px]">
          <a href={`mailto:${profile.email}?subject=Project%20inquiry`}>
            <Mail />
            Email me
          </a>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="size-12 bg-card" onClick={copyEmail} aria-label="Copy email address">
              {copied ? <Check className="text-primary" /> : <Copy />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy email</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" className="size-12 bg-card">
              <a href="/james-carl-sitsit.vcf" download aria-label="Save contact">
                <UserPlus />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save contact</TooltipContent>
        </Tooltip>
      </div>
    </section>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function LinkRow({ href, icon, label, sub }: { href: string; icon: ReactNode; label: string; sub: string }) {
  const external = href.startsWith('http')
  return (
    <li>
      <a
        href={href}
        {...(external && { target: '_blank', rel: 'noopener me' })}
        className="group flex min-h-14 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 [&_svg]:size-5"
      >
        <span className="text-muted-foreground transition-colors group-hover:text-foreground">{icon}</span>
        <span className="font-medium">{label}</span>
        <span className="ml-auto min-w-0 truncate text-sm text-muted-foreground">{sub}</span>
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
