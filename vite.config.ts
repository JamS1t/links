import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// GitHub Pages can't send response headers, so the production build carries its CSP as a meta tag.
// Build only: the dev server injects inline scripts for HMR. Keep connect-src in step with src/lib/chat.ts.
function csp(chatApi: string | undefined): Plugin {
  const connect = ["'self'", 'https://sitsit.dev', ...(chatApi ? [new URL(chatApi).origin] : [])]
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // sonner injects its stylesheet at runtime
    "img-src 'self' data: blob: https://sitsit.dev", // project posters
    "media-src 'self' https://sitsit.dev", // project reels
    "font-src 'self' data:",
    `connect-src ${[...new Set(connect)].join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ')
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }],
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react(), tailwindcss(), csp(env.VITE_CHAT_API)],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  }
})
