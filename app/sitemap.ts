import type { MetadataRoute } from 'next'

import { site } from '@/data/site'
import { verticalOrder } from '@/data/verticals'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '/', priority: 1 },
    { path: '/about', priority: 0.8 },
    { path: '/services', priority: 0.9 },
    ...verticalOrder.map((slug) => ({
      path: `/services/${slug}`,
      priority: 0.8,
    })),
    { path: '/gallery', priority: 0.7 },
    { path: '/events', priority: 0.7 },
    { path: '/testimonials', priority: 0.6 },
    { path: '/blog', priority: 0.6 },
    { path: '/contact', priority: 0.9 },
  ]

  const lastModified = new Date()

  return routes.map(({ path, priority }) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: 'monthly',
    priority,
  }))
}
