// Single place to edit profile content. Sourced from github.com/JamS1t + sitsit.dev.
export const profile = {
  name: 'James Carl Sitsit',
  role: 'Full-stack developer · AI engineer',
  location: 'Eastern Visayas, Philippines',
  bio: 'I ship AI-powered web apps and operational tools to production, and care most about the part after the demo.',
  availability: 'Open for freelance projects',
  email: 'jamescarlsitsit@gmail.com',
  site: 'https://sitsit.dev',
  booking: 'https://cal.com/sitsit.dev/intro',
}

export type Social = 'github' | 'linkedin' | 'instagram'

export const socials: { id: Social; label: string; handle: string; href: string }[] = [
  { id: 'linkedin', label: 'LinkedIn', handle: 'in/james-carl-sitsit', href: 'https://www.linkedin.com/in/james-carl-sitsit' },
  { id: 'github', label: 'GitHub', handle: '@JamS1t', href: 'https://github.com/JamS1t' },
  { id: 'instagram', label: 'Instagram', handle: '@jamescarlsitsit', href: 'https://www.instagram.com/jamescarlsitsit/' },
]

export const projects = [
  {
    name: 'AlgoLens',
    blurb: 'AI pre-post reviewer that scores and rewrites posts for X.',
    status: 'Live',
    stack: ['React', 'Express', 'Gemini'],
    href: 'https://algolens.app',
  },
  {
    name: 'StockPilot',
    blurb: 'Inventory and POS dashboard for small businesses.',
    status: 'Live',
    stack: ['React 19', 'Express 5', 'MySQL'],
    href: 'https://www.stockpilot.space',
  },
  {
    name: 'CERPSYS',
    blurb: 'Production ERP for a multi-branch rental enterprise.',
    status: 'In production',
    stack: ['Next.js', 'PostgreSQL'],
    href: 'https://sitsit.dev/work/cerpsys/',
  },
  {
    name: 'FloatWatch',
    blurb: 'GCash float tracker with on-device receipt OCR.',
    status: 'Building',
    stack: ['Flutter', 'ML Kit'],
    href: 'https://github.com/JamS1t/floatwatch',
  },
]

export const highlights = [
  { value: '2+ yrs', label: 'In production' },
  { value: '3', label: 'Live products' },
  { value: 'UTC+8', label: 'Timezone' },
]
