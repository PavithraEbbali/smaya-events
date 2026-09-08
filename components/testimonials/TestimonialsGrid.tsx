'use client'

import { motion, type Transition } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

import type { Testimonial } from '@/data/testimonials'
import { viewportOnce } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { SectionHeading } from '@/components/ui/SectionHeading'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const SPRING: Transition = { type: 'spring', stiffness: 240, damping: 28 }

/* -------------------------------------------------------------------------- *
 * The rhythm: two up, every card equal
 *
 * This used to be a 6-column track running 4+2, 2+4 — a "spotlight" card beside
 * a half. That composition earns its keep when quotes are SHORT and uneven,
 * because the width difference is the hierarchy.
 *
 * Our reviews are not short. Every one runs three paragraphs, ~90-110 words,
 * and at that length the narrow half becomes the problem:
 *
 *   - a col-span-2 track is ~384px at 1280, so ~32 characters per line. That is
 *     a newspaper column, and 110 words down it reads as a tall skinny ribbon.
 *   - grid rows stretch to their tallest item, so that ribbon sets the row
 *     height and the wide card beside it is left with a dead gap between the
 *     quote and the attribution.
 *
 * Four reviews of equal substance want equal, generous width, so: one column
 * until lg, two above it. No spans to keep flush, no spotlight — every card
 * gets the full feature treatment (the watermark glyph, the larger type, the
 * deeper padding) because on this page every card IS the feature.
 * -------------------------------------------------------------------------- */

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

        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {reviews.map((review, i) => (
            <ReviewCard
              key={`${review.author}-${review.role}`}
              review={review}
              index={i}
              reduced={reduced}
            />
          ))}
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
  reduced,
}: {
  review: Testimonial
  index: number
  reduced: boolean
}) {
  return (
    <motion.li
      data-review={review.author}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      /* Two per row, so the pair rises together and the next row follows. */
      transition={{ ...SPRING, delay: (index % 2) * 0.08 }}
      whileHover={reduced ? undefined : { y: -6 }}
      /*
        `min-w-0` is load-bearing, not decoration. A grid item defaults to
        `min-width:auto` and refuses to shrink below its longest word, which is
        how a single long name pushes a track wider than its share and starts
        the page scrolling sideways.
      */
      className="min-w-0"
    >
      <figure className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#C5A880]/30 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-500 hover:border-[#C5A880]/70 hover:shadow-[0_18px_44px_rgba(58,34,95,0.10)] sm:p-10 xl:p-12">
        {/* A watermark glyph rather than a heavier border — weight without
            another line competing with the gold edge. */}
        <Quote
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 text-[#C5A880]/[0.09]"
          fill="currentColor"
          strokeWidth={0}
        />

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
            <Star key={j} aria-hidden className="h-6 w-6 fill-current" />
          ))}
        </div>

        {/*
          The measure is capped while the grid is a single column: below lg a
          card spans the whole container, and at ~1000px wide that is a 90+
          character line, which is as tiring to read as the old narrow one was.
          Above lg the two-column track already bounds it, so the cap lifts.

          `break-words` guards the pathological unbreakable string.
        */}
        <blockquote className="max-w-[62ch] flex-grow space-y-5 break-words font-serif text-lg italic leading-[1.65] text-neutral-800 lg:max-w-none xl:text-xl xl:leading-[1.6]">
          {review.text.map((para, j) => (
            <p key={j}>
              {j === 0 && <>&ldquo;</>}
              {para}
              {j === review.text.length - 1 && <>&rdquo;</>}
            </p>
          ))}
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
