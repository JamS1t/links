// Client side of the sitsit.dev assistant. The API lives on sitsit.dev (Vercel), which
// allows this origin over CORS; keep these helpers in step with src/lib/agent/{sse,links}.ts there.

export const SITE = 'https://sitsit.dev'
// Override for local dev (e.g. http://localhost:3000/api/chat/ with CHAT_CORS_ORIGINS set there).
export const CHAT_API: string = import.meta.env.VITE_CHAT_API || `${SITE}/api/chat/`
export const OPEN_EVENT = 'chat:open'

/** Opens the chat panel from anywhere on the page. */
export function openChat() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

const CAL_URL = 'https://cal.com/sitsit.dev/intro'

export type StreamEvent =
  | { type: 'text'; v: string }
  | { type: 'lead'; ok: boolean }
  | { type: 'error' }
  | { type: 'replace'; v: string }
  | { type: 'done' }

/** Splits buffered stream text into complete `data:` payloads; the unfinished last line comes back as `rest`. */
export function splitSSE(buffer: string): { events: string[]; rest: string } {
  const lines = buffer.split('\n')
  const rest = lines.pop() ?? ''
  const events: string[] = []
  for (const raw of lines) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw
    if (line.startsWith('data:')) events.push(line.slice(5).trimStart())
  }
  return { events, rest }
}

export type LinkPart = string | { href: string; label: string }

// Only sitsit.dev case-study paths and the booking URL become links, and only as whole tokens.
const LINK_RE =
  /(?<![\w.:/-])(?:(?:https:\/\/(?:www\.)?sitsit\.dev)?(\/work\/[a-z0-9-]+\/)|(https:\/\/cal\.com\/sitsit\.dev\/intro))(?![\w/-])/g

/** Splits a reply into plain text and allow-listed links. Paths resolve against sitsit.dev, since this page has no /work/. */
export function splitLinks(text: string): LinkPart[] {
  const parts: LinkPart[] = []
  let last = 0
  for (const m of text.matchAll(LINK_RE)) {
    const i = m.index ?? 0
    if (i > last) parts.push(text.slice(last, i))
    parts.push({ href: m[1] ? SITE + m[1] : CAL_URL, label: m[0] })
    last = i + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}
