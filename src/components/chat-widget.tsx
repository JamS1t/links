import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from 'lucide-react'
import { AiGlow } from './ai-glow'
import { OPEN_EVENT, postChat, SITE, splitLinks, splitSSE, warmChat, type StreamEvent } from '@/lib/chat'

// Same assistant as the sitsit.dev chat widget, restyled only where this page differs.

type Message = { role: 'user' | 'assistant'; content: string }
type Notice = { text: string; form: boolean } | null

const GREETING =
  "Hi, I'm James's assistant. I can tell you about his work, or take the details of a project so he can follow up."
const STARTERS = ['What do you build?', 'Are you available?', 'I have a project']
const OFFLINE = 'The assistant is offline right now. Please use the contact form.'
const LOST = 'Connection lost. Try again.'
// Distinct from OFFLINE (the server's own 503), so the two failures can be told apart.
const UNREACHABLE = "Couldn't reach the assistant. Check your connection and try again, or use the contact form."
const MINI_KEY = 'chat:minimized'
// Past this many pixels of scroll the launcher shrinks to its icon; back near the top it expands again.
const SCROLL_MINI = 80
const LAUNCHER_SHADOW = 'shadow-[0_1px_2px_rgb(9_9_11/0.04),0_16px_40px_-20px_rgb(9_9_11/0.45)]'
const PANEL_SHADOW = 'sm:shadow-[0_1px_2px_rgb(9_9_11/0.04),0_16px_40px_-20px_rgb(9_9_11/0.12)]'

const fieldClass =
  'min-w-0 flex-1 h-11 rounded-lg bg-canvas px-3.5 border border-line-strong text-fg placeholder:text-fg-4 text-base sm:text-[15px] shadow-[0_1px_2px_rgb(9_9_11/0.04)] hover:border-[#a1a1aa] focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgb(59_79_216/0.18)] transition-[border-color,box-shadow] duration-150 disabled:opacity-60'

