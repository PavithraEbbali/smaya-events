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
        THE TILT IS DESKTOP-ONLY, and the width overshoot pays for it.

        Rotating a full-width block widens its footprint by `height × sinθ` and
        heightens it by `width × sinθ`; at 3° on a 1280px row that is roughly
        67px of extra height and a corner that would otherwise sit inside the
        viewport edge. `w-[112%] -ml-[6%]` covers the corners so no bare canvas
        shows at either end.

        No tilt below `sm`: a rotated horizontal scroll container fights the
        thumb, and the gain is cosmetic.
      */}
      {/*
        MOBILE GETS NO HORIZONTAL SCROLLING AT ALL.

        The previous attempt kept a native scroll strip and added snap points.
        Snapping made each drag settle cleanly, but it did not fix the actual
        complaint: on a phone this is content you are trying to READ, and a
        sideways strip asks for a gesture that competes with the page's own
        vertical scroll. Two such strips stacked meant two separate sideways
        drags to see eight cards, with the rest permanently off-screen.

        Below `sm` the same cards are simply a vertical list — every card fully
        visible, one ordinary downward scroll. The marquee is untouched from
        `sm` up, where a wide viewport makes a moving strip a feature rather
        than a chore.
      */}
      <ul className="flex flex-col gap-4 px-5 sm:hidden">
        {items.map((item, i) => (
          <li key={item.id}>
            <MarqueeCard item={item} stacked priority={i === 0} />
          </li>
        ))}
      </ul>

      <div className="relative hidden flex-col gap-5 sm:flex sm:-rotate-3 sm:gap-6">
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
      MOBILE GETS A REAL SCROLLER, NOT A SLOWER MARQUEE.

      Below `sm` this is a native horizontal scroll strip: touch-draggable,
      momentum for free, and nothing animating. Slowing the marquee instead
      would leave a phone running a permanent compositor animation for content
      the reader cannot pause without a hover they do not have.

      From `sm` up the overflow is clipped and the track animates.
    */
    <div
      data-marquee={direction}
      /*
        SNAP IS THE MISSING HALF. The cards already carried `snap-start`, but a
        snap child does nothing unless its SCROLL CONTAINER opts in — so this
        was free-scrolling and every drag left a card sliced by the viewport
        edge, which is what made it feel like fighting the strip.

        `snap-x snap-mandatory` makes each drag settle on a card. `scroll-px-5`
        matches the section's own gutter so a snapped card lines up with the
        heading above it instead of hugging the bezel, and the 300px card in a
        375px viewport leaves ~75px of the next one showing — the peek that
        tells a thumb there IS more.

        `snap-none` from `sm`: above that the track is an animated marquee, and
        snap points on a moving element cause the browser to fight the
        animation.
      */
      className="group/marquee w-full snap-x snap-mandatory scroll-px-5 overflow-x-auto overscroll-x-contain sm:w-[112%] sm:-ml-[6%] sm:snap-none sm:overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
        className={`flex w-max px-5 sm:px-0 sm:[animation-play-state:running] sm:[animation-timing-function:linear] sm:[animation-iteration-count:infinite] sm:group-hover/marquee:[animation-play-state:paused] motion-reduce:!animate-none ${
          direction === 'left'
            ? 'sm:[animation-name:marquee-left]'
            : 'sm:[animation-name:marquee-right]'
        }`}
      >
        {row.map((item) => (
          <MarqueeCard key={`a-${item.id}`} item={item} priority={priority} />
        ))}

        {/*
          The second copy is what makes the loop seamless — and it is
          `aria-hidden`, because a screen reader should hear six works, not
          twelve. It is also `hidden sm:flex`: on a phone the reader drags the
          strip by hand, and a duplicate set would just be the same six works
          again with no visual cue that they had wrapped.
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
  stacked = false,
}: {
  item: PortfolioItem
  duplicate?: boolean
  priority?: boolean
  /** Full-width card in the mobile vertical list, rather than a track unit. */
  stacked?: boolean
}) {
  const accent = ACCENT[item.category] ?? '#C5A880'

  return (
    <figure
      aria-hidden={duplicate || undefined}
      data-card={item.id}
      data-duplicate={duplicate}
      /* `mr-*` rather than a track `gap` — see the note on the track. Every
         card must be an identical unit for -50% to land on the seam. */
      className={`group/card relative overflow-hidden rounded-2xl border border-white/10 transition-[transform,border-color] duration-500 hover:border-[#C5A880]/60 ${
        stacked
          ? /* Full width of the list, taller than the track unit because it no
               longer has to fit beside a neighbour. No hover scale: there is no
               hover on the device this renders for. */
            'h-[200px] w-full'
          : 'mr-4 h-[220px] w-[300px] shrink-0 snap-start hover:scale-[1.03] sm:mr-6 sm:h-[260px] sm:w-[360px]'
      } ${duplicate ? 'hidden sm:block' : ''}`}
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
        /* The stacked card is ~92vw, not a 360px track unit — asking for 360px
           there would ship a candidate too small for the width it renders at. */
        sizes={stacked ? '92vw' : '360px'}
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
