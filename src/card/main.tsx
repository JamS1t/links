import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import QRCode from 'qrcode'
import { Globe, Mail, MapPin } from 'lucide-react'
import '@fontsource-variable/schibsted-grotesk'
import { AsciiPortrait } from '@/components/ascii-portrait'
import { BrandIcon } from '@/components/brand-icons'
import { profile, socials } from '@/data'
import './card.css'

const QR_TARGET = 'https://hi.sitsit.dev'
const side = new URLSearchParams(location.search).get('side')

function NfcIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
      <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
      <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
      <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
    </svg>
  )
}

// Dot-module QR with rounded finder "eyes". Error correction Q so the styling keeps plenty of scan margin.
function Qr({ text }: { text: string }) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'Q' })
  const n = modules.size
  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)
  const dots = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules.get(r, c) && !inFinder(r, c)) dots.push(<circle key={`${r}-${c}`} cx={c + 0.5} cy={r + 0.5} r={0.48} />)
    }
  }
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={2} fill="none" stroke="currentColor" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={1} />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${n} ${n}`} fill="currentColor" className="qr" aria-label={`QR code for ${text}`}>
      {dots}
      {eye(0, 0)}
      {eye(n - 7, 0)}
      {eye(0, n - 7)}
    </svg>
  )
}

function Front() {
  const split = profile.name.lastIndexOf(' ')
  return (
    <section className="sheet front">
      <div className="bg" />
      <div className="portrait">
        <AsciiPortrait src="/cover.jpg" className="ascii" fontSize={4.2} maxDpr={4} intensity={1.75} />
      </div>
      <div className="grain" />
      <div className="safe">
        <span className="wordmark">sitsit.dev</span>
        <span className="pill">
          <NfcIcon />
          Tap
        </span>
        <div className="identity">
          <h1>
            {profile.name.slice(0, split)}
            <br />
            {profile.name.slice(split + 1)}
          </h1>
          <p className="role">{profile.role}</p>
          <p className="loc">
            <MapPin />
            {profile.location}
          </p>
        </div>
      </div>
    </section>
  )
}

function Back() {
  const handle = (id: string) => socials.find((s) => s.id === id)!.handle
  const rows = [
    { icon: <Mail />, text: profile.email },
    { icon: <Globe />, text: 'hi.sitsit.dev' },
    { icon: <BrandIcon id="linkedin" />, text: handle('linkedin') },
    { icon: <BrandIcon id="github" />, text: handle('github') },
  ]
  return (
    <section className="sheet back">
      <div className="bg" />
      <div className="grain" />
      <div className="safe">
        <div className="qr-tile">
          <Qr text={QR_TARGET} />
        </div>
        <div className="info">
          <h2>Scan or tap</h2>
          <p className="sub">to see my work and save my contact</p>
          <ul className="rows">
            {rows.map((r) => (
              <li key={r.text}>
                {r.icon}
                {r.text}
              </li>
            ))}
          </ul>
          <p className="tap">
            <NfcIcon />
            Hold your phone near the card
          </p>
        </div>
      </div>
    </section>
  )
}

function Preview() {
  return (
    <main className="stage">
      {[<Front key="f" />, <Back key="b" />].map((sheet, i) => (
        <figure key={i}>
          <div className="trim">{sheet}</div>
          <figcaption>{i ? 'Back' : 'Front'}</figcaption>
        </figure>
      ))}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{side === 'front' ? <Front /> : side === 'back' ? <Back /> : <Preview />}</StrictMode>,
)
