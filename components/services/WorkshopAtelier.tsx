'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

import type { VerticalColumn, VerticalService } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { getLenis } from '@/lib/lenis-instance'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { Atmosphere } from '@/components/ui/Atmosphere'

/* -------------------------------------------------------------------------- *
 * Scroll configuration
 *
 * Each row owns a TRACK taller than its pinned panel. The extra height is the
 * only thing that decides how much scrolling the deck consumes, and progress
 * through it is the animation's only clock — no state, no timers, nothing that
 * can drift away from where the page actually is.
 * -------------------------------------------------------------------------- */

/** Viewport heights of scroll granted to each card after the first. */
const SEGMENT_VH = 60

/**
 * Weight, applied to scroll progress itself.
 *
 * Springing the PROGRESS rather than each card means every card in a row reads
 * from one smoothed clock, so the stack cannot shear apart under a fast flick
 * — which is what happens when each card springs independently. Kept gentle
 * because Lenis is already smoothing the scroll; two aggressive smoothers read
 * as lag rather than weight.
 */
const SMOOTH = { stiffness: 120, damping: 30, mass: 0.6, restDelta: 0.0005 }

/* --------------------------- Stack geometry --------------------------------
   Rank 0 is the card in hand; each subsequent rank sits lower, smaller and
   very slightly askew, so the deck reads as physical objects rather than a
   stack of aligned rectangles.
   -------------------------------------------------------------------------- */

type Seat = { y: number; scale: number; rotate: number }

const SEATS: readonly [Seat, Seat, Seat] = [
  { y: 0, scale: 1, rotate: 0 },
  { y: 22, scale: 0.945, rotate: -1.5 },
  { y: 44, scale: 0.89, rotate: 1.2 },
]

/** Where a card goes once it has been peeled off the front. */
const PEEL_X = 480
const PEEL_Y = -46
const PEEL_ROTATE = 14

/* -------------------------------------------------------------------------- *
 * Palettes
 * -------------------------------------------------------------------------- */

type Palette = {
  ink: string
  accent: string
  muted: string
  edge: string
  glow: string
  card: string
}

const GOLD: Palette = {
  ink: '#F0E6D2',
  accent: '#D4AF37',
  muted: '#C5A880',
  edge: 'rgba(212,175,55,0.40)',
  glow: 'rgba(212,175,55,0.30)',
  card: 'linear-gradient(158deg, #241E14 0%, #1A1610 58%, #110E0A 100%)',
}

const LAVENDER: Palette = {
  ink: '#E7E0F3',
  /* The brief's `#9D8CBF`. Measured at 5.10:1 on this card's lightest gradient
     stop — AA for the 11px bold badge it tints, though a shade short of AAA,
     which the previous lighter accent cleared. */
  accent: '#9D8CBF',
  muted: '#7A6A95',
  edge: 'rgba(157,140,191,0.42)',
  glow: 'rgba(157,140,191,0.30)',
  card: 'linear-gradient(158deg, #272138 0%, #1E1930 58%, #141020 100%)',
}

/** Brushed texture: fine striations plus one broad diagonal sheen. */
const BRUSHED =
  'repeating-linear-gradient(90deg, rgba(255,255,255,0.030) 0px, rgba(255,255,255,0.030) 1px, transparent 1px, transparent 3px), linear-gradient(112deg, transparent 18%, rgba(255,255,255,0.055) 34%, transparent 52%)'

/* -------------------------------------------------------------------------- *
 * Per-service artwork
 *
 * Keyed by service title to stay aligned with data/verticals.ts — an index
 * would silently pair the wrong photograph with the wrong card the moment
 * anyone reorders that array.
 *
 * The brief writes `/images/wellness-retreatment.jpg`; the supplied file is
 * `wellness-retreats`, and "retreatment" means treating again. Kept as the
 * asset's own subject rather than propagating the slip into the codebase.
 * -------------------------------------------------------------------------- */

const ART: Record<string, string> = {
  'Dance Masterclasses': '/images/dancing-masterclass.jpg',
  'Zumba Training': '/images/zumba-training.jpg',
  'Yoga Foundations': '/images/yoga-foundations.jpg',
  'Public Speaking': '/images/public-speaking.jpg',
  'Wellness Retreats': '/images/wellness-retreats.jpg',
  'Corporate Focus Retreats': '/images/corporate-focus-retreats.jpg',
  'Meditation Camps': '/images/meditation-camps.jpg',
}

/* -------------------------------------------------------------------------- *
 * Section
 * -------------------------------------------------------------------------- */

