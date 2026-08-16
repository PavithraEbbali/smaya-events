import type { Metadata } from 'next'

import { serviceCategories } from '@/data/services'
import { verticals } from '@/data/verticals'
import { AsymmetricCarousel } from '@/components/services/AsymmetricCarousel'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'From the grandest luxury weddings to empowering fitness festivals and scenic adventure camps, our expertise spans the full spectrum of live experiences.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Services | Smaya Events',
    description:
      'Weddings & celebrations, fitness & wellness, adventure & outdoors, corporate events, production & entertainment.',
    url: '/services',
  },
}

export default function ServicesPage() {
  return <AsymmetricCarousel categories={serviceCategories} verticals={verticals} />
}
