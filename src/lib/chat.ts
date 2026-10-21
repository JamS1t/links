// Client side of the sitsit.dev assistant. The API lives on sitsit.dev (Vercel), which
// allows this origin over CORS; keep these helpers in step with src/lib/agent/{sse,links}.ts there.

export const SITE = 'https://sitsit.dev'
// Override for local dev (e.g. http://localhost:3000/api/chat/ with CHAT_CORS_ORIGINS set there).
// Otherwise try the apex, then www: if Vercel redirects one to the other, the browser won't follow
// a redirect on a CORS preflight, so the request has to go straight to the host that answers.
const CHAT_APIS: string[] = import.meta.env.VITE_CHAT_API
  ? [import.meta.env.VITE_CHAT_API]
  : [`${SITE}/api/chat/`, 'https://www.sitsit.dev/api/chat/']
let working = 0

/** POSTs to the chat API. Moves on to the next host only when the request never got a response
 *  (network or CORS failure), so the server can't have run it twice. Remembers the host that worked. */
export async function postChat(body: string, signal: AbortSignal): Promise<Response> {
  let lastError: unknown
  for (let n = 0; n < CHAT_APIS.length; n++) {
    const i = (working + n) % CHAT_APIS.length
    try {
      const res = await fetch(CHAT_APIS[i], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal,
        credentials: 'omit',
      })
      working = i
      return res
    } catch (e) {
      if (signal.aborted) throw e
      console.warn(`chat: ${CHAT_APIS[i]} unreachable`, e)
      lastError = e
    }
  }
  throw lastError
}

/** Wakes the chat function while the visitor types, so the first reply skips the cold start.
 *  The API answers 204 without calling a model. no-cors: the response is never read. */
export function warmChat() {
  fetch(CHAT_APIS[working], { method: 'GET', mode: 'no-cors', cache: 'no-store', credentials: 'omit' }).catch(() => {})
}
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
