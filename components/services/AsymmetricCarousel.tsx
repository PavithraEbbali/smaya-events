'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  type Transition,
} from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import type { ServiceCategory } from '@/data/services'
import type { Vertical, VerticalSlug } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { getLenis } from '@/lib/lenis-instance'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { Atmosphere } from '@/components/ui/Atmosphere'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 30 }
/** The image dissolve. Slower than the copy — it is scenery, not content. */
const DISSOLVE: Transition = { duration: 0.8, ease: [0.22, 1, 0.36, 1] }

/** Viewport heights of scroll granted to each division after the first. */
const SEGMENT_VH = 70
/** The fixed site header, measured — the pinned stage has to clear it. */
const NAV_H = 77

/* -------------------------------------------------------------------------- *
 * Slide identity
 *
 * Keyed by category title to stay aligned with data/services.ts — an index
 * would silently pair the wrong accent and photograph with the wrong slide the
 * moment anyone reorders that array.
 *
 * Artwork is local rather than remote: next/image proxies remote files at
 * request time, and this project has had heroes time out and 500 a route.
 * Paths are kebab-case — spaces need percent-encoding, and a capitalised path
 * resolves on Windows but 404s on the Linux host that serves production.
 * -------------------------------------------------------------------------- */

/*
  TWO COLOURS PER SLIDE, NOT ONE — and this is what makes the gradients
  affordable.

  `accent` is the division's identity: borders, glows, dots, the gradient
  washes. `ink` is the same hue lifted for TEXT. They were one value until the
  ambient tint went in, and then the arithmetic stopped working: the tint
  raises the panel's luminance, and the accents had barely half a point of
  contrast to spare above AA. Measured with the wash at full strength over the
  copy, the deepest foil fell to 3.51:1 and two others to 4.29.

  Diluting the gradient until the old colours passed would have taken it to
  roughly 5% — invisible, which is not what was asked for. Lifting only the
  text keeps every border, dot and glow exactly as rich as intended while the
  small type gets the headroom it needs.
*/
type Slide = { badge: string; accent: string; ink: string; art: string }

