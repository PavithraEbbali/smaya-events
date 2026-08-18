'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, type Transition } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import type { ServiceCategory } from '@/data/services'
import type { Vertical, VerticalSlug } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { useCoarsePointer, usePrefersReducedMotion } from '@/lib/hooks'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const LIFT: Transition = { type: 'spring', stiffness: 300, damping: 30 }
const GLIDE: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }

/* -------------------------------------------------------------------------- *
 * Tile identity
 *
 * Keyed by category title to stay aligned with data/services.ts — an index
 * would silently pair the wrong span, accent and photograph with the wrong
 * tile the moment anyone reorders that array.
 *
 * `span` is where the asymmetry lives. On a three-column grid the cells fall
 * out exactly:
 *
 *     [ 01  01  02 ]
 *     [ 01  01  03 ]
 *     [ 04  05  05 ]
 *
 * 4 + 1 + 1 + 1 + 2 = 9 cells in 3x3, so the bento has no holes at `lg`. At
 * `md` only the first tile spans, giving 2 + 1 + 1 + 1 + 1 = 6 in 3x2 — also
 * exact. Tile 05 deliberately does NOT span at `md`, because a two-wide tile
 * after three single ones would strand a gap on the last row.
 *
 * Artwork is local rather than remote: next/image proxies remote files at
 * request time, and this project has had heroes time out and 500 a route.
 * Every path is kebab-case — spaces need percent-encoding, and a capitalised
 * path resolves on Windows but 404s on the Linux host that serves production.
 * -------------------------------------------------------------------------- */

type Tile = { badge: string; accent: string; span: string; art: string }

const TILES: Record<string, Tile> = {
  'Weddings & Celebrations': {
    badge: '01',
    accent: '#D4AF37',
    span: 'md:col-span-2 lg:col-span-2 lg:row-span-2',
    art: '/image_3.png',
  },
  'Corporate Events': {
    badge: '02',
    accent: '#C5A880',
    span: '',
    art: '/corporate-conferences-realistic.jpg',
  },
  'Fitness & Wellness': {
    badge: '03',
    accent: '#B9A6DC',
    span: '',
    art: '/images/yoga-foundations.jpg',
  },
  'Adventure & Outdoors': {
    badge: '04',
    accent: '#C5A880',
    span: '',
    art: '/expedition-camping.jpg',
  },
  'Production & Entertainment': {
    badge: '05',
    accent: '#9D8CBF',
    span: 'lg:col-span-2',
    art: '/performance-dj.jpg',
  },
}

/** The brief's reading order — Corporate second rather than fourth. */
const ORDER = [
  'Weddings & Celebrations',
  'Corporate Events',
  'Fitness & Wellness',
  'Adventure & Outdoors',
  'Production & Entertainment',
]

/* -------------------------------------------------------------------------- *
 * Page
 * -------------------------------------------------------------------------- */

type Props = {
  categories: ServiceCategory[]
  verticals: Record<VerticalSlug, Vertical>
}

