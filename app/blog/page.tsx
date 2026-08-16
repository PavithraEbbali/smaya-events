import type { Metadata } from 'next'

import { site } from '@/data/site'
import { blogPosts } from '@/data/blog'
import { BlogGrid } from '@/components/blog/BlogGrid'
import { PageHero } from '@/components/ui/PageHero'

const description =
  'Insights and stories on luxury weddings, fitness experiences, corporate events, wellness and adventure from the Smaya Events team.'

export const metadata: Metadata = {
  title: 'Blog',
  description,
  alternates: { canonical: '/blog' },
  openGraph: {
    title: `Blog | ${site.name}`,
    description,
    url: '/blog',
  },
}

export default function BlogPage() {
  return (
    <div className="surface-obsidian relative flex w-full flex-col font-sans text-white">
      {/* Closes the iOS overscroll case — the body is ivory site-wide, and
          rubber-banding past the end paints it regardless of what the shell
          covers. Same guard the gallery and events pages carry. */}
      <div aria-hidden className="surface-obsidian fixed inset-0 -z-10" data-floor />
      <PageHero eyebrow="Insights & Stories" title="The Smaya Blog" />
      <BlogGrid posts={blogPosts} />
    </div>
  )
}