export function WorkshopAtelier({
  columns,
}: {
  columns: readonly [VerticalColumn, VerticalColumn]
}) {
  const reduced = usePrefersReducedMotion()
  const [skills, deep] = columns

  return (
    /*
      `overflow-x-clip`, EMPHATICALLY NOT `overflow-hidden`.

      An ancestor with `overflow: hidden` becomes the scroll container that
      `position: sticky` resolves against — and since that box does not itself
      scroll, the pinned panel never sticks. Measured: the panel's top ran
      0 -> -347 -> -684 -> -1020 as the page scrolled, i.e. it was simply
      scrolling away.

      Clipping is still needed, because a peeling card travels 480px to the
      right and would otherwise widen the page. `overflow: clip` does that
      WITHOUT creating a scroll container, and clip on one axis is the one case
      where the other axis may stay `visible` rather than being forced to
      `auto`. So the horizontal escape is cut off and sticky still works.
    */
    /*
      `absolute`, not `fixed`, for the atmosphere here — this is a SECTION on a
      longer page rather than the page itself, so the lighting belongs to its
      own box. A fixed rig would keep shining while the reader scrolled into
      whatever comes next.
    */
    <div className="surface-obsidian relative w-full overflow-x-clip py-20 sm:py-24 lg:py-28">
      {/* This section had its own hand-rolled warm/cool lamps at very nearly
          these coordinates. Replaced with the shared rig — two near-identical
          gradients in two files is precisely the drift the utility exists to
          prevent. */}
      <Atmosphere />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-20 px-6 lg:gap-24">
        {reduced ? (
          <>
            <StaticRow column={skills} palette={GOLD} priority />
            <StaticRow column={deep} palette={LAVENDER} />
          </>
        ) : (
          <>
            <ScrollRow column={skills} palette={GOLD} priority />
            <ScrollRow column={deep} palette={LAVENDER} />
          </>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One row — layout preserved exactly; scroll now drives the deck
 * -------------------------------------------------------------------------- */

function ScrollRow({
  column,
  palette,
  priority = false,
}: {
  column: VerticalColumn
  palette: Palette
  priority?: boolean
}) {
  const items = column.items
  const total = items.length
  const track = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })
  const progress = useSpring(scrollYProgress, SMOOTH)

  /*
    ONE DISCRETE INDEX, MIRRORED OUT OF A CONTINUOUS VALUE.

    The cards themselves read the continuous progress, so their motion is as
    smooth as the scroll. The counter and the active styling cannot be
    continuous — they have to name a single card — so a discrete index is
    derived here and only written to state when it actually changes. Setting it
    on every scroll frame would re-render the whole row dozens of times a
    second for a value that changes four times in total.
  */
  /*
    Read from the RAW scroll, not the spring. The cards should lag a little —
    that is the weight. A counter should not: it is information rather than
    decoration, and a number that arrives a beat after the card it names reads
    as a bug rather than as physics.
  */
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(total - 1, Math.max(0, Math.round(v * (total - 1))))
    setActive((prev) => (prev === next ? prev : next))
  })

  /*
    THE BUTTON SCROLLS THE PAGE; IT DOES NOT SET STATE.

    With the deck derived from scroll position, anything that set an index
    directly would be overwritten by the very next scroll frame. Moving the
    page instead keeps scroll as the single source of truth, and it hands off
    to Lenis where present — Lenis reasserts scroll every frame, so a native
    smooth scroll would be fought and overwritten mid-flight.
  */
  const scrollToCard = useCallback(
    (index: number) => {
      const el = track.current
      if (!el) return
      /* The usable scroll range spans the whole deck, and card `i` sits
         `i / (total - 1)` of the way through it. */
      const usable = Math.max(1, el.offsetHeight - window.innerHeight)
      const trackTop = el.getBoundingClientRect().top + window.scrollY
      const target = trackTop + usable * (index / Math.max(1, total - 1))
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(target, { duration: 1.1 })
      else window.scrollTo({ top: target, behavior: 'smooth' })
    },
    [total],
  )

  const atEnd = active >= total - 1

  return (
    /*
      TRACK = pinned panel + one segment of scroll per card after the first.
      The padding IS the scroll budget; the panel sticks while it goes by.
    */
    <div ref={track} data-track={column.eyebrow}>
      {/* `top-24` clears the fixed navbar. */}
      <div className="sticky top-24" data-pin={column.eyebrow}>
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
          {/* ----------------------------- Header ---------------------------- */}
          <header data-row={column.eyebrow}>
            <span className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: palette.edge }} />
              {/* `pr` matches the tracking — wide letter-spacing leaves a
                  trailing gap that otherwise pushes the label off its rule. */}
              <span
                className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em]"
                style={{ color: palette.accent }}
              >
                {column.eyebrow}
              </span>
            </span>

            <h2
              className="mt-3 font-serif text-[2.25rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[2.75rem]"
              style={{ color: palette.ink }}
            >
              {column.title}
            </h2>

            <p className="mt-4 max-w-sm text-[0.875rem] leading-[1.65] text-white/60">
              {total} experiences in this deck. Keep scrolling and they deal
              themselves, one at a time.
            </p>

            {/* -------------------------- Deck controls ---------------------- */}
            <div className="mt-7 flex items-center gap-4">
              <span
                className="font-mono text-[11px] font-bold tracking-[0.2em]"
                style={{ color: palette.accent }}
                data-counter
              >
                {String(active + 1).padStart(2, '0')}
                <span className="text-white/35"> / {String(total).padStart(2, '0')}</span>
              </span>

              {/*
                The keyboard and pointer route to the same sequence. It scrolls
                rather than jumping, so what the reader sees is identical to
                having scrolled there by hand.
              */}
              <button
                type="button"
                onClick={() => scrollToCard(Math.min(total - 1, active + 1))}
                disabled={atEnd}
                data-next
                data-disabled={atEnd}
                className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] disabled:opacity-40"
                style={{ borderColor: palette.edge, color: palette.ink }}
              >
                Next card
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0"
                >
                  →
                </span>
              </button>
            </div>

            {/* Announced rather than shown: the visual counter above is
                decorative for anyone who cannot see the deck move. */}
            <span aria-live="polite" className="sr-only">
              {`Card ${active + 1} of ${total}: ${items[active].title}`}
            </span>
          </header>

          {/* ------------------------------- Deck --------------------------- */}
          {/*
            FIXED HEIGHT, EVERY CARD ABSOLUTE.

            The deck reserves its full height up front and nothing inside it
            participates in layout, so dealing, peeling and settling cannot move
            a single pixel of the page. The zero-layout-shift guarantee is
            structural, not something the animation has to respect.
          */}
          <div
            className="relative h-[404px] w-full sm:h-[444px]"
            data-deck={column.eyebrow}
            data-active={active}
          >
            {items.map((item, i) => (
              <ScrollCard
                key={item.title}
                item={item}
                index={i}
                total={total}
                badge={String(i + 1).padStart(2, '0')}
                palette={palette}
                progress={progress}
                isActive={i === active}
                priority={priority && i === 0}
              />
            ))}
          </div>
        </section>
      </div>

      {/*
        THE SCROLL BUDGET, AS AN IN-FLOW SIBLING RATHER THAN PADDING.

        This was `padding-bottom` on the track, and it did not work: a sticky
        element is constrained to its containing block, which for a plain block
        parent is the CONTENT box — and padding sits outside it. With the pin as
        the only in-flow child, its containing block was exactly its own height,
        so it had nowhere to travel and never stuck at all. Measured: the
        panel's top ran 0 -> -347 -> -684 -> -1020, simply scrolling away.

        A real sibling adds height INSIDE the content box, which is the room the
        pin needs. One segment per card after the first.
      */}
      <div
        aria-hidden
        data-spacer
        style={{ height: `${(total - 1) * SEGMENT_VH}vh` }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One card
 * -------------------------------------------------------------------------- */

function ScrollCard({
  item,
  index,
  total,
  badge,
  palette,
  progress,
  isActive,
  priority,
}: {
  item: VerticalService
  index: number
  total: number
  badge: string
  palette: Palette
  progress: MotionValue<number>
  isActive: boolean
  priority: boolean
}) {
  /*
    FIVE STOPS, ONE PER STATION THE CARD PASSES THROUGH.

    A card enters from below the deepest visible seat, climbs through ranks 2
    and 1, takes the front, and peels away — and `step` is the slice of the
    track between each station. Card 0's early stops are negative and the last
    card's final stop is beyond 1; useTransform clamps both, which is exactly
    what should happen: the first card simply starts at the front, and the last
    one never peels off to leave an empty deck behind it.
  */
  const step = 1 / Math.max(1, total - 1)
  const at = (n: number) => (index - n) * step
  const stops: [number, number, number, number, number] = [
    at(3),
    at(2),
    at(1),
    at(0),
    at(-1),
  ]

  const x = useTransform(progress, stops, [0, 0, 0, 0, PEEL_X])
  const y = useTransform(progress, stops, [
    SEATS[2].y + 18,
    SEATS[2].y,
    SEATS[1].y,
    SEATS[0].y,
    PEEL_Y,
  ])
  const scale = useTransform(progress, stops, [
    SEATS[2].scale - 0.04,
    SEATS[2].scale,
    SEATS[1].scale,
    SEATS[0].scale,
    SEATS[0].scale,
  ])
  const rotate = useTransform(progress, stops, [
    SEATS[2].rotate,
    SEATS[2].rotate,
    SEATS[1].rotate,
    SEATS[0].rotate,
    PEEL_ROTATE,
  ])
  const opacity = useTransform(progress, stops, [0, 1, 1, 1, 0])

  const Icon = getIcon(item.icon)

  return (
    <motion.article
      data-card={item.title}
      data-index={index}
      data-card-active={isActive}
      /*
        Cards that are not at the front are decorative. `inert` removes them
        from the tab order AND the accessibility tree in one attribute —
        without it a screen reader announces the deck as several competing
        articles and a keyboard user can focus a card behind two others.
      */
      inert={!isActive}
      aria-hidden={!isActive}
      className="absolute inset-x-0 top-0 h-[380px] overflow-hidden rounded-2xl border sm:h-[420px]"
      style={{
        x,
        y,
        scale,
        rotate,
        opacity,
        /* Earlier cards sit ON TOP, so a peeling card flies over the ones it
           leaves behind. Static, because a stacking order has no meaningful
           in-between state to interpolate through. */
        zIndex: total - index,
        borderColor: isActive ? palette.edge : 'rgba(255,255,255,0.09)',
        backgroundImage: `${BRUSHED}, ${palette.card}`,
        boxShadow: isActive
          ? `0 30px 60px -28px rgba(0,0,0,0.95), 0 0 42px -14px ${palette.glow}`
          : '0 18px 40px -26px rgba(0,0,0,0.9)',
      }}
    >
      <CardFace item={item} badge={badge} palette={palette} priority={priority} Icon={Icon} />
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- *
 * Reduced-motion fallback
 *
 * Every card here is placed by scroll progress, so switching the transforms
 * off would heap the whole deck into one spot. The honest fallback is the same
 * content as an ordinary grid: nothing pinned, and nobody scrolls several
 * viewports to read four cards.
 * -------------------------------------------------------------------------- */

function StaticRow({
  column,
  palette,
  priority = false,
}: {
  column: VerticalColumn
  palette: Palette
  priority?: boolean
}) {
  return (
    <section data-static-row={column.eyebrow}>
      <header data-row={column.eyebrow}>
        <span className="flex items-center gap-3">
          <span aria-hidden className="h-px w-8" style={{ backgroundColor: palette.edge }} />
          <span
            className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em]"
            style={{ color: palette.accent }}
          >
            {column.eyebrow}
          </span>
        </span>
        <h2
          className="mt-3 font-serif text-[2.25rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[2.75rem]"
          style={{ color: palette.ink }}
        >
          {column.title}
        </h2>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {column.items.map((item, i) => (
          <article
            key={item.title}
            data-card={item.title}
            data-index={i}
            className="h-[380px] overflow-hidden rounded-2xl border"
            style={{
              borderColor: palette.edge,
              backgroundImage: `${BRUSHED}, ${palette.card}`,
            }}
          >
            <CardFace
              item={item}
              badge={String(i + 1).padStart(2, '0')}
              palette={palette}
              priority={priority && i === 0}
              Icon={getIcon(item.icon)}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * The card face — unchanged from the reference design
 * -------------------------------------------------------------------------- */

function CardFace({
  item,
  badge,
  palette,
  priority,
  Icon,
}: {
  item: VerticalService
  badge: string
  palette: Palette
  priority: boolean
  Icon: ReturnType<typeof getIcon>
}) {
  return (
    <>
      {/* ------------------------------ Artwork ---------------------------- */}
      <div className="relative h-[52%] w-full overflow-hidden">
        <Image
          src={ART[item.title]}
          alt=""
          fill
          sizes="(min-width: 1024px) 520px, 92vw"
          priority={priority}
          className="object-cover"
          /* The image is decorative — the heading beneath it carries the
             meaning — so `alt` stays empty rather than repeating the title to
             a screen reader twice. */
        />
        {/* Reads the artwork down into the card body so the join is a gradient
            rather than a hard seam. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,5,5,0.10) 0%, rgba(5,5,5,0.06) 46%, rgba(5,5,5,0.72) 84%, rgba(5,5,5,0.96) 100%)',
          }}
        />
        <span
          aria-hidden
          data-badge
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-[11px] font-bold backdrop-blur-sm"
          style={{
            borderColor: palette.edge,
            backgroundColor: 'rgba(5,5,5,0.62)',
            color: palette.accent,
          }}
        >
          {badge}
        </span>
      </div>

      {/* ------------------------------- Copy ------------------------------ */}
      <div className="relative flex h-[48%] flex-col justify-center px-6 pb-6">
        {/* Icon sits ON the heading line. */}
        <h3
          className="flex items-start gap-2.5 font-serif text-[1.375rem] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[1.5rem]"
          style={{ color: palette.ink }}
        >
          <Icon
            size={17}
            aria-hidden
            className="mt-[3px] shrink-0"
            style={{ color: palette.accent }}
          />
          {item.title}
        </h3>

        <p className="mt-2.5 text-[0.8125rem] leading-[1.6] text-white/75">
          {/* Long form lives in data/verticals.ts as `longDesc`; `desc` stays
              the short copy other surfaces use. */}
          {item.longDesc ?? item.desc}
        </p>
      </div>
    </>
  )
}
