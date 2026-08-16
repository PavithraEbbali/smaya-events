import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getVertical, verticalOrder } from '@/data/verticals'
import { VerticalTemplate } from '@/components/services/VerticalTemplate'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return verticalOrder.map((slug) => ({ slug }))
}

/** Unknown slugs 404 rather than rendering on demand. */
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const vertical = getVertical(slug)
  if (!vertical) return {}

  const url = `/services/${vertical.slug}`

  return {
    title: vertical.metaTitle,
    description: vertical.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: vertical.metaTitle,
      description: vertical.metaDescription,
      url,
      images: [{ url: vertical.heroImage, alt: vertical.heroImageAlt }],
    },
  }
}

export default async function VerticalRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const vertical = getVertical(slug)
  if (!vertical) notFound()

  return <VerticalTemplate vertical={vertical} />
}
