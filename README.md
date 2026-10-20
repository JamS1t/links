# links

Personal link page for James Carl Sitsit, live at https://hi.sitsit.dev.

Vite + React code running on Preact (via `@preact/preset-vite`, ~22 KB gzipped JS) + Tailwind. Content lives in `src/data.ts`. Pushing to `main` deploys to GitHub Pages.

```bash
npm install
npm run dev
```

Styled to match sitsit.dev (white, zinc, one indigo accent, Geist). The "Ask my AI assistant" chat calls the
sitsit.dev assistant at `https://sitsit.dev/api/chat/`, which allows this origin over CORS. To point it at a local
sitsit.dev in dev, set `VITE_CHAT_API=http://localhost:3000/api/chat/` here and `CHAT_CORS_ORIGINS=http://localhost:5173` there.

The production build adds a Content-Security-Policy meta tag (`vite.config.ts`), since GitHub Pages can't send headers.

## Performance notes

- **Project reels** in `public/work/` are phone-sized copies of sitsit.dev's 1600px masters: 800px, 30fps, H.264
  (hardware-decoded on every phone), no audio, faststart. Each one only downloads once its card is on screen, only the
  card in view plays, and none load under Save-Data, 2G or reduced motion. To refresh one from the sitsit-dev repo:

  ```bash
  ffmpeg -i ../sitsit-dev/public/work/NAME.mp4 -an -vf "fps=30,scale=800:-2:flags=lanczos" \
    -c:v libx264 -profile:v high -preset veryslow -crf 27 -pix_fmt yuv420p -movflags +faststart -g 60 public/work/NAME.mp4
  ```

  Posters are the sitsit.dev `.webp` resized to 800px at quality 72.
- **ASCII cover** samples `public/cover-ascii.jpg` (grayscale, 400px; the sampler only needs luminance), with the
  background cut out to flat white so the head reads as a clean silhouette; `public/cover.jpg` (the print card) is the
  same crop in colour. The live
  version pre-renders glyphs into an atlas and caches the portrait, so a frame is a blit plus a few twinkling cells. Every few seconds the eyes blink: the cells in
  the eye boxes (`EYES` in `src/App.tsx`) are redrawn as eyelid for about 300ms, at full frame rate. It runs at 24fps, drops to 15fps on slow devices, and pauses while hidden or scrolled away.