/** Assistant text as plain text nodes; only allow-listed links become anchors, opened in a new tab. */
function Rendered({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <a key={i} href={part.href} className="underline underline-offset-2 hover:text-accent" target="_blank" rel="noopener noreferrer">
            {part.label}
          </a>
        ),
      )}
    </>
  )
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [leadSent, setLeadSent] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [sheet, setSheet] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  const [mini, setMini] = useState(() => {
    try {
      return localStorage.getItem(MINI_KEY) === '1'
    } catch {
      return false
    }
  })
  const [scrolled, setScrolled] = useState(() => window.scrollY > SCROLL_MINI)
  const rootRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const minimizeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stopRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const onOpen = () => openPanel()
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > SCROLL_MINI
      // The minimize button unmounts when the launcher shrinks, so keep keyboard focus on the launcher.
      if (past && document.activeElement === minimizeRef.current) launcherRef.current?.focus({ preventScroll: true })
      setScrolled(past)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Below 640px the panel is a full-screen sheet, so it is modal: the page behind goes inert.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setSheet(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!open || !sheet) return
    const siblings = [...document.body.children].filter((el) => el !== rootRef.current && !el.hasAttribute('inert'))
    siblings.forEach((el) => el.setAttribute('inert', ''))
    return () => siblings.forEach((el) => el.removeAttribute('inert'))
  }, [open, sheet])

  // The input is disabled while a reply streams, so focus moves to Stop; Esc keeps working.
  useEffect(() => {
    if (open) (streaming ? stopRef : inputRef).current?.focus()
  }, [streaming, open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, notice])

  function setMinimized(v: boolean) {
    setMini(v)
    try {
      localStorage.setItem(MINI_KEY, v ? '1' : '0')
    } catch {}
    requestAnimationFrame(() => launcherRef.current?.focus())
  }

  function openPanel() {
    if (panelRef.current) return inputRef.current?.focus() // already open
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(true)
    warmChat()
  }

  function close() {
    // Closing ends the reply, so a hidden panel never keeps spending tokens.
    abortRef.current?.abort()
    setOpen(false)
    const opener = openerRef.current
    requestAnimationFrame(() =>
      (opener?.isConnected && opener !== document.body ? opener : launcherRef.current)?.focus({ preventScroll: true }),
    )
  }

  function appendToLast(v: string) {
    setMessages((m) => {
      const copy = m.slice()
      const last = copy[copy.length - 1]
      copy[copy.length - 1] = { ...last, content: last.content + v }
      return copy
    })
  }

  function replaceLast(v: string) {
    setMessages((m) => [...m.slice(0, -1), { role: 'assistant', content: v }])
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || streaming) return
    const before = messages
    const history: Message[] = [...messages, { role: 'user', content }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setNotice(null)
    setStreaming(true)
    const ac = new AbortController()
    abortRef.current = ac
    let finished = false
    let reply = ''
    try {
      const res = await postChat(JSON.stringify({ messages: history, leadSent }), ac.signal)
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        setMessages(before)
        setInput(content)
        setNotice({ text: err?.error ?? OFFLINE, form: true })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        const { events, rest } = splitSSE(buffer + decoder.decode(value, { stream: true }))
        buffer = rest
        for (const data of events) {
          let e: StreamEvent
          try {
            e = JSON.parse(data)
          } catch {
            continue
          }
          if (e.type === 'text') {
            reply += e.v
            appendToLast(e.v)
          } else if (e.type === 'replace') {
            reply = e.v
            replaceLast(e.v)
          } else if (e.type === 'lead') {
            if (e.ok) setLeadSent(true)
            else setNotice({ text: 'Your details did not reach James. Please use the contact form.', form: true })
          } else if (e.type === 'error') setNotice((n) => (n?.form ? n : { text: LOST, form: false }))
          else if (e.type === 'done') finished = true
        }
      }
      if (!finished) setNotice((n) => (n?.form ? n : { text: LOST, form: false }))
    } catch {
      if (!ac.signal.aborted) {
        // A network or CORS failure never reached the assistant: restore the message like an error reply.
        setMessages(before)
        setInput(content)
        setNotice({ text: UNREACHABLE, form: true })
      }
    } finally {
      abortRef.current = null
      setStreaming(false)
      setMessages((m) => (m[m.length - 1]?.role === 'assistant' && !m[m.length - 1].content ? m.slice(0, -1) : m))
      setAnnounce('')
      if (finished && reply.trim()) requestAnimationFrame(() => setAnnounce(reply))
    }
  }

  // A visitor's own minimize sticks; scrolling only shrinks the launcher while they read.
  const compact = mini || scrolled
  const showStarters = !messages.some((m) => m.role === 'user')

  // Portaled to <body> so the mobile sheet can make the rest of the page inert.
  return createPortal(
    <div ref={rootRef}>
      {!open && (
        <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex items-center gap-2 sm:right-5 sm:bottom-5">
          {!compact && (
            <button
              ref={minimizeRef}
              type="button"
              onClick={() => setMinimized(true)}
              className="flex size-8 items-center justify-center rounded-full bg-canvas text-fg-3 shadow-[inset_0_0_0_1px_var(--color-line-strong),0_1px_2px_rgb(9_9_11/0.04)] hover:text-fg"
              aria-label="Minimize chat button"
            >
              <X className="size-4" />
            </button>
          )}
          <AiGlow className={LAUNCHER_SHADOW}>
            <button
              ref={launcherRef}
              type="button"
              onClick={openPanel}
              className={`btn btn-primary ${compact ? 'w-11 !p-0' : ''}`}
              aria-haspopup="dialog"
              aria-label={compact ? 'Ask about my work' : undefined}
            >
              {compact ? <Sparkles className="!size-5" /> : <><Sparkles className="text-[#c7cdf8]" />Ask about my work</>}
            </button>
          </AiGlow>
        </div>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal={sheet}
          aria-labelledby="chat-title"
          onKeyDown={(e) => e.key === 'Escape' && close()}
          tabIndex={-1}
          className={`chat-panel fixed inset-0 z-50 flex flex-col bg-canvas focus:outline-none sm:inset-auto sm:right-5 sm:bottom-5 sm:h-[min(600px,calc(100dvh-2.5rem))] sm:w-[380px] sm:rounded-2xl sm:border sm:border-line ${PANEL_SHADOW}`}
        >
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
          <div className="flex items-center justify-between border-b border-line px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:pt-4">
            <div>
              <p id="chat-title" className="font-medium text-fg">
                James&rsquo;s assistant
              </p>
              <p className="text-[13px] text-fg-4">AI assistant. James follows up by email.</p>
            </div>
            <button type="button" onClick={close} className="rounded-full p-2 text-fg-3 hover:bg-muted hover:text-fg" aria-label="Close chat">
              <X className="size-5" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-4 overflow-y-auto px-5 py-5 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin]"
          >
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-fg-2">{GREETING}</p>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-fg">
                  {m.content}
                </p>
              ) : (
                <p key={i} className="text-[15px] leading-relaxed whitespace-pre-wrap text-fg-2">
                  {m.content ? <Rendered text={m.content} /> : <span className="text-fg-4">Thinking&hellip;</span>}
                </p>
              ),
            )}
            {showStarters && (
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTERS.map((s) => (
                  <button key={s} type="button" className="btn btn-secondary btn-sm" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {notice && (
              <p className="text-sm text-fg-3" role="status">
                {notice.text}{' '}
                {notice.form && (
                  <a href={`${SITE}/#contact`} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-fg">
                    Open the contact form
                  </a>
                )}
              </p>
            )}
          </div>

          <form
            className="flex gap-2 border-t border-line px-4 pt-4 pb-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Your message
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              disabled={streaming}
              placeholder="Ask about projects or availability"
              className={fieldClass}
              autoComplete="off"
            />
            {streaming ? (
              <button ref={stopRef} type="button" className="btn btn-secondary" onClick={() => abortRef.current?.abort()}>
                Stop
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
                Send
              </button>
            )}
          </form>
          <p className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-fg-4">
            Messages are processed by an AI provider.{' '}
            <a href={`${SITE}/privacy/`} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-fg">
              Privacy
            </a>
          </p>
        </div>
      )}
    </div>,
    document.body,
  )
}
