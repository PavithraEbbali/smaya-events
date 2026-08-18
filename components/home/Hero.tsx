'use client'

import Link from 'next/link'
import { Fragment, useRef } from 'react'
import { motion, useScroll } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { EASE_OUT } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { HeroCardsStatic, ScrollRevealCards } from './ScrollRevealCards'
import { StatsFooter } from './StatsFooter'
import {
  HeroIntro,
  INTRO_COPY_DELAY,
  NO_INTRO_COPY_DELAY,
  useIntroDecision,
} from './HeroIntro'

type HeadlineWord = { text: string; accent?: boolean }

/*
  Authored bokeh. Fixed positions, not random: a re-roll on every render would
  make the layer flicker on any state change, and randomness at module scope
  would differ between server and client and trip hydration.
  [left%, top%, size px, blur class, opacity]
*/
const DUST: [number, number, number, string, number][] = [
  [12, 22, 6, 'blur-[2px]', 0.5],
  [24, 68, 10, 'blur-md', 0.28],
  [38, 14, 4, 'blur-[1px]', 0.55],
  [47, 82, 8, 'blur-sm', 0.32],
  [58, 38, 5, 'blur-[2px]', 0.45],
  [66, 74, 12, 'blur-md', 0.22],
  [79, 26, 6, 'blur-sm', 0.4],
  [88, 58, 9, 'blur-md', 0.26],
  [94, 12, 4, 'blur-[1px]', 0.5],
]

/*
  Authored line breaks. Type at this scale must never be left to re-wrap — at
  some in-between viewport it finds an awkward shape and sits there.
*/
const HEADLINE: HeadlineWord[][] = [
  [{ text: 'Creating' }, { text: 'Moments,' }],
  [{ text: 'Crafting' }, { text: 'Memories', accent: true }],
]

/* Sequenced entrance, in seconds from when the hero is uncovered. */
const T_HEADLINE = 0.3
const T_SUPPORT = 0.5
const T_STATS = 0.65

/**
 * The home hero, built as a scroll TRACK.
 *
 * ARCHITECTURE — the part that was wrong before and matters most:
 *
 *   <section>            the track. 200vh, and the element useScroll measures.
 *     <div sticky h-screen>   everything visible. Pinned for the track's length.
 *       backgrounds / grid / stats
 *
 * The background layer lives INSIDE the sticky wrapper, not on the section.
 * That is the actual fix for the "seam": on the section it was sized against a
 * 200vh box, so `bg-cover` scaled a 2.09-aspect image to cover 1440x1975 and
 * the visible crop bore no relation to the artwork. Inside an h-screen wrapper
 * it covers exactly one viewport, which is what bg-cover was written for.
 *
 * The track height is gated to `lg`. Below that the card column is not rendered
 * at all, so 200vh would be a second viewport of empty scroll on a phone.
 */
