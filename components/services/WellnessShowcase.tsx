'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Gauge, Users, type LucideIcon } from 'lucide-react'

import type { VerticalService } from '@/data/verticals'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { getLenis } from '@/lib/lenis-instance'

/* -------------------------------------------------------------------------- *
 * Programme data
 *
 * Keyed by service title to stay aligned with data/verticals.ts — an index
 * would silently pair the wrong photograph with the wrong programme the moment
 * anyone reorders that array.
 *
 * Duration / intensity / capacity are FIXED FIELDS rather than a free-form
 * metric list: three cards showing the same three measures can be compared
 * across experiences, which a per-item list of whatever suited that item cannot.
 * -------------------------------------------------------------------------- */

type Programme = {
  img: string
  accent: string
  /** Subtitle, set under the heading. */
  kind: string
  duration: string
  intensity: string
  capacity: string
  phases: { numeral: string; label: string; detail: string }[]
}

const PROGRAMMES: Record<string, Programme> = {
  'Aqua Zumba': {
    img: '/wellness-aqua-zumba.jpg',
    accent: '#7DD3FC',
    kind: 'Pool programme',
    duration: '55 min',
    intensity: 'Moderate',
    capacity: '120 pax',
    phases: [
      { numeral: 'I', label: 'Warm-up', detail: 'Shallow-end mobility · 10 minutes' },
      { numeral: 'II', label: 'Main set', detail: 'Choreographed intervals · 35 minutes' },
      { numeral: 'III', label: 'Cool-down', detail: 'Float and stretch · 10 minutes' },
    ],
  },
  'Dance Fitness Parties': {
    img: '/wellness-dance.jpg',
    accent: '#F9A8D4',
    kind: 'Night format',
    duration: '90 min',
    intensity: 'High',
    capacity: '400 pax',
    phases: [
      { numeral: 'I', label: 'Doors', detail: 'Live DJ · warm-up floor' },
      { numeral: 'II', label: 'Peak', detail: 'Three coached blocks · 60 minutes' },
      { numeral: 'III', label: 'Wind-down', detail: 'Slow set · hydration bar' },
    ],
  },
  'Fitness Carnival': {
    img: '/wellness-carnival.jpg',
    accent: '#FDBA74',
    kind: 'Festival scale',
    duration: '6 hrs',
    intensity: 'Mixed',
    capacity: '2500 pax',
    phases: [
      { numeral: 'I', label: 'Morning', detail: 'Open zones · vendor village' },
      { numeral: 'II', label: 'Midday', detail: 'Headline classes · main stage' },
      { numeral: 'III', label: 'Evening', detail: 'Community finale · awards' },
    ],
  },
  'HIIT Bootcamps': {
    img: '/wellness-hiit.jpg',
    accent: '#FDE047',
    kind: 'Interval training',
    duration: '45 min',
    intensity: 'Severe',
    capacity: '60 pax',
    phases: [
      { numeral: 'I', label: 'Prep', detail: 'Dynamic mobility · 8 minutes' },
      { numeral: 'II', label: 'Work', detail: 'Six rounds · 40:20 intervals' },
      { numeral: 'III', label: 'Flush', detail: 'Zone-2 walk · breathwork' },
    ],
  },
  'Yoga Sessions': {
    img: '/wellness-yoga.jpg',
    accent: '#BEF264',
    kind: 'Restorative',
    duration: '75 min',
    intensity: 'Gentle',
    capacity: '150 pax',
    phases: [
      { numeral: 'I', label: 'Settle', detail: 'Pranayama · grounding' },
      { numeral: 'II', label: 'Flow', detail: 'Guided vinyasa · 45 minutes' },
      { numeral: 'III', label: 'Rest', detail: 'Savasana · sound bath' },
    ],
  },
  Walkathons: {
    img: '/wellness-walkathon.jpg',
    accent: '#5EEAD4',
    kind: 'Community route',
    duration: '2 hrs',
    intensity: 'Easy',
    capacity: '3000 pax',
    phases: [
      { numeral: 'I', label: 'Assembly', detail: 'Flag-off · pace groups' },
      { numeral: 'II', label: 'Route', detail: '5 km loop · three aid stations' },
      { numeral: 'III', label: 'Finish', detail: 'Medals · charity handover' },
    ],
  },
  'Color Runs': {
    img: '/wellness-color-run.jpg',
    accent: '#D8B4FE',
    kind: 'Recreational race',
    duration: '2.5 hrs',
    intensity: 'Easy',
    capacity: '2000 pax',
    phases: [
      { numeral: 'I', label: 'Wave start', detail: 'Staggered flag-off · 5 minute gaps' },
      { numeral: 'II', label: 'Colour bays', detail: 'Powder stations every kilometre' },
      { numeral: 'III', label: 'Finish', detail: 'Colour throw · stage set' },
    ],
  },
  'Wellness Retreats': {
    img: '/wellness-retreats.jpg',
    accent: '#FCD34D',
    kind: 'Weekend immersion',
    duration: '2 days',
    intensity: 'Restorative',
    capacity: '40 pax',
    phases: [
      { numeral: 'I', label: 'Day one', detail: 'Arrival · sunset meditation' },
      { numeral: 'II', label: 'Day two', detail: 'Movement · nutrition workshop' },
      { numeral: 'III', label: 'Close', detail: 'Intention circle · departure' },
    ],
  },
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
/** The brief's cinematic easing. */
const CINEMATIC = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }

