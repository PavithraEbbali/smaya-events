'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowUpRight, Bike, Compass, Route, Sun, Tent, type LucideIcon } from 'lucide-react'

import type { VerticalService } from '@/data/verticals'
import { usePointerFine, usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- *
 * Diorama data
 *
 * Keyed by service title to stay aligned with data/verticals.ts — an index
 * would silently pair the wrong telemetry with the wrong landscape the moment
 * anyone reorders that array.
 * -------------------------------------------------------------------------- */

type Diorama = {
  icon: LucideIcon
  img: string
  /** The one colour this frame is lit with. */
  accent: string
  region: string
  coords: string
  /** 1-5, rendered as the difficulty badge's filled ticks. */
  level: number
  grade: string
  telemetry: { label: string; value: string; unit: string }[]
  tiers: { tier: string; label: string; detail: string }[]
}

const DIORAMAS: Record<string, Diorama> = {
  Treks: {
    icon: Route,
    img: '/expedition-treks.jpg',
    accent: '#FDBA74',
    region: 'Nandi Ridge',
    coords: "13°30'N 77°41'E",
    level: 3,
    grade: 'Moderate',
    telemetry: [
      { label: 'Summit', value: '1450', unit: 'm' },
      { label: 'Gain', value: '730', unit: 'm' },
      { label: 'Distance', value: '9.4', unit: 'km' },
      { label: 'Moving', value: '4:20', unit: 'hrs' },
    ],
    tiers: [
      { tier: 'I', label: 'Sunrise ascent', detail: '04:00 start · summit by first light' },
      { tier: 'II', label: 'Night trek', detail: 'Headlamp ridge line · guided pace' },
      { tier: 'III', label: 'Monsoon ridge', detail: 'Cloud inversion · technical footing' },
    ],
  },
  Camping: {
    icon: Tent,
    img: '/expedition-camping.jpg',
    accent: '#FBBF24',
    region: 'Savandurga',
    coords: "12°55'N 77°17'E",
    level: 2,
    grade: 'Easy',
    telemetry: [
      { label: 'Altitude', value: '1226', unit: 'm' },
      { label: 'Gain', value: '310', unit: 'm' },
      { label: 'Approach', value: '4.2', unit: 'km' },
      { label: 'Nights', value: '1–2', unit: '' },
    ],
    tiers: [
      { tier: 'I', label: 'Pitch & basecamp', detail: 'Tent line set before dusk' },
      { tier: 'II', label: 'Bonfire circle', detail: 'Group activities · night sky briefing' },
      { tier: 'III', label: 'Dawn summit', detail: 'Optional push · back for breakfast' },
    ],
  },
  'Cycling Trips': {
    icon: Bike,
    img: '/expedition-cycling.jpg',
    accent: '#5EEAD4',
    region: 'Nandi Loop',
    coords: "13°22'N 77°41'E",
    level: 4,
    grade: 'Strenuous',
    telemetry: [
      { label: 'Loop', value: '62', unit: 'km' },
      { label: 'Climb', value: '1478', unit: 'm' },
      { label: 'Max grad', value: '11', unit: '%' },
      { label: 'Saddle', value: '3:45', unit: 'hrs' },
    ],
    tiers: [
      { tier: 'I', label: 'Rollout & paceline', detail: 'Flat 14 km · drills' },
      { tier: 'II', label: 'Ridge climb', detail: '8.2 km sustained · 6% average' },
      { tier: 'III', label: 'Descent & sweep', detail: 'Technical switchbacks · support vehicle' },
    ],
  },
  Backpacking: {
    icon: Compass,
    img: '/expedition-backpacking.jpg',
    accent: '#BEF264',
    region: 'Coorg Traverse',
    coords: "12°25'N 75°44'E",
    level: 5,
    grade: 'Severe',
    telemetry: [
      { label: 'High point', value: '1525', unit: 'm' },
      { label: 'Distance', value: '38', unit: 'km' },
      { label: 'Duration', value: '3', unit: 'days' },
      { label: 'Pack', value: '14', unit: 'kg' },
    ],
    tiers: [
      { tier: 'I', label: 'Approach', detail: 'Trailhead to river camp · 12 km' },
      { tier: 'II', label: 'High traverse', detail: 'Ridge crossing · exposed · 15 km' },
      { tier: 'III', label: 'Egress', detail: 'Descent through shola · 11 km' },
    ],
  },
  'Nature Retreats': {
    icon: Sun,
    img: '/expedition-retreats.jpg',
    accent: '#FCD34D',
    region: 'Chikmagalur',
    coords: "13°19'N 75°46'E",
    level: 1,
    grade: 'Restorative',
    telemetry: [
      { label: 'Altitude', value: '1120', unit: 'm' },
      { label: 'Trail', value: '2.6', unit: 'km' },
      { label: 'Duration', value: '2', unit: 'days' },
      { label: 'Screens', value: '0', unit: 'hrs' },
    ],
    tiers: [
      { tier: 'I', label: 'Arrival & unplug', detail: 'Devices stowed · orientation walk' },
      { tier: 'II', label: 'Forest immersion', detail: 'Guided silence · canopy trail' },
      { tier: 'III', label: 'Return', detail: 'Slow morning · journalling circle' },
    ],
  },
}

/**
 * Where the trigger sits, as a fraction of viewport height.
 *
 * Measured against the frame's CENTRE, not its top — the brief is "locks into
 * view", and for a 16:9 frame most of a viewport tall, its top crosses the line
 * long before the landscape is actually composed on screen.
 */
const TRIGGER_RATIO = 0.66
/** How long a frame holds the reader before its HUD arrives. */
const AUTO_REVEAL_MS = 1000

/* Tilt limits. Small on purpose — past about 8deg the frame stops reading as a
   window with depth behind it and starts reading as a card being waved about. */
const MAX_ROTATE = 6
/** Parallax travel in px. The DIFFERENCE between these is the depth cue. */
const DEPTH_FAR = 10
const DEPTH_NEAR = 26

/* -------------------------------------------------------------------------- *
 * The section
 * -------------------------------------------------------------------------- */

export function ExpeditionDiorama({ services }: { services: readonly VerticalService[] }) {
  const frames = services.filter((s) => DIORAMAS[s.title])
  const wrappers = useRef<(HTMLLIElement | null)[]>([])
  const reduced = usePrefersReducedMotion()
  const fine = usePointerFine()

  /*
    PER-FRAME STATE, NOT A SINGLE ACTIVE INDEX.

    Each frame answers "have I locked into view?" against its own geometry, so
    nothing about frame 3 crossing the line can touch frame 1. Both collections
    are keyed by index and replaced immutably.
  */
  const [reached, setReached] = useState<ReadonlySet<number>>(() => new Set())
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(() => new Set())
  const timers = useRef(new Map<number, number>())
  const armed = useRef(new Set<number>())

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const line = window.innerHeight * TRIGGER_RATIO
      const next = new Set<number>()
      wrappers.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.top + r.height / 2 <= line) next.add(i)
      })
      setReached((prev) => {
        /* Bail on an equal set. A fresh Set every scroll frame would re-run the
           arming effect continuously and restart every countdown. */
        if (prev.size === next.size && [...next].every((i) => prev.has(i))) return prev
        return next
      })
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    /* Photographs and webfonts land after this effect and reflow everything
       below them. With no scroll to correct it, a frame already past the line
       at load would be missed. */
    const ro = new ResizeObserver(onScroll)
    wrappers.current.forEach((el) => el && ro.observe(el))

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ro.disconnect()
    }
  }, [])

  /*
    ARMING — one countdown per frame index.

    Arms on REACHED rather than on a single "currently active" frame. A fast
    flick carries several frames past the line between two animation frames, and
    anything keyed to one active slot loses every frame it skipped. `armed`
    keeps it idempotent, so scrolling never restarts a countdown already running
    or already finished.
  */
  useEffect(() => {
    const pending = timers.current
    const claimed = armed.current

    reached.forEach((i) => {
      if (claimed.has(i)) return
      claimed.add(i)
      pending.set(
        i,
        window.setTimeout(() => {
          pending.delete(i)
          setRevealed((prev) => {
            if (prev.has(i)) return prev
            const next = new Set(prev)
            next.add(i)
            return next
          })
        }, AUTO_REVEAL_MS),
      )
    })

    /* Scrolled back above a frame: cancel its countdown, disarm it and slide
       the HUD away, so the next descent replays the whole sequence. */
    let rewound = false
    for (const i of [...claimed]) {
      if (reached.has(i)) continue
      const t = pending.get(i)
      if (t) {
        window.clearTimeout(t)
        pending.delete(i)
      }
      claimed.delete(i)
      rewound = true
    }
    if (rewound) {
      setRevealed((prev) => {
        const next = new Set([...prev].filter((i) => reached.has(i)))
        return next.size === prev.size ? prev : next
      })
    }
  }, [reached])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current.clear()
    },
    [],
  )

  return (
    <ol className="flex flex-col gap-10 sm:gap-16">
      {frames.map((service, i) => (
        <DioramaFrame
          key={service.title}
          service={service}
          index={i}
          total={frames.length}
          reached={reached.has(i)}
          revealed={revealed.has(i)}
          reduced={reduced}
          tiltable={fine && !reduced}
          register={(el) => {
            wrappers.current[i] = el
          }}
        />
      ))}
    </ol>
  )
}

