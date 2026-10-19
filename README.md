# links

Personal link page for James Carl Sitsit, live at https://hi.sitsit.dev.

Vite + React + shadcn/ui. Content lives in `src/data.ts`. Pushing to `main` deploys to GitHub Pages.

```bash
npm install
npm run dev
```

Styled to match sitsit.dev (white, zinc, one indigo accent, Geist). The "Ask my AI assistant" chat calls the
sitsit.dev assistant at `https://sitsit.dev/api/chat/`, which allows this origin over CORS. To point it at a local
sitsit.dev in dev, set `VITE_CHAT_API=http://localhost:3000/api/chat/` here and `CHAT_CORS_ORIGINS=http://localhost:5173` there.

The production build adds a Content-Security-Policy meta tag (`vite.config.ts`), since GitHub Pages can't send headers.
