'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { portfolioItems, type PortfolioItem } from '@/data/portfolio'
import { Atmosphere } from '@/components/ui/Atmosphere'

/* -------------------------------------------------------------------------- *
 * Which works appear here
 *
 * Named explicitly rather than sliced off the top of `portfolioItems`. The
 * previous section took `slice(0, 5)`, which silently changes the home page the
 * moment anyone reorders or inserts a portfolio entry — a home page should not
 * be a side effect of array order.
 * -------------------------------------------------------------------------- */

const FEATURED = [
  'Royal Udaipur Vows',
  'Sunset Valley Trek',
  'Annual Sales Gala',
  'Neon Dance Fitness',
  'Massive Pool Party',
  'Live Summer Concert',
]

const items: PortfolioItem[] = FEATURED.map((title) =>
  portfolioItems.find((item) => item.title === title),
).filter((item): item is PortfolioItem => Boolean(item))

/** Per-category accent, matching the gallery so a work reads the same in both. */
const ACCENT: Record<string, string> = {
  Weddings: '#D4AF37',
  Corporate: '#C5A880',
  Fitness: '#B9A6DC',
  Trek: '#A8BFA0',
  Community: '#E0B7A0',
  Entertainment: '#9D8CBF',
}

/** The two rows carry different slices so the same card is never level with itself. */
const ROW_ONE = items
const ROW_TWO = [...items.slice(3), ...items.slice(0, 3)]

/* -------------------------------------------------------------------------- *
 * Section
 * -------------------------------------------------------------------------- */

