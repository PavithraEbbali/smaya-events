import type { Metadata } from 'next'

import { site } from '@/data/site'
import { AboutTeaser } from '@/components/home/AboutTeaser'
import { FinalCTA } from '@/components/home/FinalCTA'
import { Hero } from '@/components/home/Hero'
import { PortfolioPreview } from '@/components/home/PortfolioPreview'
import { ServicesGrid } from '@/components/home/ServicesGrid'
import { StatementBand } from '@/components/home/StatementBand'
import { StatsBand } from '@/components/home/StatsBand'
import { TestimonialsPreview } from '@/components/home/TestimonialsPreview'
import { SectionDivider } from '@/components/ui/SectionDivider'

export const metadata: Metadata = {
  title: `${site.name} — ${site.positioning}`,
  description: site.description,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${site.name} — ${site.positioning}`,
    description: site.description,
    url: '/',
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      {/* Bridges the seven service tiles into the founder story. Carries its
          own drawn rule, so no SectionDivider is needed here. */}
      <StatementBand />
      <AboutTeaser />
      <PortfolioPreview />
      <StatsBand />
      <TestimonialsPreview />
      <SectionDivider />
      <FinalCTA />
    </>
  )
}