/* -------------------------------------------------------------------------- *
 * One diorama window
 * -------------------------------------------------------------------------- */

function DioramaFrame({
  service,
  index,
  total,
  reached,
  revealed,
  reduced,
  tiltable,
  register,
}: {
  service: VerticalService
  index: number
  total: number
  reached: boolean
  revealed: boolean
  reduced: boolean
  tiltable: boolean
  register: (el: HTMLLIElement | null) => void
}) {
  const dio = DIORAMAS[service.title]
  const Icon = dio.icon
  const [override, setOverride] = useState<boolean | null>(null)
  const open = override ?? revealed

  /* Leaving the frame upward clears a manual override too, so the next pass
     replays cleanly instead of honouring a stale click. Keyed on `reached`,
     which is the thing that actually reverses. */
  useEffect(() => {
    if (!reached) setOverride(null)
  }, [reached])

  /*
    CURSOR TRACKING.

    Two raw motion values in the range -0.5..0.5, sprung once here and reused by
    every derived transform. Springing the SOURCE rather than each output means
    the tilt and both parallax layers stay in lockstep — spring them separately
    and the layers visibly drift apart mid-motion.
  */
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 150, damping: 20, mass: 0.4 }
  const sx = useSpring(px, spring)
  const sy = useSpring(py, spring)

  const rotateY = useTransform(sx, [-0.5, 0.5], [-MAX_ROTATE, MAX_ROTATE])
  const rotateX = useTransform(sy, [-0.5, 0.5], [MAX_ROTATE * 0.7, -MAX_ROTATE * 0.7])

  /*
    PARALLAX BY DIFFERENTIAL 2D TRANSLATION, NOT translateZ.

    `transform-style: preserve-3d` is flattened by `overflow: hidden` on the
    same element in Chrome, and this frame must clip its landscape to a rounded
    rectangle. Layering with translateZ would therefore collapse to nothing.
    Moving each layer a different distance produces the same depth cue and
    survives the clip.

    Both layers move AGAINST the cursor — a nearer object shifts more as the
    viewpoint moves, so the near layer's larger travel is what reads as depth.
  */
  const farX = useTransform(sx, (v) => -v * DEPTH_FAR)
  const farY = useTransform(sy, (v) => -v * DEPTH_FAR)
  const nearX = useTransform(sx, (v) => -v * DEPTH_NEAR)
  const nearY = useTransform(sy, (v) => -v * DEPTH_NEAR)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltable) return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }

  const onLeave = () => {
    px.set(0)
    py.set(0)
  }

  return (
    <li ref={register} data-frame={index} data-reached={reached} data-revealed={revealed} data-open={open}>
      {/* The perspective host. Separate from the tilting element because
          `perspective` on the transformed node itself has no effect — it must
          be declared on the ANCESTOR that is looking at it. */}
      <div style={{ perspective: 1000 }}>
        <motion.div
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={tiltable ? { rotateX, rotateY } : undefined}
          animate={{ opacity: reached ? 1 : 0.86, scale: reduced ? 1 : reached ? 1 : 0.987 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "group/frame relative aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07080B] shadow-2xl transition-[min-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:aspect-[2/1]",
            open && "min-h-[28rem] sm:min-h-0",
          )}
        >
          {/* ---------------------------- Far layer --------------------------- */}
          <motion.div
            className="absolute -inset-8"
            style={tiltable ? { x: farX, y: farY } : undefined}
          >
            {/* Overscaled so the parallax travel can never expose an edge. */}
            <Image
              src={dio.img}
              alt={service.title}
              fill
              sizes="(min-width: 1024px) 78vw, 94vw"
              className="scale-[1.06] object-cover"
            />
          </motion.div>

          {/* Cinematic grade: vignette, then a floor for the copy. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 25%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 32%, transparent 62%)',
            }}
          />

          {/* Rim light along the top edge, and a sheen that crosses once the
              frame is composed. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${dio.accent}80, transparent)`,
            }}
          />
          {reached && !reduced && (
            <span
              aria-hidden
              className="absolute inset-y-0 -left-1/3 w-1/3"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)',
                animation: 'smaya-dio-sheen 9s ease-in-out infinite',
              }}
            />
          )}

          {/* --------------------------- Near layer --------------------------- */}
          <motion.div
            className="absolute inset-0 flex flex-col justify-between p-5 sm:p-9 lg:p-11"
            style={tiltable ? { x: nearX, y: nearY } : undefined}
          >
            {/* Top rail. */}
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md"
                  style={{ borderColor: `${dio.accent}4d`, backgroundColor: 'rgba(0,0,0,0.42)' }}
                >
                  <Icon size={15} aria-hidden style={{ color: dio.accent }} />
                </span>
                <span>
                  <span
                    className="block font-mono text-[10px] font-medium uppercase tracking-[0.4em]"
                    style={{ color: dio.accent }}
                  >
                    {dio.region}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] tracking-[0.16em] text-white/35">
                    {dio.coords}
                  </span>
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/30">
                  {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </span>
              </span>
            </div>

            {/* Title block, pushed left of the HUD so the two never collide. */}
            <div className="max-w-lg">
              <motion.h3
                initial={false}
                whileHover={reduced ? undefined : { scale: 1.01, x: 3 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className="origin-left font-serif text-[2rem] font-black leading-[1.02] tracking-[-0.025em] text-white sm:text-[2.75rem]"
              >
                {service.title}
              </motion.h3>
              <p className="mt-3 max-w-md text-[0.875rem] font-light leading-[1.7] text-white/55">
                {service.longDesc ?? service.desc}
              </p>

              <motion.button
                type="button"
                onClick={() => setOverride(!open)}
                aria-expanded={open}
                data-tap
                initial={false}
                whileHover={
                  reduced
                    ? undefined
                    : {
                        scale: 1.04,
                        boxShadow: `0 0 24px -4px ${dio.accent}, 0 0 0 1px ${dio.accent}99`,
                      }
                }
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] backdrop-blur-md sm:mt-6"
                style={{
                  borderColor: `${dio.accent}4d`,
                  color: dio.accent,
                  backgroundColor: open ? `${dio.accent}1f` : 'rgba(0,0,0,0.42)',
                }}
              >
                {open ? 'Dismiss' : 'Telemetry'}
                <motion.span
                  animate={{ rotate: open ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex"
                >
                  <ArrowUpRight size={13} aria-hidden />
                </motion.span>
              </motion.button>
            </div>
          </motion.div>

          {/* ------------------------------- HUD ------------------------------ */}
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="hud"
                initial={{ x: '104%', opacity: 0 }}
                animate={{ x: '0%', opacity: 1 }}
                exit={{ x: '104%', opacity: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 190, damping: 30, mass: 0.9 }
                }
                className="absolute inset-y-0 right-0 z-20 w-full max-w-md border-l border-white/15 bg-black/80 backdrop-blur-md"
              >
                <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 sm:gap-5 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: dio.accent,
                          color: dio.accent,
                          animation: reduced ? undefined : 'smaya-dio-live 2.2s ease-out infinite',
                        }}
                      />
                      {/* The wide tracking pushes the trailing space outside the
                          glyph box; `pr` of the same measure puts it back. */}
                      <span
                        className="pr-[0.36em] font-mono text-[10px] font-medium uppercase tracking-[0.36em]"
                        style={{ color: dio.accent }}
                      >
                        Telemetry
                      </span>
                    </span>
                    <DifficultyBadge level={dio.level} grade={dio.grade} accent={dio.accent} />
                  </div>

                  {/* Metric grid. */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {dio.telemetry.map((m, i) => (
                      <motion.div
                        key={m.label}
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduced ? 0 : 0.1 + i * 0.06, duration: 0.4 }}
                        whileHover={reduced ? undefined : { scale: 1.01 }}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 sm:rounded-xl sm:px-3.5 sm:py-3"
                      >
                        <span className="block font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
                          {m.label}
                        </span>
                        <span className="mt-1 flex items-baseline gap-1 sm:mt-1.5">
                          <span className="font-serif text-[1.125rem] font-black leading-none tracking-[-0.02em] text-white sm:text-[1.5rem]">
                            {m.value}
                          </span>
                          {m.unit && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                              {m.unit}
                            </span>
                          )}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Multi-tier itinerary. */}
                  <div className="border-t border-white/10 pt-3 sm:pt-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/35">
                      Multi-tier itinerary
                    </span>
                    <ul className="mt-2 flex flex-col gap-0.5 sm:mt-3 sm:gap-1">
                      {dio.tiers.map((t, i) => (
                        <motion.li
                          key={t.tier}
                          initial={reduced ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: reduced ? 0 : 0.26 + i * 0.07, duration: 0.4 }}
                          whileHover={reduced ? undefined : { scale: 1.01, x: 3 }}
                          className="group/tier flex origin-left cursor-default items-baseline gap-2.5 rounded-lg px-1.5 py-1 transition-colors duration-300 hover:bg-white/[0.06] sm:gap-3.5 sm:px-2 sm:py-2"
                        >
                          <span
                            className="w-5 shrink-0 font-mono text-[11px] font-bold tracking-[0.08em]"
                            style={{ color: dio.accent }}
                          >
                            {t.tier}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[0.75rem] font-semibold leading-snug text-white/85 transition-colors duration-300 group-hover/tier:text-white sm:text-[0.8125rem]">
                              {t.label}
                            </span>
                            <span className="block font-mono text-[10px] leading-snug text-white/40 sm:mt-0.5 sm:text-[10.5px] sm:leading-relaxed">
                              {t.detail}
                            </span>
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- *
 * HUD parts
 * -------------------------------------------------------------------------- */

function DifficultyBadge({
  level,
  grade,
  accent,
}: {
  level: number
  grade: string
  accent: string
}) {
  return (
    <motion.span
      initial={false}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1.5"
    >
      <span aria-hidden className="flex items-end gap-[3px]">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className="w-[3px] rounded-full"
            style={{
              height: 5 + step * 2,
              backgroundColor: step <= level ? accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </span>
      <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/70">
        {grade}
      </span>
    </motion.span>
  )
}
