import type { Metadata } from 'next'

import { site } from '@/data/site'
import { testimonials } from '@/data/testimonials'
import { TestimonialsGrid } from '@/components/testimonials/TestimonialsGrid'

const description =
  'Our reputation is built on the success of the experiences we curate and the joyous moments we help create.'

export const metadata: Metadata = {
  title: 'Testimonials',
  description,
  alternates: { canonical: '/testimonials' },
  openGraph: {
    title: `Testimonials | ${site.name}`,
    description,
    url: '/testimonials',
  },
}

const reviewsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  review: testimonials.map((review) => ({
    '@type': 'Review',
    reviewBody: review.text,
    author: { '@type': 'Person', name: review.author },
    reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
  })),
}

export default function TestimonialsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }}
      />
      <TestimonialsGrid reviews={testimonials} />
    </>
  )
}
