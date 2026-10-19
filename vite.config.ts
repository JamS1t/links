import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import preact from '@preact/preset-vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// GitHub Pages can't send response headers, so the production build carries its CSP as a meta tag.
// Build only: the dev server injects inline scripts for HMR. Keep connect-src in step with src/lib/chat.ts.
function csp(chatApi: string | undefined): Plugin {
  const site = 'https://sitsit.dev https://www.sitsit.dev' // chat API; either host may redirect to the other on Vercel
  const connect = ["'self'", site, ...(chatApi ? [new URL(chatApi).origin] : [])]
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // sonner injects its stylesheet at runtime
    "img-src 'self' data: blob:",
    "media-src 'self'", // reels are served from this site (public/work)
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

// Preload the Latin Geist file so text paints in the right face without a late swap.
function preloadFont(): Plugin {
  return {
    name: 'preload-font',
    apply: 'build',
    transformIndexHtml(_html, ctx) {
      const file = Object.keys(ctx.bundle ?? {}).find((f) => /geist-latin-wght-normal-.*\.woff2$/.test(f))
      return file ? [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' }, injectTo: 'head' }] : []
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    // Preact runs the React code through preact/compat at ~1/10th of react-dom's size. TypeScript still checks against React's types.
    plugins: [preact({ prerender: { enabled: false } }), tailwindcss(), csp(env.VITE_CHAT_API), preloadFont()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  }
})