/** Where the sticky stage parks, clearing the fixed navbar. */
const STICKY_TOP = 96
/** Viewport-heights of scroll each card owns. */
const SEGMENT_VH = 55
/** Scroll-driving only applies from this width up — see the mobile note below. */
const DESKTOP_QUERY = '(min-width: 1024px)'

/* -------------------------------------------------------------------------- *
 * Cinematic editorial showcase
 * -------------------------------------------------------------------------- */

export function WellnessShowcase({ services }: { services: readonly VerticalService[] }) {
  const items = services.filter((s) => PROGRAMMES[s.title])
  const reduced = usePrefersReducedMotion()

  const [active, setActive] = useState(0)
  const [scrollDriven, setScrollDriven] = useState(false)
  const outerRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const listRefs = useRef<(HTMLButtonElement | null)[]>([])
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const item = items[active]
  const prog = item ? PROGRAMMES[item.title] : null

  /*
    SCROLL DRIVES THE INDEX ON DESKTOP ONLY.

    A 55vh-per-card sequence is 440vh of scrolling for eight cards. On a phone
    that is a very long tunnel with a stage squeezed into whatever is left under
    the browser chrome, so below `lg` the tall wrapper collapses (the height
    class is `lg:`-prefixed) and the tab bar drives selection directly. Same
    component, two genuinely different interaction models.
  */
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const sync = () => setScrollDriven(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!scrollDriven) return
    let frame = 0

    const measure = () => {
      frame = 0
      const outer = outerRef.current
      const sticky = stickyRef.current
      if (!outer || !sticky) return

      const rect = outer.getBoundingClientRect()
      /* Distance the wrapper travels while the stage stays parked. */
      const travel = rect.height - sticky.offsetHeight
      if (travel <= 0) return

      /* `rect.top` equals STICKY_TOP at the instant parking begins, so this
         starts at 0 and reaches 1 as the wrapper's tail clears. */
      const passed = STICKY_TOP - rect.top
      const p = Math.min(1, Math.max(0, passed / travel))
      /* `p * count` hits exactly `count` at the very end; clamping rather than
         flooring blind keeps the last card from flicking to an index that does
         not exist. */
      const next = Math.min(items.length - 1, Math.floor(p * items.length))
      setActive((prev) => (prev === next ? prev : next))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [scrollDriven, items.length])

  /*
    ONE SOURCE OF TRUTH.

    While scroll drives the index, a click must NOT call setActive — the very
    next scroll frame would overwrite it and the selection would snap back.
    Clicking scrolls the page to that card's segment instead, and the listener
    reports the change as the page moves. Below `lg` there is no scroll
    sequence, so the click sets state directly.
  */
  const select = (i: number) => {
    if (scrollDriven && outerRef.current && stickyRef.current) {
      const rect = outerRef.current.getBoundingClientRect()
      const travel = rect.height - stickyRef.current.offsetHeight
      const top = rect.top + window.scrollY
      /* Aim at the middle of the segment so a rounding error either side does
         not land on a neighbour. */
      const target = top + (travel * (i + 0.5)) / items.length

      /*
        THROUGH LENIS, NOT AROUND IT.

        Lenis re-asserts the scroll position every frame from its own rAF loop.
        A native smooth scroll runs a second animation over the same property,
        so the two overwrite each other and the jump either stutters or never
        arrives. Handing it the target keeps one animator in charge. Native is
        the fallback for when Lenis is not running at all — which is exactly the
        reduced-motion case, where the provider never boots it.
      */
      const lenis = getLenis()
      if (lenis && !reduced) lenis.scrollTo(target, { duration: 0.9 })
      else window.scrollTo({ top: target, behavior: 'auto' })
      return
    }
    setActive(i)
    tabRefs.current[i]?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, which: 'list' | 'tabs') => {
    const last = items.length - 1
    let next: number | null = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = active === last ? 0 : active + 1
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = active === 0 ? last : active - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    select(next)
    ;(which === 'list' ? listRefs : tabRefs).current[next]?.focus()
  }

  if (!item || !prog) return null

  const progress = items.length > 1 ? active / (items.length - 1) : 0

  return (
    /* Tall only from `lg`: the sticky sequence needs runway, mobile does not. */
    <div ref={outerRef} className="relative lg:h-[440vh]">
      <div
        ref={stickyRef}
        className="lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-7rem)] lg:max-h-[46rem] lg:items-stretch"
      >
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* ---------------------- Editorial list (lg+) ---------------------- */}
          <div
            role="tablist"
            aria-label="Wellness experiences"
            aria-orientation="vertical"
            onKeyDown={(e) => onKeyDown(e, 'list')}
            className="relative hidden lg:flex lg:flex-col lg:justify-center"
          >
            {/* Sequence progress. Tells the reader how far through the eight
                they are, which a sticky section otherwise hides. */}
            <div className="absolute left-0 top-0 h-full w-px bg-smaya-charcoal/10">
              <motion.div
                className="w-px origin-top"
                style={{ backgroundColor: prog.accent, height: '100%' }}
                animate={{ scaleY: progress || 0.02 }}
                transition={CINEMATIC}
              />
            </div>

            {items.map((service, i) => {
              const p = PROGRAMMES[service.title]
              const isActive = i === active
              return (
                <button
                  key={service.title}
                  ref={(el) => {
                    listRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`wellness-row-${i}`}
                  aria-selected={isActive}
                  aria-controls="wellness-stage"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(i)}
                  data-row={i}
                  data-active={isActive}
                  className="group/row relative flex w-full items-baseline gap-4 py-3 pl-5 text-left"
                >
                  <span
                    className="w-7 shrink-0 font-mono text-[11px] font-semibold tracking-[0.18em] transition-colors duration-300"
                    style={{ color: isActive ? p.accent : undefined }}
                  >
                    <span className={isActive ? '' : 'text-smaya-charcoal/35'}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={[
                        'block font-serif leading-snug tracking-[-0.01em] transition-all duration-300',
                        isActive
                          ? 'text-[1.125rem] font-black text-smaya-charcoal'
                          : 'text-[1.0625rem] font-semibold text-smaya-charcoal/45 group-hover/row:text-smaya-charcoal/75',
                      ].join(' ')}
                    >
                      {service.title}
                    </span>
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={reduced ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.28 }}
                          className="block overflow-hidden"
                        >
                          <span className="mt-1 block pr-[0.28em] font-mono text-[10px] uppercase tracking-[0.28em] text-smaya-charcoal/50">
                            {p.kind}
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>
              )
            })}
          </div>

          {/* ---------------------- Horizontal tabs (<lg) ---------------------- */}
          <div
            role="tablist"
            aria-label="Wellness experiences"
            aria-orientation="horizontal"
            onKeyDown={(e) => onKeyDown(e, 'tabs')}
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 sm:-mx-6 sm:px-6 lg:hidden"
          >
            {items.map((service, i) => {
              const p = PROGRAMMES[service.title]
              const isActive = i === active
              return (
                <button
                  key={service.title}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`wellness-tab-${i}`}
                  aria-selected={isActive}
                  aria-controls="wellness-stage"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(i)}
                  data-tab={i}
                  data-active={isActive}
                  data-tap
                  className="relative flex shrink-0 snap-center items-baseline gap-2 rounded-full border px-4 py-2.5 transition-colors duration-300"
                  style={{
                    borderColor: isActive ? p.accent : 'rgba(28,27,31,0.14)',
                    backgroundColor: isActive ? 'rgba(28,27,31,0.05)' : 'transparent',
                  }}
                >
                  <span
                    className="font-mono text-[10px] font-semibold tracking-[0.16em]"
                    style={{ color: isActive ? p.accent : 'rgba(28,27,31,0.4)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={[
                      'whitespace-nowrap text-[0.8125rem] transition-colors duration-300',
                      isActive ? 'font-bold text-smaya-charcoal' : 'font-medium text-smaya-charcoal/60',
                    ].join(' ')}
                  >
                    {service.title}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ------------------------- Cinematic stage ------------------------- */}
          <div
            role="tabpanel"
            id="wellness-stage"
            aria-labelledby={`wellness-row-${active}`}
            tabIndex={0}
            className="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] bg-[#07080B] shadow-2xl ring-1 ring-white/10"
          >
            {/* `min-h-0` + `flex-1` is what lets the picture absorb the leftover
                height inside a fixed sticky box instead of overflowing it. */}
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-auto lg:min-h-0 lg:flex-1">
              {/*
                A TRUE CROSS-FADE, WHICH MEANS NO `mode="wait"`.

                `wait` is a SEQUENCE — the outgoing layer must finish leaving
                before the incoming one mounts, so the stage passes through
                empty and every switch costs both durations. Overlapping layers
                is what the word cross-fade actually describes.
              */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={item.title}
                  className="absolute inset-0"
                  initial={reduced ? false : { opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={CINEMATIC}
                >
                  <Image
                    src={prog.img}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 62vw, 92vw"
                    className="object-cover"
                    priority={active === 0}
                  />
                </motion.div>
              </AnimatePresence>

              {/*
                CONTRAST FLOOR — two stacked scrims, and both are load-bearing.

                A single gradient tuned dark enough for the brightest photograph
                (the pool and colour-run frames are near-white at the bottom
                edge) crushes the darker ones into mud. So: a broad gradient for
                depth, plus a near-solid band across the bottom 40% where the
                heading and metrics actually sit. The copy's contrast is then
                set by the band, not by whatever happens to be in the photo.
              */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[62%]"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 26%, rgba(0,0,0,0.6) 58%, transparent 100%)',
                }}
              />

              {/*
                COPY SWAPS, IT DOES NOT CROSS-FADE — a deliberate departure.

                Cross-fading the photography is right: two images at partial
                opacity read as one dissolving into the other. Two blocks of
                TEXT overlapping at partial opacity read as neither — the old
                and new headings sit on top of each other and both become
                unreadable for the transition's whole duration.
              */}
              <motion.div
                key={item.title}
                className="absolute inset-0 flex flex-col justify-end gap-4 p-5 sm:p-7 lg:p-8"
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={CINEMATIC}
              >
                <div className="max-w-xl">
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: prog.accent,
                        boxShadow: `0 0 10px 2px ${prog.accent}80`,
                      }}
                    />
                    {/* Wide tracking pushes the trailing space outside the glyph
                        box; `pr` of the same measure restores it. */}
                    <span
                      className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em]"
                      style={{ color: prog.accent }}
                    >
                      {prog.kind}
                    </span>
                  </span>
                  <h3 className="mt-2.5 font-serif text-[1.85rem] font-bold leading-[1.02] tracking-[-0.025em] text-white sm:text-[2.4rem] lg:text-[2.75rem]">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 max-w-lg text-[0.875rem] font-normal leading-[1.65] text-white/80">
                    {item.longDesc ?? item.desc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:max-w-md sm:gap-2.5">
                  <Stat icon={Gauge} label="Duration" value={prog.duration} accent={prog.accent} reduced={reduced} />
                  <Stat icon={Flame} label="Intensity" value={prog.intensity} accent={prog.accent} reduced={reduced} />
                  <Stat icon={Users} label="Capacity" value={prog.capacity} accent={prog.accent} reduced={reduced} />
                </div>
              </motion.div>
            </div>

            {/* --------------------- Programme breakdown --------------------- */}
            <div className="shrink-0 border-t border-white/10 bg-[#07080B] p-5 sm:p-6 lg:p-7">
              <span className="pr-[0.26em] font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-white/50">
                Programme breakdown
              </span>
              {/* Remount-by-key rather than AnimatePresence: every experience
                  has exactly three phases, so the block's height is identical
                  across items and there is nothing to cross-fade against. */}
              <motion.ol
                key={item.title}
                className="mt-3 grid gap-2.5 sm:grid-cols-3"
                initial={reduced ? false : 'hidden'}
                animate="shown"
                variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
              >
                {prog.phases.map((phase) => (
                  <motion.li
                    key={phase.numeral}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      shown: { opacity: 1, y: 0, transition: CINEMATIC },
                    }}
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    className="cursor-default rounded-xl border border-white/10 bg-white/[0.05] p-3.5 transition-colors duration-300 hover:bg-white/[0.09]"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-white/40">
                        Phase
                      </span>
                      <span
                        className="font-mono text-[11px] font-bold tracking-[0.1em]"
                        style={{ color: phase.numeral ? prog.accent : undefined }}
                      >
                        {phase.numeral}
                      </span>
                    </span>
                    <span className="mt-1.5 block font-serif text-[1rem] font-bold leading-tight tracking-[-0.01em] text-white">
                      {phase.label}
                    </span>
                    <span className="mt-1 block font-mono text-[10.5px] leading-relaxed text-white/60">
                      {phase.detail}
                    </span>
                  </motion.li>
                ))}
              </motion.ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
  reduced,
}: {
  icon: LucideIcon
  label: string
  value: string
  accent: string
  reduced: boolean
}) {
  return (
    <motion.div
      initial={false}
      whileHover={reduced ? undefined : { scale: 1.02 }}
      transition={SPRING}
      /* `bg-black/80`, not the earlier /70 — these sit over the brightest part
         of several frames and the extra stop is what keeps the numerals solid. */
      className="cursor-default rounded-xl border border-white/15 bg-black/80 px-3 py-2.5 backdrop-blur-md"
    >
      <span className="flex items-center gap-1.5">
        <Icon size={11} aria-hidden style={{ color: accent }} />
        <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-[9px]">
          {label}
        </span>
      </span>
      <span className="mt-1 block font-serif text-[0.9375rem] font-bold tracking-[-0.01em] text-white sm:text-[1.0625rem]">
        {value}
      </span>
    </motion.div>
  )
}
