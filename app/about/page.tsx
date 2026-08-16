import type { Metadata } from 'next'

import { site } from '@/data/site'
import { AboutContent } from '@/components/about/AboutContent'

const description =
  'Smaya Events is a powerhouse of experiential design founded by Manasa Raj — our story, vision, mission, core values and impact.'

export const metadata: Metadata = {
  title: 'About',
  description,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `About | ${site.name}`,
    description,
    url: '/about',
  },
}

export default function AboutPage() {
  return <AboutContent />
}
