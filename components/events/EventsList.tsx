'use client'

import { useCallback, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  type Transition,
} from 'framer-motion'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'

import type { UpcomingEvent } from '@/data/events'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { getLenis } from '@/lib/lenis-instance'
import { cn } from '@/lib/utils'
import { Atmosphere } from '@/components/ui/Atmosphere'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 30 }

/** How much of the deck the open panel claims, against 1 for each closed one. */
const OPEN_GROW = 6
const CLOSED_GROW = 1

/** Viewport heights of scroll granted to each event after the first. */
const SEGMENT_VH = 70

/* -------------------------------------------------------------------------- *
 * Per-type accent
 *
 * Keyed by the event's own `type`, with a gold default. `type` is free text in
 * data/events.ts — "Wellness & Entertainment" and "Corporate Retreat" are two
 * words apiece — so an unmatched value must degrade to a real colour rather
 * than to `undefined` and a transparent border.
 * -------------------------------------------------------------------------- */

const GOLD = '#C5A880'

const ACCENT: Record<string, string> = {
  Fitness: '#B9A6DC',
  Adventure: '#A8BFA0',
  'Wellness & Entertainment': '#9D8CBF',
  'Corporate Retreat': '#C5A880',
}

const accentFor = (type: string) => ACCENT[type] ?? GOLD

/* -------------------------------------------------------------------------- *
 * Deck
 * -------------------------------------------------------------------------- */

