# NFC business card

Print files for a front/back NFC card that matches hi.sitsit.dev.

| File | Use |
|---|---|
| `export/front-print.png` | Front, full bleed, send to printer |
| `export/back-print.png` | Back, full bleed, send to printer |
| `export/preview.png` | Trimmed mockup of both sides, for sharing, not for print |

## Print specs

- **Card:** CR80, 85.6 × 54 mm, corner radius 3.18 mm
- **Files:** 89.6 × 58 mm (2 mm bleed per side), 2117 × 1370 px, 600 dpi, RGB PNG
- **Safe area:** all text sits at least 3 mm inside the trim line
- **QR:** points to `https://hi.sitsit.dev`, error correction Q; decodes at full resolution down to 1/6 scale
- **NFC chip:** program it with the URL `https://hi.sitsit.dev` (NDEF URI record). Any NFC Tools app can write it.

Notes for the printer:
- The background is near-black (#0a0a0b). Ask for **rich black** so it doesn't print as dull grey after CMYK conversion.
- If the printer needs 3 mm bleed, re-export with `inset: 60px` in `.safe` and a 916 × 600 px sheet.

## Editing and re-exporting

Source: `card.html`, `src/card/main.tsx`, `src/card/card.css` (1 mm = 10 px). Name, title and links come from `src/data.ts`.

1. `npm run dev`, open `/card.html` to see the preview.
2. Export each side at 600 dpi by rendering `/card.html?side=front` and `?side=back` in a 896 × 580 viewport at device scale factor 2.3622.