export function CinematicBento({ categories, verticals }: Props) {
  const reduced = usePrefersReducedMotion()
  /*
    Hover is an ENHANCEMENT, never the only route to the sub-services.

    A touch device has no hover at all, so anything gated behind it is simply
    absent on a phone. `useCoarsePointer` is the right phrasing rather than
    `!usePointerFine()`: both start false before the query resolves, but this
    one treats the unknown first frame as "can hover", which renders the
    hidden state — the safe direction for content that is revealed rather than
    concealed.
  */
  const isTouch = useCoarsePointer()

  const ordered = ORDER.map((t) => categories.find((c) => c.title === t)).filter(
    (c): c is ServiceCategory => Boolean(c),
  )

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 sm:pb-28 sm:pt-36">
      {/* -------------------------------- Hero ---------------------------- */}
      <header className="mx-auto mb-12 max-w-7xl px-5 sm:mb-16 sm:px-6">
        <span className="flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[#D4AF37]/60" />
          {/* `pr` matches the tracking — wide letter-spacing leaves a trailing
              gap that otherwise pushes the label off its rule. */}
          <span className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em] text-[#D4AF37]">
            Our Expertise
          </span>
        </span>

        <h1 className="mt-4 max-w-3xl text-balance font-serif text-[2.5rem] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.25rem] lg:text-[4rem]">
          Five divisions, one standard.
        </h1>

        <p className="mt-5 max-w-xl text-[0.9375rem] leading-[1.75] text-white/70">
          From the grandest luxury weddings to empowering fitness festivals and
          scenic adventure camps, our expertise spans the full spectrum of live
          experiences.
        </p>
      </header>

      {/* ----------------------------- Bento grid ------------------------- */}
      {/*
        `auto-rows` only from `lg`, where the row-spanning tile exists. Below
        that every tile sets its own height, so a tall category cannot be
        cropped by a row track it never asked for.
      */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 sm:px-6 md:grid-cols-2 lg:auto-rows-[300px] lg:grid-cols-3">
        {ordered.map((category) => (
          <BentoTile
            key={category.title}
            category={category}
            verticals={verticals}
            reduced={reduced}
            isTouch={isTouch}
          />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One tile
 * -------------------------------------------------------------------------- */

function BentoTile({
  category,
  verticals,
  reduced,
  isTouch,
}: {
  category: ServiceCategory
  verticals: Record<VerticalSlug, Vertical>
  reduced: boolean
  isTouch: boolean
}) {
  const tile = TILES[category.title]
  const Icon = getIcon(category.icon)

  /*
    OPEN ON HOVER **OR** FOCUS, and permanently on touch.

    A panel that only answers to hover is unreachable two ways: a keyboard user
    tabbing to the links inside it would be moving focus into something they
    cannot see, and a touch device has no hover at all. `onFocusCapture` catches
    focus arriving anywhere in the tile.
  */
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const revealed = isTouch || hovered || focused
  /* The lift answers the POINTER, not the reveal — otherwise every tile on a
     phone would sit permanently scaled up. */
  const lifted = (hovered || focused) && !reduced

  return (
    <motion.article
      data-tile={tile.badge}
      data-revealed={revealed}
      data-lifted={lifted}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      layout="position"
      layoutId={`bento-${tile.badge}`}
      className={`group relative isolate min-h-[400px] rounded-3xl border sm:min-h-[340px] lg:min-h-0 ${tile.span}`}
      style={{ backgroundColor: '#050505' }}
      initial={false}
      animate={{
        scale: lifted ? 1.02 : 1,
        /* The scaled tile has to sit above its neighbours, or it grows
           underneath them and the lift reads as a glitch. */
        zIndex: lifted ? 50 : 1,
        borderColor: lifted ? `${tile.accent}88` : 'rgba(255,255,255,0.10)',
        boxShadow: lifted
          ? `0 30px 70px -30px rgba(0,0,0,0.95), 0 0 46px -12px ${tile.accent}66`
          : '0 20px 50px -40px rgba(0,0,0,0.9)',
      }}
      transition={LIFT}
    >
      {/* ------------------------------ Artwork ---------------------------- */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <Image
          src={tile.art}
          alt=""
          fill
          sizes="(min-width: 1024px) 640px, (min-width: 768px) 50vw, 92vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div aria-hidden className="absolute inset-0 bg-[#050505]/58" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/78 to-transparent"
        />
      </div>

      {/* ------------------------------ Content ---------------------------- */}
      <div className="relative flex h-full flex-col justify-end p-5 sm:p-6">
        {/* Badge pinned to the top corner, away from the copy. */}
        <span
          aria-hidden
          data-badge
          className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-[11px] font-bold backdrop-blur-sm sm:left-6 sm:top-6"
          /*
            0.72, not 0.55. The badge sits high on the tile where the gradient
            has not yet darkened anything, so its own backing is the only thing
            between an 11px accent and the photograph. At 0.55 the deepest foil
            (tile 05's purple) measured 4.10:1 — under AA for text this size.
            Deepening the backing rather than lightening the foil keeps the
            accent the brief asked for and lifts it to 5.2.
          */
          style={{
            borderColor: `${tile.accent}66`,
            backgroundColor: 'rgba(5,5,5,0.72)',
            color: tile.accent,
          }}
        >
          {tile.badge}
        </span>

        <Icon size={17} aria-hidden className="mb-3 shrink-0" style={{ color: tile.accent }} />

        {/* `break-words` covers the pathological unbreakable name; `min-w-0`
            is unnecessary here because this is a block, not a flex child. */}
        <h2 className="break-words font-serif text-[1.5rem] font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-[1.75rem]">
          {category.title}
        </h2>

        <p className="mt-2 max-w-md break-words text-[0.8125rem] leading-[1.6] text-white/75">
          {category.description}
        </p>

        {/*
          THE GLIDE.

          Height is animated rather than the panel being toggled, so the tile's
          own box never changes and neighbouring tiles cannot be shoved around
          by a hover. `overflow-hidden` is what makes the height animation read
          as a wipe instead of a squash.
        */}
        <AnimatePresence initial={false}>
          {revealed && (
            <motion.div
              key="panel"
              data-panel
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={GLIDE}
              className="overflow-hidden"
            >
              <span
                aria-hidden
                className="mb-3 mt-4 block h-px w-full"
                style={{ background: `linear-gradient(90deg, ${tile.accent}66, transparent)` }}
              />

              <ul className="flex flex-wrap gap-1.5">
                {category.services.map((service) => (
                  <li
                    key={service.title}
                    data-service={service.title}
                    className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium leading-[1.5] text-white/85 backdrop-blur-sm"
                  >
                    {service.title}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap gap-2">
                {category.relatedSlugs.map((slug) => (
                  <Link
                    key={slug}
                    href={`/services/${slug}`}
                    data-through-link
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                    style={{
                      borderColor: `${tile.accent}66`,
                      color: tile.accent,
                      ['--tw-ring-color' as string]: tile.accent,
                    }}
                  >
                    {verticals[slug].name}
                    <ArrowRight size={11} aria-hidden />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}
