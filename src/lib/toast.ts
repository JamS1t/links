export type Toast = { id: number; text: string; error: boolean }
export const TOAST_EVENT = 'app:toast'
let next = 0

/** Shows a short status message in the <Toaster /> pill. */
export function toast(text: string, { error = false } = {}) {
  window.dispatchEvent(new CustomEvent<Toast>(TOAST_EVENT, { detail: { id: ++next, text, error } }))
}
