'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Transition } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import type { BlogPost } from '@/data/blog'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { Atmosphere } from '@/components/ui/Atmosphere'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const SPRING: Transition = { type: 'spring', stiffness: 260, damping: 30 }

/* -------------------------------------------------------------------------- *
 * Per-category accent
 *
 * `category` is free text in data/blog.ts, so an unmatched value has to degrade
 * to a real colour rather than to `undefined` and a transparent border.
 * -------------------------------------------------------------------------- */

const GOLD = '#C5A880'

const ACCENT: Record<string, string> = {
  Weddings: '#D4AF37',
  Fitness: '#B9A6DC',
  Corporate: '#C5A880',
  Wellness: '#A8BFA0',
  Adventure: '#9DBFA8',
}

const accentFor = (category: string) => ACCENT[category] ?? GOLD

/* -------------------------------------------------------------------------- *
 * Grid
 * -------------------------------------------------------------------------- */

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const reduced = usePrefersReducedMotion()

  return (
    <section className="relative z-20 w-full">
      {/* Scoped to this section, not the viewport — the page hero above carries
          its own lighting and a fixed rig would keep shining through it. */}
      <Atmosphere />

      {/*
        EVERY post is in the grid, uniformly — no spotlight taking one out.

        The previous index gave five of the six posts their imagery only through
        a cursor-following preview, which meant no image at all on a touch
        device and none in the page's own layout. A uniform grid puts the same
        photograph in front of every reader on every device.
      */}
      <div className="relative mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} reduced={reduced} />
          ))}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * One card
 * -------------------------------------------------------------------------- */

function PostCard({
  post,
  index,
  reduced,
}: {
  post: BlogPost
  index: number
  reduced: boolean
}) {
  /*
    THE FALLBACK IS STATE, NOT A CSS TRICK.

    A broken <img> paints the browser's own empty-frame chrome, which no
    background behind it can hide. `onError` unmounts the image so the textured
    gradient takes the space. The gradient sits underneath at all times, so a
    slow load lands on it rather than on grey — which matters here, because the
    brief's requirement is that no card is ever without a visual.
  */
  const [failed, setFailed] = useState(false)
  const accent = accentFor(post.category)

  return (
    <motion.li
      data-post={post.slug}
      data-fallback={failed}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ ...SPRING, delay: index * 0.05 }}
      whileHover={reduced ? undefined : { y: -8 }}
      /* `h-full` makes every card fill its grid row, so a three-line excerpt
         does not leave its neighbour short. */
      className="group h-full"
    >
      {/*
        THE WHOLE CARD IS THE LINK.

        One anchor wrapping everything gives the reader a target the size of the
        card and keeps a single tab stop per post — rather than a card that
        looks clickable everywhere but only responds on a small "Read Article"
        line. The action below is styled as an affordance, not a second link,
        so there is nothing nested inside the anchor.
      */}
      <Link
        href={`/blog/${post.slug}`}
        data-tap
        data-read
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121115]/90 shadow-2xl backdrop-blur-xl outline-none transition-colors duration-500 hover:border-[#C5A880]/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070609]"
        style={{
          backgroundImage: 'linear-gradient(to bottom right, #1a1714 0%, #0a0908 100%)',
          ['--tw-ring-color' as string]: accent,
        }}
      >
        {/* ---------------------------- Artwork ------------------------- */}
        {/* `shrink-0` so the image keeps its height when the excerpt below runs
            long — without it flex would compress the picture to make room. */}
        <div className="relative h-52 w-full shrink-0 overflow-hidden">
          {!failed && (
            <Image
              src={post.img}
              alt=""
              fill
              sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 92vw"
              /* The first row is above the fold on most screens; the rest can
                 wait for the reader to reach them. */
              priority={index < 3}
              onError={() => setFailed(true)}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              /* Decorative: the headline below carries the meaning, so `alt`
                 stays empty rather than reading the title to a screen reader
                 twice. */
            />
          )}

          {/* Legibility floor for the pill. A photograph's local brightness is
              unknowable, so contrast is guaranteed here, not hoped for. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.12) 44%, rgba(5,5,5,0.24) 100%)',
            }}
          />

          <span
            data-badge
            className="absolute left-4 top-4 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
            style={{
              /* 0.88: the pill sits ON the photograph, so its own backing is
                 all that stands between a 9px accent and the image. */
              borderColor: `${accent}66`,
              backgroundColor: 'rgba(5,5,5,0.88)',
              color: accent,
            }}
          >
            {post.category}
          </span>
        </div>

        {/* ---------------------------- Content ------------------------- */}
        <div className="flex flex-1 flex-col gap-2 p-5">
          {/* `<time>` carries the ISO value, so the date is machine-readable
              and not only human-readable. */}
          <time
            dateTime={post.isoDate}
            data-date
            className="pr-[0.16em] font-mono text-[10px] font-bold tracking-[0.16em]"
            style={{ color: accent }}
          >
            {post.date}
          </time>

          {/* `break-words` guards the pathological unbreakable headline — the
              card is a bounded grid cell, so a long word would otherwise widen
              the column. */}
          <h2 className="break-words font-serif text-[1.1875rem] font-medium leading-snug tracking-[-0.015em] text-white transition-colors duration-300 group-hover:text-[#C5A880] sm:text-[1.25rem]">
            {post.title}
          </h2>

          <p className="break-words text-[0.8125rem] leading-[1.6] text-white/70">
            {post.excerpt}
          </p>

          {/*
            `mt-auto` pins the action to the bottom of every card regardless of
            how long the excerpt above it runs, so a row of cards has its
            actions on one line rather than stepped.

            A SPAN, not a nested anchor — the whole card is already the link,
            and an anchor inside an anchor is invalid HTML that browsers resolve
            by silently dropping one of them.
          */}
          <span
            aria-hidden
            data-action
            className="mt-auto inline-flex w-fit items-center gap-2 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
            style={{ color: accent }}
          >
            Read Article
            <ArrowRight
              size={13}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </motion.li>
  )
}