export function Hero() {
  const containerRef = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()
  const decision = useIntroDecision()

  /*
    `['start start', 'end end']` maps 0 -> track top meets viewport top,
    1 -> track bottom meets viewport bottom. With a sticky child that is exactly
    the window in which the content is pinned, so progress and the pin line up
    instead of drifting.
  */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  /* The opening sequence covers the hero until it lifts, so every offset below
     is measured from that point. On a repeat client-side visit the intro is
     skipped and `base` collapses to 0.1s. */
  const base = decision === 'skip' ? NO_INTRO_COPY_DELAY : INTRO_COPY_DELAY

  const enter = (delay: number, y = 18) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay, ease: EASE_OUT },
  })

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-[#2a0f4c] to-[#0d0216] text-white lg:h-[300vh]"
    >
      {/*
        The sticky viewport. `h-svh` not `h-screen` — mobile browser chrome
        crops `vh`, and this element defines what the reader actually sees.
        Below lg it is a normal-flow block with a minimum height, so the hero
        behaves like an ordinary section on phones.
      */}
      <div className="relative flex min-h-[100svh] w-full flex-col overflow-hidden lg:sticky lg:top-0 lg:h-svh lg:min-h-0">
        {/* ---------------------------- Backgrounds ---------------------------- */}

        {/* Owner-supplied artwork. Build-critical: Tailwind compiles this into a
            real CSS url(), so if /public/bg-pattern.jpg is missing the whole
            STYLESHEET fails to resolve and every route 500s. Never point this at
            a path that does not exist. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[url('/bg-pattern.jpg')] bg-cover bg-center bg-no-repeat opacity-25 mix-blend-lighten"
        />

        {/* Drifting orbs — the only moving part of the ground. Positioned with
            plain offsets and no Tailwind transform utility: the keyframes set
            `transform` outright and would drop one. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div
            className="hero-orb-a absolute -left-[12%] top-[6%] h-[48vmax] w-[48vmax] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(212,175,55,0.10) 0%, rgba(88,28,135,0.20) 42%, rgba(88,28,135,0) 72%)',
            }}
          />
          <div
            className="hero-orb-b absolute -right-[10%] bottom-[2%] h-[42vmax] w-[42vmax] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(212,175,55,0.10) 0%, rgba(88,28,135,0.22) 45%, rgba(88,28,135,0) 74%)',
            }}
          />
        </div>

        {/* Key light, anchored over the LEFT column rather than the centre —
            its job is to lift the headline, and centred most of it would fall
            behind the cards. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[8%] top-1/2 z-[1] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 scale-150 rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#9b51e0]/30 via-transparent to-transparent blur-3xl"
        />

        {/*
          ------------------------- Legibility scrim -------------------------
          The rangoli is `opacity-25 mix-blend-lighten`, and `lighten` is the
          problem: it can only ever RAISE the luminance of what it sits on, so
          the pattern was brightening the exact purple the white copy needs to
          stay dark. The key light above compounds it.

          This layer sits at z-[2] — above the pattern, the orbs and the key
          light, below the dust and the content — so it dims the ground without
          touching the type or the cards.

          Angled rather than flat: the copy is in the left column, so the darkest
          stops are placed left and the pattern keeps the most presence on the
          right, where nothing has to be read. The radial pass then deepens the
          area directly behind the headline specifically.

          Alphas are deliberately below the brief's 0.95/0.90/0.95. At those
          values the artwork is effectively erased — measured against the pattern
          at its brightest, 0.82 already carries the paragraph past AA with room
          to spare, and leaves the rangoli visible.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#2A1748]/88 via-[#1E0F35]/82 to-[#0F071E]/78"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 22% 45%, rgba(15,7,30,0.55) 0%, rgba(15,7,30,0) 70%)',
          }}
        />

        {/* Bokeh dust. No will-change: these never animate, and promoting nine
            blurred layers for nothing costs memory on every page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
        >
          {DUST.map(([left, top, size, blur, opacity]) => (
            <span
              key={`${left}-${top}`}
              className={cn('absolute block rounded-full bg-[#D4AF37]', blur)}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                opacity,
              }}
            />
          ))}
        </div>

        {/* ------------------------------- Grid -------------------------------
            `flex-1` + `items-center` rather than the wrapper's own centring, so
            the stats bar can sit on the bottom edge without the grid having to
            know its height.

            `min-h-0` IS LOAD-BEARING. A flex item defaults to
            `min-height: auto`, which refuses to shrink below its content — so
            on a viewport shorter than the column needs, this div held its size,
            pushed the stats bar past the bottom edge, and the wrapper's
            `overflow-hidden` sliced the stats bar in half. With `min-h-0` this
            div is the thing that gives, which is the correct order of
            sacrifice.

            The paddings are svh-fluid rather than a flat `pt-28 pb-10`. Those
            were 152px of immovable space; combined with the deck and the stats
            bar the hero demanded a 630px viewport MINIMUM and clipped on any
            laptop below it. Floors: 5rem clears the fixed header, and the tops
            reproduce the old 112/40 at ~800px and above, so tall screens look
            exactly as they did. */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center px-6 pb-[clamp(0.75rem,3svh,2.5rem)] pt-[clamp(5rem,14svh,7rem)] lg:px-16">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* ---------------------------- Left ---------------------------- */}
            <div>
              <MaskedHeadline
                lines={HEADLINE}
                delay={base + T_HEADLINE}
                /*
                  Two slopes, because the two line breaks have different limiting
                  words. "Creating Moments," runs 8.94x the font size, so the lg
                  term tracks the 50/50 column: ~616px at 1440, ~464px at 1024.
                  The clamp FLOOR matters as much as the slope — at 3rem the min
                  won at 1024 and forced a wrap inside the mask. Verified by
                  comparing the two line boxes' heights: if they differ, a line
                  has wrapped.
                */
                className="text-[clamp(1.625rem,8.4vw,2.125rem)] font-bold leading-[1.08] tracking-[-0.01em] text-white sm:text-6xl sm:leading-[0.94] sm:tracking-tight lg:text-[clamp(2.6rem,4.5vw,5rem)]"
              />

              <motion.p
                {...enter(base + T_SUPPORT)}
                className="mt-8 max-w-lg text-[15px] font-light leading-relaxed text-white/80 sm:mt-10 sm:text-base"
              >
                Luxury weddings, corporate gatherings, fitness festivals and
                trekking adventures — seven practices, one team, one standard.
              </motion.p>

              <motion.div
                {...enter(base + T_SUPPORT + 0.08)}
                className="mt-9 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-8"
              >
                {/* No magnetic wrapper — the cursor-pull is explicitly out. The
                    gold glow stays: it is a hover style, not a cursor effect. */}
                <ButtonLink
                  href="/contact?type=consultation"
                  size="lg"
                  /*
                    Width and glow both belong on the WRAPPER. The anchor sits
                    inside an inline-block motion.div, so `w-full` on it resolves
                    to 100% of a shrink-wrapped box and does nothing.
                  */
                  wrapperClassName="w-full sm:w-auto transition-shadow duration-500 hover:shadow-[0_0_44px_-6px_rgba(212,175,55,0.55)]"
                  className="group w-full gap-3 rounded-none px-10 text-xs font-black uppercase tracking-[0.2em] sm:w-auto"
                >
                  Book Consultation
                  <ArrowRight
                    size={15}
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                  />
                </ButtonLink>

                {/* Secondary — a text link, so it recedes behind the primary. */}
                <Link
                  href="/services"
                  data-tap
                  className="group inline-flex min-h-12 items-center gap-3 self-start text-[11px] font-black uppercase tracking-[0.24em] text-white/60 transition-colors duration-300 hover:text-white sm:min-h-14"
                >
                  Explore All Services
                  <span className="relative block h-px w-9 overflow-hidden bg-white/20">
                    <span className="absolute inset-0 origin-left scale-x-0 bg-smaya-gold transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100" />
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* ---------------------------- Right ----------------------------
                Explicit sizing lives on the deck itself (max-w-lg aspect-[4/3]),
                which is what stops the cards collapsing: they are absolutely
                positioned, so without a sized parent they have nothing to fill.

                NO COLUMN RULE HERE. A 1px gradient divider used to sit on this
                cell's left edge and read as a hard vertical seam against the
                ornate background. Do not reinstate it. */}
            {/* Scroll-driven deck — needs the 300vh track, which only exists
                from `lg`. */}
            <div className="hidden lg:block">
              <ScrollRevealCards progress={scrollYProgress} />
            </div>

            {/* Same three cards below `lg`, driven by the thumb instead of by
                scroll progress. They used to be absent entirely on mobile. */}
            <div className="lg:hidden">
              <HeroCardsStatic />
            </div>
          </div>
        </div>

        {/* ----------------------------- Stats bar -----------------------------
            `shrink-0` so flex never takes its space back. Paired with the
            `min-h-0` above it, this fixes the order of sacrifice: the grid
            gives first, the numbers are never the thing that gets cut. */}
        <motion.div
          {...enter(base + T_STATS, 14)}
          className="relative z-10 shrink-0"
        >
          <StatsFooter />
        </motion.div>

        <HeroIntro decision={decision} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------------- *
 * Headline
 * ------------------------------------------------------------------------- */

/**
 * Line-by-line clip-path reveal.
 *
 * No effect and no animation library — the reveal is the `smaya-line-reveal`
 * keyframe in globals.css with `fill-mode: both`, scoped to [data-motion="on"].
 * That is deliberate: a JS-driven reveal leaves the <h1> invisible until the
 * library loads and runs, and a keyframe cannot fail open — the hidden state
 * and the animation ship in the same stylesheet.
 *
 * This component's only job is to hand it the per-line delay.
 */
function MaskedHeadline({
  lines,
  delay,
  className,
}: {
  lines: HeadlineWord[][]
  delay: number
  className?: string
}) {
  return (
    <h1 className={className}>
      {lines.map((line, li) => (
        <span
          key={li}
          /* The clip must clear descenders: a polygon flush to the box on a
             line set at leading 0.94 slices the tail off every g and y. The
             padding is pulled back out with a negative margin. */
          className="hero-line block pb-[0.14em] will-change-transform"
          style={
            {
              marginBottom: '-0.11em',
              '--line-delay': `${(delay + li * 0.12).toFixed(2)}s`,
            } as React.CSSProperties
          }
        >
          {line.map((word, wi) => (
            <Fragment key={wi}>
              <span className={cn(word.accent && 'italic text-smaya-gold')}>
                {word.text}
              </span>
              {/* A real space TEXT NODE, not a margin — margins look identical
                  but leave the accessible name, the copied text and the
                  indexable content reading "CreatingMoments,". */}
              {wi < line.length - 1 && ' '}
            </Fragment>
          ))}
        </span>
      ))}
    </h1>
  )
}