const SLIDES: Record<string, Slide> = {
  'Weddings & Celebrations': {
    badge: '01',
    accent: '#D4AF37',
    ink: '#EDD284',
    art: '/image_3.png',
  },
  'Corporate Events': {
    badge: '02',
    accent: '#C5A880',
    ink: '#E4D2B6',
    art: '/corporate-conferences-realistic.jpg',
  },
  'Fitness & Wellness': {
    badge: '03',
    accent: '#B9A6DC',
    ink: '#DACFF0',
    art: '/images/yoga-foundations.jpg',
  },
  'Adventure & Outdoors': {
    badge: '04',
    accent: '#C5A880',
    ink: '#E4D2B6',
    art: '/expedition-camping.jpg',
  },
  'Production & Entertainment': {
    badge: '05',
    accent: '#9D8CBF',
    ink: '#CBBCE6',
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

export function AsymmetricCarousel({ categories, verticals }: Props) {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  /* Direction only points the entry animation; it never needs to survive a
     re-render as anything more than a hint. */
  const [dir, setDir] = useState<1 | -1>(1)

  const ordered = ORDER.map((t) => categories.find((c) => c.title === t)).filter(
    (c): c is ServiceCategory => Boolean(c),
  )
  const total = ordered.length
  const category = ordered[active]
  const slide = SLIDES[category.title]
  const Icon = getIcon(category.icon)

  /*
    SCROLL IS THE CLOCK; the controls move the page rather than the state.

    With the active division derived from scroll position, anything that set an
    index directly would be overwritten by the very next scroll frame — the
    arrows and dots would appear to do nothing. Scrolling instead keeps one
    source of truth, and it hands off to Lenis where present: Lenis reasserts
    scroll every frame, so a native smooth scroll gets overwritten mid-flight.
  */
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })

  /*
    The discrete index is read from the RAW progress, not a spring.

    The artwork should lag a little — that is the weight. An index should not:
    it drives the badge, the dots and the announced position, and a number that
    arrives a beat after the picture it names reads as a bug rather than as
    physics. It is also only written when it CHANGES, so a scroll does not
    re-render the section sixty times a second for a value that moves four
    times in total.
  */
  /*
    THE PIN IS DESKTOP-ONLY, and everything that depends on it is gated the
    same way.

    On a phone the stage and panel stack to roughly 850px — taller than the
    viewport — so pinning them would put the bottom of the panel permanently
    out of reach while the page refuses to scroll past it. Below `lg` there is
    therefore no pin and no spacer, and the carousel goes back to being driven
    by its arrows and dots.

    Read on demand rather than through a hook: `matchMedia` at click time has
    no first-frame problem, whereas a hook resolves one render late and would
    briefly disagree with the CSS about which mode we are in.
  */
  const pinned = () =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    /*
      Without this guard the mobile carousel is UNUSABLE, not merely different.
      With no spacer the track is barely taller than its own content, so
      progress drifts as the section passes through the viewport and would
      reset the division to 01 moments after any tap.
    */
    if (!pinned()) return
    const next = Math.min(total - 1, Math.max(0, Math.round(v * (total - 1))))
    setActive((prev) => {
      if (prev === next) return prev
      setDir(next > prev ? 1 : -1)
      return next
    })
  })

  const go = useCallback(
    (next: number) => {
      const index = ((next % total) + total) % total

      /* Unpinned: scroll is not the clock, so the controls own the state
         directly. Scrolling instead would target the same pixel for every
         division and the carousel would never leave the first one. */
      if (!pinned()) {
        setDir(index > active ? 1 : -1)
        setActive(index)
        return
      }

      const el = track.current
      if (!el) return
      /* Pinned: the usable range spans the whole carousel, and division `i`
         sits `i / (total - 1)` of the way through it. Moving the page keeps
         scroll as the single source of truth. */
      const usable = Math.max(1, el.offsetHeight - window.innerHeight)
      const top =
        el.getBoundingClientRect().top +
        window.scrollY +
        usable * (index / Math.max(1, total - 1))
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(top, { duration: 1.0 })
      else window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    },
    [total, active],
  )

  /* Left/Right step through the carousel, Home/End jump to the ends — the
     standard contract for a slide set. Other keys are left alone so page
     scrolling still works. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: total - 1,
    }
    const next = map[event.key]
    if (next === undefined) return
    event.preventDefault()
    go(next)
  }

  return (
    /*
      `intensity={0.55}` — the rig is dialled back here, not omitted.

      This page already lights itself: each slide throws its own accent glow
      across the stage and panel, and those change per division. At full
      strength the ambient lamps would compete with that and the per-slide
      identity would wash out. Half-strength keeps the room lit underneath
      while the division's own colour stays the brightest thing in it.
    */
    <div className="surface-obsidian relative min-h-screen pb-24 pt-32 sm:pb-28 sm:pt-36">
      <Atmosphere anchor="fixed" intensity={0.55} />
      {/* -------------------------------- Hero ---------------------------- */}
      <header className="mx-auto mb-10 max-w-6xl px-5 sm:mb-14 sm:px-6">
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-px w-8 transition-colors duration-700"
            style={{ backgroundColor: `${slide.accent}99` }}
          />
          {/* `pr` matches the tracking — wide letter-spacing leaves a trailing
              gap that otherwise pushes the label off its rule. */}
          <span
            className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em] transition-colors duration-700"
            style={{ color: slide.ink }}
          >
            Our Expertise
          </span>
        </span>

        <h1 className="mt-4 max-w-3xl text-balance font-serif text-[2.5rem] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.25rem] lg:text-[3.75rem]">
          Five divisions, one standard.
        </h1>
      </header>

      {/* ------------------------------ Carousel --------------------------- */}
      {/*
        THE TRACK. Its height is the scroll budget and nothing else.

        The stage is pinned inside it, so scrolling through the track advances
        the divisions in sequence and normal page scrolling resumes at the end.

        The extra height MUST be an in-flow spacer rather than padding on this
        element: a sticky child is constrained to its containing block, which
        for a plain block parent is the CONTENT box — and padding sits outside
        it. Budget the scroll with padding and the pin has literally nowhere to
        travel, so it never sticks at all.
      */}
      <div ref={track} data-track className="relative">
        <section
          aria-roledescription="carousel"
          aria-label="Service divisions"
          onKeyDown={onKeyDown}
          data-pin
          /* `top` clears the fixed header. Nothing in this element's ancestry
             may set `overflow: hidden` — an ancestor that does becomes the
             scroll container sticky resolves against, and the pin silently
             stops pinning. */
          className="mx-auto max-w-6xl px-5 sm:px-6 lg:sticky"
          style={{ top: NAV_H + 16 }}
        >
        {/*
          THE OVERLAP IS TWO GRID ITEMS SHARING ONE ROW.

          The stage occupies columns 1-7 and the panel 7-12, both on row 1, so
          they genuinely overlap in column 7 rather than the panel being nudged
          over the stage with a negative margin. Grid placement keeps the two in
          the same flow, so nothing has to be re-tuned when the copy or the
          viewport changes.

          Below `lg` neither placement applies and they simply stack — stage
          first, panel second, no overlap to cramp anything.
        */}
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:min-h-[75vh] lg:grid-cols-12 lg:gap-8 lg:py-12">
          {/* --------------------------- Image stage ---------------------- */}
          {/*
            THE LIFT LIVES ON THE GRID ITEM, and the tilt is deliberately tiny.

            `rotateZ` grows an element's bounding box, and this one already sits
            flush against the page gutter — half a degree on a 631px stage adds
            about 5px, which the `px-5` padding absorbs. A larger angle would
            push it past the viewport edge and reintroduce the horizontal
            overflow this page has been kept clear of all session.
          */}
          <motion.div
            data-stage
            initial={false}
            whileHover={reduced ? undefined : { scale: 1.03, rotateZ: 0.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="group relative h-[280px] overflow-hidden rounded-3xl border sm:h-[400px] lg:col-start-1 lg:col-end-8 lg:row-start-1 lg:h-[520px]"
            style={{
              borderColor: `${slide.accent}4D`,
              boxShadow: `0 0 40px ${slide.accent}26`,
            }}
          >
            {/*
              Cross-fade with NO `mode="wait"`. `wait` is a SEQUENCE — the
              outgoing image would have to finish leaving before the incoming
              one mounted, so the stage would flash black between slides.
              Overlapping is what the word cross-fade actually describes.
            */}
            <AnimatePresence initial={false}>
              <motion.div
                key={slide.art}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduced ? 1 : 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={DISSOLVE}
              >
                <Image
                  src={slide.art}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 660px, 92vw"
                  priority={active === 0}
                  className="object-cover"
                  /* Decorative: the panel's heading carries the meaning, so
                     `alt` stays empty rather than naming the division twice. */
                />
              </motion.div>
            </AnimatePresence>

            {/* Ambient glow keyed to the slide, plus a floor so the badge stays
                legible whatever the photograph is doing underneath it. */}
            <div
              aria-hidden
              className="absolute inset-0 transition-[background] duration-700"
              style={{
                background: `radial-gradient(ellipse 70% 50% at 20% 12%, ${slide.accent}26 0%, transparent 62%)`,
              }}
            />
            <div aria-hidden className="absolute inset-0 bg-[#050505]/25" />

            {/*
              THE VIGNETTE BRIGHTENS ON HOVER — via opacity, not by swapping the
              gradient.

              `background-image` is not an animatable property, so a hover that
              changes the gradient itself would pop rather than fade. Two
              stacked layers with one crossing 0 -> 1 gives the same effect on a
              property that genuinely interpolates.
            */}
            <div
              aria-hidden
              data-vignette
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse 82% 68% at 50% 44%, ${slide.accent}2E 0%, transparent 58%), linear-gradient(135deg, ${slide.accent}1F 0%, transparent 46%)`,
              }}
            />
            {/* Edge darkening, so the brightened centre reads as light falling
                on the subject rather than the whole frame being washed. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 96% 88% at 50% 50%, transparent 52%, rgba(5,5,5,0.42) 100%)',
              }}
            />

            <span
              aria-hidden
              data-badge
              className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-[13px] font-bold backdrop-blur-sm"
              /*
                0.85, not 0.72. The badge sits ON the stage, where the only
                thing between a 13px accent and the photograph is its own
                backing — the stage keeps a light 25% wash precisely so the
                image still reads. Against a white photo the deepest foil
                (slide 05's purple) measured 3.79:1 at 0.72, under AA.
                Deepening the badge rather than the stage keeps the photography
                bright and lifts the accent to 5.3.
              */
              style={{
                borderColor: `${slide.accent}66`,
                backgroundColor: 'rgba(5,5,5,0.85)',
                color: slide.ink,
              }}
            >
              {slide.badge}
            </span>
          </motion.div>

          {/* --------------------------- Glass panel ---------------------- */}
          <motion.div
            data-panel
            initial={false}
            whileHover={reduced ? undefined : { y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="group/panel relative z-10 overflow-hidden rounded-3xl border bg-[#121115]/90 p-6 backdrop-blur-xl transition-colors duration-500 sm:p-8 lg:col-start-7 lg:col-end-13 lg:row-start-1 lg:min-h-[420px]"
            style={{
              borderColor: `${slide.accent}4D`,
              boxShadow: `0 40px 90px -50px rgba(0,0,0,0.98), 0 0 40px ${slide.accent}26`,
            }}
          >
            {/*
              THE TINT IS A CORNER WASH, AND IT IS KEPT OFF THE COPY.

              A gradient laid across the whole pane raises its luminance, and
              this pane's accent text is the thing with the least contrast to
              spare — at 15% across the full panel the deepest foil measured
              3.90:1, under AA. Running it bottom-right to transparent puts the
              tint in the one corner the copy does not occupy: the kicker,
              heading and sub-services all start top-left.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-tl"
              style={{
                backgroundImage: `linear-gradient(to top left, ${slide.accent}1F 0%, transparent 42%)`,
              }}
            />
            {/* Brightens with the panel's own hover, same opacity trick as the
                stage vignette — background-image does not interpolate. */}
            <div
              aria-hidden
              data-panel-glow
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100"
              style={{
                backgroundImage: `radial-gradient(ellipse 60% 50% at 88% 92%, ${slide.accent}24 0%, transparent 60%)`,
              }}
            />
            {/*
              ONE PANEL MOUNTED AT A TIME — no AnimatePresence here on purpose.

              An exiting copy block would sit in the flow beside the incoming
              one and shove the panel around for the length of its exit, and
              `mode="wait"` would leave the panel briefly empty instead. Keying
              the block means React swaps it outright and only the entry
              animates, which is what "buttery" actually looks like here.

              `lg:min-h` holds the panel steady between a six-service division
              and a three-service one, so the overlap never breathes.
            */}
            <motion.div
              key={category.title}
              custom={dir}
              initial={reduced ? false : { opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={SPRING}
              /* `relative` lifts the copy above the two absolute gradient
                 layers behind it — without it the wash paints over the text. */
              className="relative"
            >
              <span className="flex items-center gap-3">
                <Icon size={16} aria-hidden className="shrink-0" style={{ color: slide.ink }} />
                <span
                  className="pr-[0.24em] font-mono text-[10px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: slide.ink }}
                >
                  Division {slide.badge}
                </span>
              </span>

              <h2 className="mt-3 break-words font-serif text-[1.625rem] font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2rem]">
                {category.title}
              </h2>

              <p className="mt-3 break-words text-[0.875rem] leading-[1.7] text-white/75">
                {category.description}
              </p>

              {/* -------------------- Sub-services -------------------- */}
              <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                {category.services.map((service) => (
                  <li key={service.title} data-service={service.title}>
                    {/*
                      The row's own hover, scoped with `group/row` so it does
                      not also fire from the panel's hover — an unnamed `group`
                      here would light every row at once the moment the pointer
                      touched the card, which reads as a rendering fault rather
                      than a response.
                    */}
                    <span className="group/row flex items-start gap-2.5 border-b border-white/[0.07] py-2.5 transition-colors duration-300 hover:border-white/25">
                      <span
                        aria-hidden
                        className="mt-[7px] h-1 w-1 shrink-0 rounded-full transition-all duration-300 group-hover/row:scale-[1.8]"
                        style={{
                          backgroundColor: slide.accent,
                          boxShadow: `0 0 0 ${slide.accent}00`,
                        }}
                      />
                      {/* `min-w-0` is what prevents the overflow: a flex child
                          defaults to `min-width:auto` and refuses to shrink
                          below its longest word, so a long service name widens
                          the panel instead of wrapping inside it. */}
                      <span className="min-w-0 flex-1 break-words text-[0.8125rem] font-medium leading-[1.45] text-white/85 transition-[color,transform] duration-300 group-hover/row:translate-x-1 group-hover/row:text-white">
                        {service.title}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* Through-links keep every vertical page reachable from this hub
                  — including the two with no slide of their own. */}
              <div className="mt-6 flex flex-wrap gap-2">
                {category.relatedSlugs.map((slug) => (
                  <Link
                    key={slug}
                    href={`/services/${slug}`}
                    data-through-link
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                    style={{
                      borderColor: `${slide.accent}66`,
                      color: slide.ink,
                      ['--tw-ring-color' as string]: slide.accent,
                    }}
                  >
                    {verticals[slug].name}
                    <ArrowRight size={11} aria-hidden />
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ---------------------------- Controls ------------------------- */}
        {/*
          `flex-wrap` is the guard, the tighter base metrics are the fix.

          At 375 this row needed 298 of 335 and fitted. At 320 it needs 328 of
          280 — the container reports 280 because it is the flex BOX, while its
          children sit at -4 and 324, i.e. 24px past each edge. That is the 5px
          of document scroll the page had at 320.

          Base metrics now cost 88 (arrows) + 24 (gaps) + 152 (dots) = 264,
          leaving 16px spare at 320; `sm:` restores the roomier original. The
          wrap is insurance for a sixth division being added later, which would
          otherwise reintroduce this silently.
        */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:mt-10 sm:gap-x-5">
          <CarouselArrow label="Previous division" onClick={() => go(active - 1)} data-prev>
            <ArrowLeft size={17} aria-hidden />
          </CarouselArrow>

          {/*
            Dots are BUTTONS, not decoration — each jumps to its own slide.
            `aria-current` marks the active one, so a screen reader user learns
            position without having to infer it from a visual fill.
          */}
          <div className="flex items-center gap-2 sm:gap-2.5" role="group" aria-label="Choose a division">
            {ordered.map((item, i) => {
              const current = i === active
              return (
                <button
                  key={item.title}
                  type="button"
                  data-dot={i}
                  data-current={current}
                  aria-label={`${item.title}, division ${i + 1} of ${total}`}
                  aria-current={current ? 'true' : undefined}
                  onClick={() => go(i)}
                  /*
                    The visible dot is 7px; the BUTTON is the tap area, 24x44
                    at base and 32x44 from `sm`.

                    Not 44x44, and the reason is arithmetic rather than
                    laziness: 44 would push this row past the viewport on a
                    phone, trading a real bug for a nominal one. 24 is exactly
                    WCAG 2.5.8's minimum and the 44px HEIGHT does the ergonomic
                    work — a thumb misses vertically far more often than it
                    misses horizontally on a row of dots.
                  */
                  className="flex h-11 w-6 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] sm:w-8"
                  style={{ ['--tw-ring-color' as string]: SLIDES[item.title].accent }}
                >
                  <motion.span
                    aria-hidden
                    className="block rounded-full"
                    animate={{
                      width: current ? 26 : 7,
                      backgroundColor: current
                        ? SLIDES[item.title].accent
                        : 'rgba(255,255,255,0.30)',
                    }}
                    transition={SPRING}
                    style={{ height: 7 }}
                  />
                </button>
              )
            })}
          </div>

          <CarouselArrow label="Next division" onClick={() => go(active + 1)} data-next>
            <ArrowRight size={17} aria-hidden />
          </CarouselArrow>
        </div>

          {/* Announced rather than shown: the dots are decorative to anyone who
              cannot see which one is filled. */}
          <span aria-live="polite" className="sr-only">
            {`Division ${active + 1} of ${total}: ${category.title}`}
          </span>
        </section>

        {/*
          The scroll budget, as an in-flow sibling. One segment per division
          after the first, so the last one still gets its own stretch of scroll
          before the pin releases.

          Reduced motion gets none of it: with the transforms off there is
          nothing to progress through, and making someone scroll four extra
          viewports to reach content that is not animating is just an obstacle.
        */}
        {!reduced && (
          <div
            aria-hidden
            data-spacer
            className="hidden lg:block"
            style={{ height: `${(total - 1) * SEGMENT_VH}vh` }}
          />
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Arrow control
 * -------------------------------------------------------------------------- */

function CarouselArrow({
  label,
  onClick,
  children,
  ...rest
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
} & React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/85 outline-none transition-colors hover:border-white/50 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
      {...rest}
    >
      {children}
    </button>
  )
}
