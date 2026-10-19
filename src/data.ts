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

// Mirrors src/data/projects.ts on sitsit.dev (same order, names, taglines, statuses).
// Reels and posters are phone-sized copies in public/work/ (800px, 30fps H.264; see README), not sitsit.dev's 1600px masters.
export type Project = {
  name: string
  tagline: string
  status: 'Live' | 'Maintained' | 'Shipped' | 'Building' | 'Idea'
  stack: string[]
  href: string
  image?: string
  video?: string
}

const work = (slug: string) => `https://sitsit.dev/work/${slug}`
const media = (file: string) => `/work/${file}`

export const projects: Project[] = [
  {
    name: 'AlgoLens',
    tagline: 'AI pre-post reviewer that scores and rewrites posts for X',
    status: 'Live',
    stack: ['React', 'Express', 'Gemini'],
    href: work('algolens/'),
    image: media('algolens.webp'),
    video: media('algolens.mp4'),
  },
  {
    name: 'MutualLink',
    tagline: 'Loans, savings, and collections for a multi-purpose cooperative',
    status: 'Building',
    stack: ['PHP 8.2', 'MySQL 8.4', 'Chart.js'],
    href: work('mutuallink/'),
    image: media('mutuallink.webp'),
    video: media('mutuallink.mp4'),
  },
  {
    name: 'Concordance',
    tagline: 'A local-first memory vault that answers from what you saved',
    status: 'Shipped',
    stack: ['Node 22', 'SQLite FTS', 'Chrome MV3'],
    href: work('concordance/'),
    image: media('concordance.webp'),
    video: media('concordance.mp4'),
  },
  {
    name: 'ClaudeBar',
    tagline: 'Always-on Claude Code usage dock for Windows',
    status: 'Building',
    stack: ['Electron', 'WebGL2'],
    href: work('claude-remainder/'),
    image: media('claudebar.webp'),
    video: media('claudebar.mp4'),
  },
  {
    name: 'Cashi',
    tagline: 'GCash float tracker for rural operators',
    status: 'Building',
    stack: ['Flutter', 'Dart'],
    href: work('cashi/'),
    image: media('cashi.webp'),
    video: media('cashi.mp4'),
  },
  {
    name: 'CERPSYS',
    tagline: 'Modular cloud ERP for Philippine small businesses',
    status: 'Maintained',
    stack: ['C#', 'ASP.NET Core', 'MySQL'],
    href: work('cerpsys/'),
  },
  {
    name: 'Beat Engine',
    tagline: 'Engine that turns music into interactive, follow-along video',
    status: 'Building',
    stack: ['Godot 4.5', 'GDScript', 'Python'],
    href: work('beat-engine/'),
  },
]

export const highlights = [
  { value: '2+ yrs', label: 'In production' },
  { value: '7', label: 'Projects' },
  { value: 'UTC+8', label: 'Timezone' },
]
