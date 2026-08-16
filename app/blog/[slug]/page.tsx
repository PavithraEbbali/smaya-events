import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { site } from '@/data/site'
import { blogPosts } from '@/data/blog'

/* -------------------------------------------------------------------------- *
 * WHY THIS ROUTE EXISTS
 *
 * The journal cards carry a "Read Article" action, and a link needs somewhere
 * to land — without this every card on /blog was a 404.
 *
 * IT DELIBERATELY INVENTS NO ARTICLE PROSE. data/blog.ts holds a title, date,
 * category, image and excerpt; there is no body copy anywhere in the project.
 * Writing some would be putting words in the client's mouth on their own
 * publication, so this renders exactly what exists and says plainly that the
 * full piece is not published yet.
 *
 * Replace the closing panel with the real body once there is one — nothing
 * else here needs to change.
 * -------------------------------------------------------------------------- */

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return { title: 'Article not found' }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} | ${site.name}`,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      /* Absolute: Open Graph is read off-site, where a leading-slash path
         resolves against the crawler's own host and points at nothing. */
      images: [`${site.url}${post.img}`],
      type: 'article',
      publishedTime: post.isoDate,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)

  /* An unknown slug is a 404, not an empty page — otherwise a typo renders a
     shell with no content and returns 200 to a crawler. */
  if (!post) notFound()

  const others = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3)

  return (
    <div className="surface-obsidian relative flex w-full flex-col font-sans text-white">
      <div aria-hidden className="surface-obsidian fixed inset-0 -z-10" />

      <article className="relative mx-auto w-full max-w-3xl px-5 pb-20 pt-32 sm:px-6 sm:pt-36">
        <Link
          href="/blog"
          data-tap
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 outline-none transition-colors hover:text-[#C5A880] focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070609]"
        >
          <ArrowLeft size={14} aria-hidden />
          The Journal
        </Link>

        <span className="mt-8 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#C5A880]/40 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C5A880]">
            {post.category}
          </span>
          <time
            dateTime={post.isoDate}
            className="font-mono text-[10px] font-bold tracking-[0.14em] text-white/60"
          >
            {post.date}
          </time>
        </span>

        {/* `break-words` guards a pathological unbreakable headline in a
            bounded column. */}
        <h1 className="mt-4 break-words font-serif text-[2rem] font-bold leading-[1.06] tracking-[-0.03em] text-white sm:text-[2.75rem]">
          {post.title}
        </h1>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
          <Image
            src={post.img}
            alt=""
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            priority
            className="object-cover"
            /* Decorative: the headline above carries the meaning. */
          />
        </div>

        <p className="mt-8 break-words text-[1.0625rem] leading-[1.75] text-white/80">
          {post.excerpt}
        </p>

        {/* The honest part. No invented body copy. */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#121115]/90 p-6 backdrop-blur-xl">
          <p className="text-[0.875rem] leading-[1.7] text-white/70">
            The full article is being prepared. In the meantime, our team is
            happy to talk through anything above in person.
          </p>
          <Link
            href="/contact"
            data-tap
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#C5A880]/60 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C5A880] outline-none transition-colors hover:bg-[#C5A880]/10 focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070609]"
          >
            Talk to us
          </Link>
        </div>

        {others.length > 0 && (
          <nav aria-label="More from the journal" className="mt-14">
            <h2 className="pr-[0.28em] font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#C5A880]">
              More from the Journal
            </h2>
            <ul className="mt-5 flex flex-col divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/blog/${other.slug}`}
                    data-tap
                    className="group flex items-baseline justify-between gap-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C5A880]"
                  >
                    {/* `min-w-0` is what prevents the overflow: a flex child
                        defaults to `min-width:auto` and refuses to shrink below
                        its longest word. */}
                    <span className="min-w-0 break-words font-serif text-[1rem] font-bold leading-snug text-white/85 transition-colors group-hover:text-white">
                      {other.title}
                    </span>
                    <time
                      dateTime={other.isoDate}
                      className="shrink-0 font-mono text-[10px] tracking-[0.14em] text-white/50"
                    >
                      {other.date}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>
    </div>
  )
}
