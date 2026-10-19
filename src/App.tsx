import { useState, type ReactNode } from 'react'
import { ArrowUpRight, CalendarDays, Check, ChevronRight, Copy, Globe, Mail, MapPin, MessageCircle, Share2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { AsciiPortrait } from '@/components/ascii-portrait'
import { BrandIcon } from '@/components/brand-icons'
import { ChatWidget } from '@/components/chat-widget'
import { openChat } from '@/lib/chat'
import { highlights, profile, projects, socials } from '@/data'

export default function App() {
  return (
    <>
      <Cover />
      <div className="relative mx-auto w-full max-w-lg">
        <TopBar />
        {/* Spacer: the pinned portrait shows through here before the white sheet scrolls over it. */}
        <div aria-hidden className="aspect-[4/5] max-h-[62svh] w-full" />
        <main className="relative flex flex-col gap-10 bg-canvas px-5 pt-2 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-24 before:h-24 before:bg-linear-to-b before:from-transparent before:to-canvas">
          <Intro />
          <Actions />
          <dl className="panel grid grid-cols-3 divide-x divide-line py-4 text-center">
            {highlights.map((h) => (
              <div key={h.label} className="flex flex-col-reverse gap-0.5">
                <dt className="text-[13px] text-fg-4">{h.label}</dt>
                <dd className="text-[19px] font-semibold tracking-tight tabular-nums">{h.value}</dd>
              </div>
            ))}
          </dl>
          <Section title="Connect">
            <ul className="panel">
              <LinkRow href={profile.site} icon={<Globe />} label="Portfolio" sub="sitsit.dev" />
              {socials.map((s) => (
                <LinkRow key={s.id} href={s.href} icon={<BrandIcon id={s.id} />} label={s.label} sub={s.handle} />
              ))}
              <LinkRow href={`mailto:${profile.email}`} icon={<Mail />} label="Email" sub={profile.email} />
            </ul>
          </Section>
          <Section
            title="Selected work"
            action={
              <a href={`${profile.site}/work/`} className="inline-flex items-center gap-1 text-[14px] font-medium text-fg transition-colors hover:text-accent">
                See all
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            }
          >
            <ul className="panel">
              {projects.map((p) => (
                <li key={p.name} className="border-t border-line first:border-t-0">
                  <a href={p.href} target="_blank" rel="noopener" className="group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-subtle">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-baseline gap-2.5">
                        <span className="text-[17px] font-semibold tracking-tight transition-colors group-hover:text-accent">{p.name}</span>
                        <span className={p.status === 'Building' ? 'status' : 'status is-live'}>{p.status}</span>
                      </span>
                      <span className="text-[15px] leading-snug text-fg-3">{p.blurb}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.stack.map((s) => (
                          <span key={s} className="chip">
                            {s}
                          </span>
                        ))}
                      </span>
                    </span>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-fg-4" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </Section>
          <footer className="text-center text-[13px] text-fg-4">
            © {new Date().getFullYear()} {profile.name}
          </footer>
        </main>
      </div>
      <ChatWidget />
      <Toaster theme="light" position="top-center" />
    </>
  )
}

// The portrait, always as ASCII, pinned behind the page. The white sheet scrolls up over it.
function Cover() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 mx-auto aspect-[4/5] max-h-[78svh] w-full max-w-lg overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
    >
      <AsciiPortrait src="/cover.jpg" ink="dark" intensity={1.25} className="cover-ascii absolute inset-0 size-full" />
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
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <a href={profile.site} className="rounded-full bg-canvas/85 px-3 py-1.5 text-[15px] font-semibold tracking-tight text-fg backdrop-blur transition-colors hover:text-accent">
        sitsit.dev
      </a>
      <button type="button" onClick={share} aria-label="Share this page" className="btn btn-secondary size-11 !p-0">
        <Share2 />
      </button>
    </div>
  )
}

function Intro() {
  return (
    <header className="enter flex flex-col gap-4">
      <p className="text-[13px] font-medium text-fg">{profile.availability}</p>
      <h1 className="text-[44px] leading-[1.02] tracking-[-0.04em]">
        {profile.name}
        <span className="mt-1.5 block text-[21px] leading-tight sm:text-[24px] tracking-[-0.03em] text-fg-4">{profile.role}</span>
      </h1>
      <p className="flex items-center gap-1.5 text-[14px] text-fg-3">
        <MapPin className="size-3.5" aria-hidden />
        {profile.location}
      </p>
      <p className="text-[17px] leading-relaxed text-fg-2">{profile.bio}</p>
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
      <a href={profile.booking} target="_blank" rel="noopener" className="btn btn-primary btn-lg w-full">
        <CalendarDays />
        Book a 20-min intro call
      </a>
      <button type="button" onClick={openChat} className="btn btn-secondary btn-lg w-full">
        <MessageCircle />
        Ask my AI assistant
      </button>
      <div className="grid grid-cols-3 gap-2.5">
        <ActionTile label="Email" icon={<Mail />} href={`mailto:${profile.email}?subject=Project%20inquiry`} />
        <ActionTile label={copied ? 'Copied' : 'Copy email'} icon={copied ? <Check /> : <Copy />} onClick={copyEmail} />
        <ActionTile label="Save contact" icon={<UserPlus />} href="/james-carl-sitsit.vcf" />
      </div>
    </section>
  )
}

function ActionTile({ label, icon, href, onClick }: { label: string; icon: ReactNode; href?: string; onClick?: () => void }) {
  const cls =
    'flex h-[68px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-canvas text-[13px] font-medium text-fg-2 transition-colors duration-150 hover:border-line-strong hover:bg-subtle hover:text-fg [&_svg]:size-5'
  return href ? (
    <a href={href} className={cls}>
      {icon}
      {label}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {icon}
      {label}
    </button>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] tracking-[-0.03em]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function LinkRow({ href, icon, label, sub }: { href: string; icon: ReactNode; label: string; sub: string }) {
  const external = href.startsWith('http')
  return (
    <li className="border-t border-line first:border-t-0">
      <a
        href={href}
        {...(external && { target: '_blank', rel: 'noopener me' })}
        className="group flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-subtle"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-fg-2 [&_svg]:size-[18px]">{icon}</span>
        <span className="text-[16px] font-medium transition-colors group-hover:text-accent">{label}</span>
        <span className="ml-auto min-w-0 truncate text-[14px] text-fg-4">{sub}</span>
        <ChevronRight className="size-4 shrink-0 text-fg-4" aria-hidden />
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
