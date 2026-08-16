'use client'

import { motion, type Transition } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

import type { Testimonial } from '@/data/testimonials'
import { viewportOnce } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const SPRING: Transition = { type: 'spring', stiffness: 240, damping: 28 }

/* -------------------------------------------------------------------------- *
 * The editorial rhythm
 *
 * A 6-column track rather than 3, which is what buys the asymmetry: a 3-column
 * grid can only ever be thirds, so a "spotlight" spanning two of them leaves a
 * hole in the last row. Six columns divide into 4+2, 2+4 and 3+3 — three
 * different row compositions that all come out FLUSH, so the layout reads as
 * bespoke rather than as a grid with a gap in it.
 *
 *   row 1   [ ---- spotlight ---- ][  half  ]
 *   row 2   [  half  ][ ---- spotlight ---- ]     <- mirrored
 *   row 3   [   third   ][   third   ]
 *
 * Indexed with `% LAYOUT.length`, so the pattern repeats and data/testimonials
 * can grow without touching this file. Rows stay flush at multiples of six; a
 * remainder simply leaves the final row short, which is a ragged edge and not
 * a broken layout.
 *
 * The spans are written as whole literal class strings because Tailwind v4
 * scans source statically — a computed `lg:col-span-${n}` would never be
 * generated.
 * -------------------------------------------------------------------------- */

const LAYOUT = [
  'lg:col-span-4',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-4',
  'lg:col-span-3',
  'lg:col-span-3',
] as const

const isSpotlight = (span: string) => span === 'lg:col-span-4'

/* -------------------------------------------------------------------------- *
 * Page
 * -------------------------------------------------------------------------- */

export function TestimonialsGrid({ reviews }: { reviews: Testimonial[] }) {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDFCFB] px-5 pb-20 pt-32 text-smaya-charcoal sm:px-6 sm:pb-24 sm:pt-36">
      {/*
        Ambient warmth, kept very low. Gold at 0.10 and plum at 0.06 are enough
        to stop the cream reading as flat paper, and light enough that the white
        cards still separate from the ground behind them — the whole layout
        depends on that separation, so the glow has to stay under the cards
        rather than compete with them.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 60% 50% at 12% 0%, rgba(197,168,128,0.10), transparent 70%)',
            'radial-gradient(ellipse 50% 45% at 88% 18%, rgba(58,34,95,0.06), transparent 70%)',
            'radial-gradient(ellipse 70% 40% at 50% 100%, rgba(197,168,128,0.07), transparent 70%)',
          ].join(','),
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Client Love"
          title="Stories of"
          accent="Joy"
          body="Our reputation is built on the success of the experiences we curate and the joyous moments we help create."
          as="h1"
          titleClassName="text-4xl sm:text-5xl lg:text-6xl"
          className="mb-16 sm:mb-24"
        />

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          {reviews.map((review, i) => {
            const span = LAYOUT[i % LAYOUT.length]
            return (
              <ReviewCard
                key={`${review.author}-${review.role}`}
                review={review}
                index={i}
                span={span}
                spotlight={isSpotlight(span)}
                reduced={reduced}
              />
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One card
 * -------------------------------------------------------------------------- */

function ReviewCard({
  review,
  index,
  span,
  spotlight,
  reduced,
}: {
  review: Testimonial
  index: number
  span: string
  spotlight: boolean
  reduced: boolean
}) {
  return (
    <motion.li
      data-review={review.author}
      data-spotlight={spotlight || undefined}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ ...SPRING, delay: (index % 3) * 0.08 }}
      whileHover={reduced ? undefined : { y: -6 }}
      /*
        `min-w-0` is load-bearing, not decoration. A grid item defaults to
        `min-width:auto` and refuses to shrink below its longest word, which is
        how a single long name pushes a track wider than its share and starts
        the page scrolling sideways.
      */
      className={cn('min-w-0', span)}
    >
      <figure
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#C5A880]/30 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-500 hover:border-[#C5A880]/70 hover:shadow-[0_18px_44px_rgba(58,34,95,0.10)]',
          spotlight ? 'p-8 sm:p-10 lg:p-12' : 'p-8 sm:p-9',
        )}
      >
        {/* The spotlight gets a watermark glyph rather than a bigger border —
            weight without another line competing with the gold edge. */}
        {spotlight && (
          <Quote
            aria-hidden
            className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 text-[#C5A880]/[0.09]"
            fill="currentColor"
            strokeWidth={0}
          />
        )}

        {/*
          `role="img"` + one label, and the individual stars hidden. Five
          separate <svg> elements would otherwise be announced as five
          meaningless graphics; this makes the rating a single readable object.
        */}
        <div
          role="img"
          aria-label="Rated 5 out of 5"
          className="mb-7 flex gap-1 text-smaya-gold-star"
        >
          {Array.from({ length: 5 }).map((_, j) => (
            <Star
              key={j}
              aria-hidden
              className={cn('fill-current', spotlight ? 'h-6 w-6' : 'h-5 w-5')}
            />
          ))}
        </div>

        {/* `break-words` guards the pathological unbreakable string inside a
            bounded track. */}
        <blockquote
          className={cn(
            'flex-grow break-words font-serif italic leading-relaxed text-neutral-800',
            spotlight
              ? 'text-xl leading-[1.6] sm:text-2xl'
              : 'text-lg leading-[1.65]',
          )}
        >
          &ldquo;{review.text}&rdquo;
        </blockquote>

        {/* A hairline rule instead of a large margin — it gives the attribution
            a foot to stand on, so short and long quotes both resolve. */}
        <figcaption className="mt-8 border-t border-[#C5A880]/25 pt-5">
          <div className="break-words text-sm font-bold uppercase tracking-[0.1em] text-smaya-charcoal">
            {review.author}
          </div>
          {/*
            The designation is plum at 13.34:1. It was `charcoal/45` before,
            which measured 2.85:1 on white — under AA, and the only line on the
            card telling you WHO is speaking.
          */}
          <div className="mt-1.5 break-words text-xs font-medium uppercase tracking-wider text-[#3A225F]">
            {review.role}
          </div>
        </figcaption>
      </figure>
    </motion.li>
  )
}
