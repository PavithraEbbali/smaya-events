'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, type Transition } from 'framer-motion'

import {
  portfolioCategories,
  portfolioItems,
  type PortfolioCategory,
  type PortfolioItem,
} from '@/data/portfolio'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { Atmosphere } from '@/components/ui/Atmosphere'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 30 }

const GOLD = '#C5A880'

/** Per-category accent, so a filtered view still reads as its own world. */
const ACCENT: Record<PortfolioCategory, string> = {
  Weddings: '#D4AF37',
  Corporate: '#C5A880',
  Fitness: '#B9A6DC',
  Trek: '#A8BFA0',
  Community: '#E0B7A0',
  Entertainment: '#9D8CBF',
}

/* -------------------------------------------------------------------------- *
 * Section
 * -------------------------------------------------------------------------- */

export function GalleryGrid() {
  const reduced = usePrefersReducedMotion()
  const [filter, setFilter] = useState<string>('All')

  const filtered =
    filter === 'All'
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === filter)

  return (
    /*
      THE OBSIDIAN IS SET HERE AND ON THE PAGE SHELL, not just here.

      This element used to be `bg-smaya-ivory` — the "white leak" was the page's
      own colour, not something bleeding through. `min-h-screen` alone would
      still let the document background show below the content on a short
      filter result, which is exactly when the leak was most visible, so the
      route's own wrapper carries the colour too.
    */
    <div className="surface-obsidian relative min-h-screen px-5 pb-24 pt-32 text-white sm:px-6 sm:pb-28 sm:pt-36">
      {/*
        A FIXED FLOOR, because `min-h-screen` is not actually a guarantee.

        The document body is ivory site-wide, and this section only covers it
        while the section is tall enough. Filter down to one card and the height
        collapses; rubber-band past the end on iOS and the ivory shows through
        regardless of height. A viewport-fixed layer behind everything means the
        page cannot expose that colour under any of those conditions.

        It carries the canvas too, so the gradient reaches the overscroll area
        rather than stopping at the section's own box.
      */}
      <div aria-hidden className="surface-obsidian fixed inset-0 -z-10" data-floor />

      <Atmosphere anchor="fixed" />

      <div className="relative mx-auto max-w-7xl">
        {/* ------------------------------ Masthead ------------------------- */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end lg:mb-14"
        >
          <div>
            <span className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: `${GOLD}99` }} />
              {/* `pr` matches the tracking — wide letter-spacing leaves a
                  trailing gap that otherwise pushes the label off its rule. */}
              <span
                className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em]"
                style={{ color: GOLD }}
              >
                Our Legacy
              </span>
            </span>

            <h1 className="mt-4 font-serif text-[2.5rem] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.25rem] lg:text-[4rem]">
              Selected Works
            </h1>

            <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.7] text-white/70">
              A curated selection of our most extraordinary experiences, from
              weddings to high-octane fitness festivals.
            </p>
          </div>

          {/* ---------------------------- Filter pills --------------------- */}
          <div
            role="group"
            aria-label="Filter gallery by category"
            data-filters
            className="-mx-1 flex flex-wrap gap-2 px-1"
          >
            {portfolioCategories.map((category) => {
              const on = filter === category
              const accent =
                category === 'All' ? GOLD : ACCENT[category as PortfolioCategory]
              return (
                <button
                  key={category}
                  type="button"
                  data-tap
                  data-pill={category}
                  data-on={on}
                  aria-pressed={on}
                  onClick={() => setFilter(category)}
                  className="rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] outline-none backdrop-blur-md transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                  style={{
                    borderColor: on ? `${accent}B3` : 'rgba(255,255,255,0.15)',
                    backgroundColor: on ? `${accent}1F` : 'rgba(255,255,255,0.05)',
                    /* Idle pills are `white/70`, not the accent: seven accent
                       chips in a row compete with the work they filter, and at
                       11px the accent would also be the weakest text here. */
                    color: on ? '#FFFFFF' : 'rgba(255,255,255,0.70)',
                    boxShadow: on ? `0 0 22px ${accent}40` : 'none',
                    ['--tw-ring-color' as string]: accent,
                  }}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ------------------------------- Grid ---------------------------- */}
        {/*
          `layout` on the tiles plus AnimatePresence on the set: filtering
          re-flows the survivors to their new positions rather than snapping
          them, which is the whole point of animating a filter.

          `auto-rows` only from `md`, where the row-spanning tiles exist. Below
          that each tile sets its own height, so a tall card cannot be cropped
          by a row track it never asked for.
        */}
        <motion.div
          layout={!reduced}
          className="grid grid-cols-1 gap-6 md:auto-rows-[220px] md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
          data-grid
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((item) => (
              <GalleryCard key={item.id} item={item} reduced={reduced} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* A filter that matches nothing should say so rather than leaving a
            silent gap — and it is also what keeps the obsidian visible instead
            of an empty grid collapsing to zero height. */}
        {filtered.length === 0 && (
          <p className="py-20 text-center text-[0.9375rem] text-white/60">
            No works in this category yet.
          </p>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One card
 * -------------------------------------------------------------------------- */

function GalleryCard({ item, reduced }: { item: PortfolioItem; reduced: boolean }) {
  /*
    THE FALLBACK IS STATE, NOT A CSS TRICK.

    A broken <img> paints the browser's own empty-frame chrome, and no amount
    of background styling behind it removes that. `onError` is the only signal
    that the decode actually failed, so the image is unmounted and the textured
    placeholder takes the space instead. The gradient sits underneath either
    way, so a slow image loads onto the placeholder rather than onto grey.
  */
  const [failed, setFailed] = useState(false)
  const accent = ACCENT[item.category]

  return (
    <motion.article
      layout={!reduced}
      data-card={item.id}
      data-fallback={failed}
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={SPRING}
      whileHover={reduced ? undefined : { y: -8, scale: 1.02 }}
      className={`group relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 transition-colors duration-500 hover:border-[#C5A880]/60 md:min-h-0 ${item.span}`}
      style={{
        /* The textured ground. Always present, so there is never a moment of
           bare grey — before load, during load, or after a failure. */
        backgroundImage:
          'linear-gradient(to bottom right, #1a1714 0%, #0a0908 100%)',
        boxShadow: '0 24px 60px -40px rgba(0,0,0,0.95)',
      }}
    >
      {/* Ambient glow inside the placeholder, so a card with no photograph
          still has depth rather than reading as a flat swatch. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 30% 20%, ${accent}1F 0%, transparent 62%)`,
        }}
      />

      {!failed && (
        <Image
          src={item.img}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 92vw"
          onError={() => setFailed(true)}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}

      {/* Bottom scrim. A photograph's local brightness is unknowable, so the
          caption's contrast is guaranteed by this rather than hoped for. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.62) 34%, rgba(5,5,5,0.10) 62%, transparent 100%)',
        }}
      />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <span
          data-badge
          className="inline-block rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
          style={{
            borderColor: `${accent}66`,
            backgroundColor: 'rgba(5,5,5,0.6)',
            color: accent,
          }}
        >
          {item.category}
        </span>

        {/* `break-words` guards the pathological unbreakable title; the card is
            a fixed grid cell, so a long word would otherwise widen the column. */}
        <h2 className="mt-2.5 break-words font-serif text-[1.125rem] font-bold leading-snug tracking-[-0.02em] text-white sm:text-[1.25rem]">
          {item.title}
        </h2>
      </div>
    </motion.article>
  )
}