export function EventsList({ events }: { events: UpcomingEvent[] }) {
  const reduced = usePrefersReducedMotion()
  const baseId = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const track = useRef<HTMLDivElement>(null)

  /*
    TWO PIECES OF STATE, NOT ONE — and that is what makes hover-override work.

    `sequenced` is where the scroll has got to. `hovered` is a temporary
    preview. The displayed panel is `hovered ?? sequenced`, so pointing at a
    card shows it immediately and LEAVING it returns to wherever the scroll
    actually is — rather than stranding the reader on whatever they last
    touched, which is what collapsing these into one value would do.
  */
  const [sequenced, setSequenced] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const open = hovered ?? sequenced

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })

  /*
    THE PIN IS DESKTOP-ONLY, and everything depending on it is gated the same
    way.

    Below `md` the deck is a vertical accordion in normal flow. Pinning it
    there would trap a phone in three viewports of scroll to read four events,
    and without the tall wrapper the scroll progress has nothing to measure
    anyway. `matchMedia` is read on demand rather than through a hook, so there
    is no first frame where the JS and the CSS disagree about which mode we are
    in.
  */
  const pinned = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 768px)').matches &&
    !reduced

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!pinned()) return
    const next = Math.min(events.length - 1, Math.max(0, Math.round(v * (events.length - 1))))
    setSequenced((prev) => (prev === next ? prev : next))
  })

  /*
    Selecting a card MOVES THE PAGE while pinned, rather than setting state.

    With the sequence derived from scroll position, an index set directly would
    be overwritten by the next scroll frame and the click would appear to do
    nothing. Unpinned there is no scroll to derive from, so the click owns the
    state outright. Lenis gets the scroll where it exists — it reasserts
    position every frame, so a native smooth scroll is fought and overwritten.
  */
  const select = useCallback(
    (index: number) => {
      if (!pinned()) {
        setSequenced(index)
        return
      }
      const el = track.current
      if (!el) return
      const usable = Math.max(1, el.offsetHeight - window.innerHeight)
      const top =
        el.getBoundingClientRect().top +
        window.scrollY +
        usable * (index / Math.max(1, events.length - 1))
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(top, { duration: 0.9 })
      else window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    },
    [events.length, reduced],
  )

  /* Arrows walk the deck; both axes are accepted because the same deck is a row
     or a column depending on width, and guessing which one the reader is
     looking at would be wrong half the time. */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const map: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: events.length - 1,
    }
    const next = map[event.key]
    if (next === undefined) return
    event.preventDefault()
    const clamped = ((next % events.length) + events.length) % events.length
    select(clamped)
    setSequenced(clamped)
    buttons.current[clamped]?.focus()
  }

  return (
    <section className="relative z-20 w-full">
      {/* Scoped to this section, not the viewport — the hero above carries its
          own lighting and a fixed rig would keep shining through it. */}
      <Atmosphere />

      {/*
        THE TRACK. Its height is the scroll budget and nothing else, and it only
        exists from `md` up.

        `md:h-[300vh]` is real in-flow height rather than padding: a sticky
        child is constrained to its containing block, which for a plain block
        parent is the CONTENT box, and padding sits outside it. Budget the
        scroll with padding and the frame has nowhere to travel, so it never
        pins at all.
      */}
      <div
        ref={track}
        data-track
        className={reduced ? 'relative' : 'relative md:h-[300vh]'}
      >
        {/*
          The pinned frame. `overflow-hidden` here is safe — it is the sticky
          element itself, not an ancestor. An ANCESTOR with hidden overflow
          becomes the scroll container sticky resolves against and the pin dies
          silently.
        */}
        <div
          data-frame
          className="relative flex items-center md:sticky md:top-0 md:h-screen md:overflow-hidden"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-16 md:py-0">
            <ul
              data-deck
              onMouseLeave={() => setHovered(null)}
              /* 640px on mobile, not 560: the open panel used to overlay its copy on
                 the artwork, so the panel only had to be as tall as the taller of
                 the two. Stacking them means it needs the SUM, and at 560 the
                 detail block ran 59px past the panel and `overflow-hidden` ate
                 the CTA.

                 680 rather than the 640 that just fits: the longest entry
                 ("Corporate Wellness Camp", two-line title plus a three-line
                 description) needs ~394px of the 400 a 640px deck gives it. Six
                 pixels is not headroom — this project has already had two
                 builds where the webfont failed to load, and fallback metrics
                 are exactly what turns a three-line description into four.
                 `md:h-[520px]` is untouched. */
              className="flex h-[680px] flex-col gap-3 md:h-[520px] md:flex-row md:gap-4"
            >
              {events.map((event, i) => (
                <EventPanel
                  key={event.title}
                  event={event}
                  index={i}
                  isOpen={i === open}
                  baseId={baseId}
                  reduced={reduced}
                  onSelect={() => select(i)}
                  onHover={() => setHovered(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  registerRef={(el) => {
                    buttons.current[i] = el
                  }}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * One panel
 * -------------------------------------------------------------------------- */

function EventPanel({
  event,
  index,
  isOpen,
  baseId,
  reduced,
  onSelect,
  onHover,
  onKeyDown,
  registerRef,
}: {
  event: UpcomingEvent
  index: number
  isOpen: boolean
  baseId: string
  reduced: boolean
  onSelect: () => void
  onHover: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  registerRef: (el: HTMLButtonElement | null) => void
}) {
  /*
    THE FALLBACK IS STATE, NOT A CSS TRICK.

    A broken <img> paints the browser's own empty-frame chrome, which no
    background behind it can hide. `onError` unmounts the image so the textured
    gradient takes the space. The gradient is underneath at all times, so a slow
    load lands on it rather than on grey.
  */
  const [failed, setFailed] = useState(false)
  const accent = accentFor(event.type)
  const headerId = `${baseId}-h-${index}`
  const panelId = `${baseId}-p-${index}`

  return (
    <motion.li
      data-panel={index}
      data-open={isOpen}
      initial={false}
      animate={{ flexGrow: isOpen ? OPEN_GROW : CLOSED_GROW }}
      transition={reduced ? { duration: 0 } : SPRING}
      /*
        The lift is separate from the expansion on purpose: `flexGrow` is a
        LAYOUT property and `scale` is a transform, so they animate on different
        systems and neither fights the other. Scale also cannot disturb the
        deck's distribution, which is what keeps a hover from nudging its
        neighbours.
      */
      whileHover={reduced ? undefined : { scale: 1.02, zIndex: 30 }}
      className="group relative min-h-0 shrink basis-0 overflow-hidden rounded-2xl border transition-colors duration-500"
      style={{
        borderColor: isOpen ? `${accent}B3` : 'rgba(255,255,255,0.10)',
        backgroundImage: 'linear-gradient(to bottom right, #1a1714 0%, #0a0908 100%)',
        boxShadow: isOpen
          ? `0 30px 70px -40px rgba(0,0,0,0.98), 0 0 40px -12px ${accent}59`
          : '0 20px 50px -40px rgba(0,0,0,0.9)',
      }}
    >
      {/* ------------------------------ Artwork ---------------------------- */}
      {/*
        ON MOBILE THE OPEN PANEL IS A VERTICAL SPLIT, NOT AN OVERLAY.

        The artwork is `fill`, so it covered the whole panel and the detail
        block sat on top of it — which on a phone meant the frosted card
        obscured most of the photograph it was describing. Confining the image
        to a fixed top band while open gives the picture its own unobstructed
        region and leaves the copy on the panel's own dark ground below.

        `max-md:` rather than a `md:` reset, so DESKTOP NEVER SEES THIS RULE at
        all: above 768px the wrapper stays a plain `inset-0` and the overlay
        composition is byte-for-byte what it was.

        A fixed 190px, not a percentage: percentage PADDING resolves against
        width, and a percentage height needs a definite parent height, which a
        flex item mid-`flexGrow`-animation is not reliably going to give.
      */}
      <div
        className={cn(
          'absolute inset-0',
          isOpen && 'max-md:bottom-auto max-md:h-[170px]',
        )}
      >
        {!failed && (
          <Image
            src={event.img}
            alt=""
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            onError={() => setFailed(true)}
            className="object-cover transition-transform duration-700 ease-out"
            style={{ transform: isOpen ? 'scale(1.04)' : 'scale(1)' }}
            /* Decorative: the heading carries the meaning, so `alt` stays empty
               rather than naming the event twice to a screen reader. */
          />
        )}

        {/* Legibility floor. A photograph's local brightness is unknowable, so
            contrast is guaranteed here rather than hoped for. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.72) 38%, rgba(5,5,5,0.34) 70%, rgba(5,5,5,0.22) 100%)',
          }}
        />
      </div>

      {/* Hover glow as its own layer — animating `box-shadow` on the panel
          would compete with the scale for the same compositor work. */}
      <div
        aria-hidden
        data-glow
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}B3, 0 0 40px -10px ${accent}66` }}
      />

      {/*
        THE WHOLE PANEL IS THE CONTROL — one absolutely-positioned button rather
        than a <button> wrapper.

        The expanded panel contains a link, and an anchor inside a button is
        invalid HTML that browsers and screen readers each resolve differently.
        A full-bleed button beneath the content gives the same target while the
        CTA stays a real anchor above it.
      */}
      <button
        ref={registerRef}
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        /* Only while the region exists — a reference to an unmounted id is a
           broken pointer, and `aria-expanded` already says there is nothing to
           jump to. */
        aria-controls={isOpen ? panelId : undefined}
        onClick={onSelect}
        onMouseEnter={onHover}
        onFocus={onHover}
        onKeyDown={onKeyDown}
        data-trigger={index}
        className="absolute inset-0 z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ ['--tw-ring-color' as string]: accent }}
      >
        <span className="sr-only">
          {`${event.title}, ${event.date}, ${event.location}`}
        </span>
      </button>

      {/* ------------------------------ Content ---------------------------- */}
      {/* `pointer-events-none` so the button beneath stays clickable across the
          whole panel; the CTA re-enables them for itself. */}
      <div
        className={cn(
          'pointer-events-none relative z-20 flex h-full flex-col justify-end p-4 sm:p-5',
          /* Clears the 190px image band so the copy starts below the picture
             instead of on it. Desktop is untouched. */
          isOpen && 'max-md:justify-start max-md:pt-[182px]',
        )}
      >
        {/*
          THE PILL BELONGS TO THE OPEN STATE ONLY.

          A collapsed panel is 118px wide on desktop and "Wellness &
          Entertainment" is 24 characters — measured, it overflowed and was
          clipped, so the category was unreadable exactly where it was meant to
          inform. The identity rides on the vertical title until the panel
          opens.
        */}
        {isOpen && (
          <span
            data-pill
            className="mb-2 w-fit max-w-full rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
            style={{
              /* 0.88 rather than 0.78: the pill sits on the photograph, so its
                 own backing is all that stands between a 9px accent and the
                 image. The deepest accent measured 4.23:1 at the lighter
                 value. */
              borderColor: `${accent}66`,
              backgroundColor: 'rgba(5,5,5,0.88)',
              color: accent,
            }}
          >
            {event.type}
          </span>
        )}

        {/*
          COLLAPSED TITLE READS VERTICALLY ON DESKTOP ONLY.

          `writing-mode` is scoped to `md` because the collapsed panel is a
          narrow column there and a horizontal title would clip to a few
          characters. On a phone it is a wide, short row, where vertical text
          would be the thing that breaks.
        */}
        {!isOpen && (
          <h2
            data-collapsed-title
            className="max-h-full overflow-hidden font-serif text-[1rem] font-bold leading-tight tracking-[-0.01em] text-white md:[writing-mode:vertical-rl] md:rotate-180 md:text-[1.0625rem]"
          >
            {event.title}
          </h2>
        )}

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="detail"
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              data-detail
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={SPRING}
              /* The frosted box existed to separate the copy FROM the
                  photograph. Below `md` the copy is no longer on the
                  photograph, so the box is just a second frame inside a frame —
                  it is what made the card read as cramped. Dropped there,
                  unchanged above. */
              className="min-w-0 rounded-xl border border-white/10 bg-[#121115]/90 p-4 backdrop-blur-xl max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:backdrop-blur-none"
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} aria-hidden className="shrink-0" style={{ color: accent }} />
                  {/* `<time>` carries the ISO value, so the date is
                      machine-readable and not only human-readable. */}
                  <time
                    dateTime={event.isoDate}
                    data-date
                    className="pr-[0.18em] font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: accent }}
                  >
                    {event.date}
                  </time>
                </span>

                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin size={13} aria-hidden className="shrink-0 text-white/50" />
                  {/* `min-w-0` is what prevents the overflow: a flex child
                      defaults to `min-width:auto` and refuses to shrink below
                      its longest word. */}
                  <span className="min-w-0 break-words text-[0.75rem] leading-[1.4] text-white/70">
                    {event.location}
                  </span>
                </span>
              </span>

              <h2 className="mt-1.5 break-words font-serif text-[1.375rem] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[1.5rem]">
                {event.title}
              </h2>

              <p className="mt-2 max-w-prose break-words text-[0.8125rem] leading-[1.6] text-white/80">
                {event.desc}
              </p>

              <Link
                href={`/contact?type=event&event=${encodeURIComponent(event.title)}`}
                data-tap
                data-cta
                /* `pointer-events-auto` re-enables clicks for the anchor alone,
                   above the full-bleed button underneath. */
                className="group/cta pointer-events-auto mt-3 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070609]"
                style={{
                  borderColor: `${accent}80`,
                  color: accent,
                  ['--tw-ring-color' as string]: accent,
                  boxShadow: `0 0 24px -10px ${accent}99`,
                }}
              >
                Register Now
                <ArrowRight
                  size={13}
                  aria-hidden
                  className="transition-transform duration-300 group-hover/cta:translate-x-0.5"
                />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  )
}
