import type { Metadata } from 'next'

import { site } from '@/data/site'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'

const description =
  'A curated selection of our most extraordinary experiences, from weddings to high-octane fitness festivals.'

export const metadata: Metadata = {
  title: 'Gallery',
  description,
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: `Gallery | ${site.name}`,
    description,
    url: '/gallery',
  },
}

export default function GalleryPage() {
  return <GalleryGrid />
}
