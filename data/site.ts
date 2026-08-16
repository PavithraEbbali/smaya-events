export const site = {
  name: 'Smaya Events',
  shortName: 'Smaya',
  tagline: 'Every Celebration Deserves a Touch of Magic.',
  positioning: 'Creators of Feeling',
  description:
    'Smaya Events is a full-spectrum luxury experience company — celebrations, corporate, fitness & wellness, adventure, entertainment, community and workshops. Creators of feeling.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smayaevents.com',
  founder: 'Manasa Raj',
  email: 'hello@smayaevents.com',
  phone: '+91 8884884456',
  /** Digits only, E.164 without the leading "+" — used to build wa.me links. */
  whatsapp: '918884884456',
  whatsappMessage:
    "Hi Smaya Events! I'd love to talk about an experience I'm planning.",
  instagram: 'https://instagram.com/smayaevents',
  instagramHandle: '@smayaevents',
  location: 'Bengaluru, India',
  locationLong: 'Bengaluru, India — available for events worldwide',
} as const

export const whatsappHref = `https://wa.me/${site.whatsapp}`

export const stats = [
  { value: 10, suffix: '+', label: 'Years Creating Memories' },
  { value: 500, suffix: '+', label: 'Events Delivered' },
  { value: 1000, suffix: '+', label: 'Happy Clients' },
  { value: 50, suffix: '+', label: 'Corporate Partners' },
] as const

export type NavLink = {
  href: string
  label: string
  /** Services is the only item that opens the verticals mega-menu. */
  hasMegaMenu?: boolean
}

export const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services', hasMegaMenu: true },
  { href: '/gallery', label: 'Gallery' },
  { href: '/events', label: 'Events' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

/**
 * Routes whose hero sits on a dark full-bleed background, so the navbar must
 * render in its light (white text) treatment until the user scrolls. Entries
 * ending in `/` match the whole subtree.
 */
const lightHeaderRoutes = ['/', '/events', '/blog', '/services/'] as const

export function isLightHeaderRoute(pathname: string) {
  return lightHeaderRoutes.some((route) =>
    route.length > 1 && route.endsWith('/')
      ? pathname.startsWith(route)
      : pathname === route,
  )
}