export function PortfolioPreview() {
  return (
    /*
      `overflow-hidden` is load-bearing here, not tidiness.

      The rows are wider than the viewport and tilted, so both ends and both
      corners deliberately run past the edge — that overhang is what makes a
      marquee read as continuous rather than as a strip that starts and stops.
      Without the clip it is simply a horizontal scrollbar.
    */
    <section className="surface-obsidian relative overflow-hidden py-20 sm:py-24">
      <Atmosphere />

      {/* ------------------------------- Header --------------------------- */}
      <div className="relative mx-auto mb-12 flex max-w-7xl flex-col gap-6 px-5 sm:mb-16 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <span className="flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[#C5A880]/60" />
            {/* `pr` matches the tracking — wide letter-spacing leaves a trailing
                gap that otherwise pushes the label off its rule. */}
            <span className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em] text-[#C5A880]">
              Our Legacy
            </span>
          </span>

          <h2 className="mt-4 font-serif text-[2rem] font-bold leading-[1.04] tracking-[-0.03em] text-white sm:text-[2.75rem]">
            Selected Works
          </h2>
        </div>

        <Link
          href="/gallery"
          data-tap
          className="group inline-flex items-center gap-2 self-start rounded-full border border-white/20 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white outline-none transition-colors hover:border-[#C5A880] hover:text-[#C5A880] focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070609] sm:self-auto"
        >
          View Full Gallery
          <ArrowRight
            size={15}
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/* ------------------------------ Marquee --------------------------- */}
      {/*
        ONE TREATMENT AT EVERY WIDTH: the ticker runs on a phone exactly as it
        does on a desktop.

        THE TILT STAYS DESKTOP-ONLY, though. Rotating a full-width block widens
        its footprint by `height × sinθ`; at 3° on a 1280px row that is ~67px of
        extra height plus corners that would sit inside the viewport edge, which
        is what `w-[112%] -ml-[6%]` exists to absorb. At 375px the same overhang
        has nothing to absorb it and simply pushes the page sideways. The MOTION
        is what was asked for; the 3° is decoration that costs a horizontal
        scrollbar on a phone.
      */}
      <div className="relative flex flex-col gap-5 sm:-rotate-3 sm:gap-6">
        <MarqueeRow row={ROW_ONE} direction="left" seconds={38} priority />
        <MarqueeRow row={ROW_TWO} direction="right" seconds={46} />
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * One row
 * -------------------------------------------------------------------------- */

function MarqueeRow({
  row,
  direction,
  seconds,
  priority = false,
}: {
  row: PortfolioItem[]
  direction: 'left' | 'right'
  seconds: number
  priority?: boolean
}) {
  return (
    /*
      THE TICKER RUNS AT EVERY WIDTH.

      This was a native scroll strip below `sm` — first free-scrolling, then
      snap-assisted — on the reasoning that a phone has no hover and therefore
      no way to pause a moving row. The call now is the opposite: the continuous
      motion IS the effect, so mobile gets the same clipped, animated track as
      desktop rather than a hand-dragged one.

      `overflow-hidden` at all widths, and no snap anywhere: snap points on an
      element the browser is already animating make the two fight, which is what
      produced the stuttering drag before.
    */
    <div
      data-marquee={direction}
      className="group/marquee w-full overflow-hidden sm:w-[112%] sm:-ml-[6%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        data-track
        style={{ animationDuration: `${seconds}s` }}
        /*
          `w-max` so the track is exactly as wide as its contents — a percentage
          width would make the -50% travel land somewhere arbitrary and the loop
          would visibly jump.

          `motion-reduce:animate-none` stops the whole thing for anyone who has
          asked for less motion; the row is still readable and, below `sm`,
          still scrollable.
        */
        /*
          NO FLEX `gap` HERE — the spacing lives on the cards instead, and that
          is what makes the loop seamless.

          With `gap`, a track of two six-card sets has ELEVEN gaps, so half its
          width is six cards plus five and a half gaps while one set is six
          cards plus six. Measured: half-track 2292px against a set width of
          2301 — a 9px jump every single lap. Margin on each card makes every
          unit identical, so -50% lands exactly one set along.
        */
        /* No `sm:` prefixes on the animation any more — the ticker is the
           point, so it runs from the smallest screen up. The hover-pause is
           harmless where there is no hover. */
        className={`flex w-max [animation-play-state:running] [animation-timing-function:linear] [animation-iteration-count:infinite] group-hover/marquee:[animation-play-state:paused] motion-reduce:!animate-none ${
          direction === 'left'
            ? '[animation-name:marquee-left]'
            : '[animation-name:marquee-right]'
        }`}
      >
        {row.map((item) => (
          <MarqueeCard key={`a-${item.id}`} item={item} priority={priority} />
        ))}

        {/*
          The second copy is what makes the loop seamless, and it now renders at
          EVERY width. It used to be hidden below `sm`, which was right while
          the phone dragged the strip by hand — but a `-50%` marquee with only
          one set would run the track clean off the screen and leave the row
          empty for the rest of the lap.

          Still `aria-hidden`: a screen reader should hear six works, not twelve.
        */}
        {row.map((item) => (
          <MarqueeCard key={`b-${item.id}`} item={item} duplicate />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One card
 * -------------------------------------------------------------------------- */

function MarqueeCard({
  item,
  duplicate = false,
  priority = false,
}: {
  item: PortfolioItem
  duplicate?: boolean
  priority?: boolean
}) {
  const accent = ACCENT[item.category] ?? '#C5A880'

  return (
    <figure
      aria-hidden={duplicate || undefined}
      data-card={item.id}
      data-duplicate={duplicate}
      /* `mr-*` rather than a track `gap` — see the note on the track. Every
         card must be an identical unit for -50% to land on the seam. */
      /* `mr-*` rather than a track `gap` — every unit must be identical or the
         -50% loop lands off the seam. Duplicates are no longer hidden on
         mobile: the loop needs both sets at every width. */
      className="group/card relative mr-4 h-[220px] w-[300px] shrink-0 overflow-hidden rounded-2xl border border-white/10 transition-[transform,border-color] duration-500 hover:scale-[1.03] hover:border-[#C5A880]/60 sm:mr-6 sm:h-[260px] sm:w-[360px]"
      style={{
        /* Textured ground beneath the photograph, so a slow or failed image
           leaves a rich card rather than a grey box. */
        backgroundImage: 'linear-gradient(to bottom right, #1a1714 0%, #0a0908 100%)',
        boxShadow: '0 24px 60px -40px rgba(0,0,0,0.95)',
      }}
    >
      <Image
        src={item.img}
        alt={duplicate ? '' : item.title}
        fill
        sizes="360px"
        priority={priority && !duplicate}
        className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
      />

      {/* Caption floor. A photograph's local brightness is unknowable, so the
          contrast is guaranteed here rather than hoped for. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.60) 36%, rgba(5,5,5,0.08) 64%, transparent 100%)',
        }}
      />

      <figcaption className="absolute inset-x-0 bottom-0 p-4">
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

        {/* `break-words` guards the pathological unbreakable title — the card is
            a fixed width, so a long word would otherwise push past its edge. */}
        <p className="mt-2 break-words font-serif text-[1.0625rem] font-bold leading-snug tracking-[-0.02em] text-white">
          {item.title}
        </p>
      </figcaption>
    </figure>
  )
}
