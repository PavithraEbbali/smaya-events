'use client'

import { useRef, type MouseEvent } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import {
  CalendarDays,
  Globe,
  PartyPopper,
  Smile,
  type LucideIcon,
} from 'lucide-react'

import { EASE_OUT, viewportOnce } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { stats } from '@/data/site'
import { cn } from '@/lib/utils'

/**
 * One icon per stat, positional. Order matches `stats` in data/site.ts:
 * years, events, clients, partners.
 */
const ICONS: readonly LucideIcon[] = [CalendarDays, PartyPopper, Smile, Globe]

/** Degrees of tilt at the very edge of a card. Deliberately small. */
const MAX_TILT = 10
/** Pixels the number is pulled toward the cursor. */
const MAX_PULL = 10

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const ITEM: Variants = {
  hidden: { y: 50, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE_OUT } },
}

/** Same stagger, no travel — for `prefers-reduced-motion`. */
const ITEM_REDUCED: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
}

/**
 * Tilt reacts quickly so the card feels attached to the cursor; the number is
 * heavily damped so it lags and settles, which is what reads as weight rather
 * than as a second thing following the mouse.
 */
const TILT_SPRING = { stiffness: 220, damping: 22, mass: 0.4 } as const
const MAGNET_SPRING = { stiffness: 90, damping: 40, mass: 0.9 } as const

/* -------------------------------------------------------------------------- *
 * Bezel
 * -------------------------------------------------------------------------- */

/**
 * A 3D metallic bezel, built from three nested rings rather than an image.
 *
 *   1. Outer rim — a top-to-bottom gold gradient. This is the whole illusion:
 *      a lit edge above, a shadowed one below, so the rim reads as a turned
 *      metal band rather than a flat stroke.
 *   2. Dark groove — 3px of near-black. The gap between rim and inner ring is
 *      what sells the depth; without it the two golds touch and the bezel
 *      flattens into a thick line.
 *   3. Inner ring — a hairline of gold, and the icon's centring context.
 *
 * Sizing comes from padding on the parents, not fixed sizes on the children, so
 * the whole bezel scales from the single `h-16 w-16` on the rim.
 *
 * aria-hidden — the icons carry nothing the label does not already state.
 */
function MetallicRing({ Icon }: { Icon: LucideIcon }) {
  return (
    <div
      aria-hidden
      className="h-16 w-16 flex-shrink-0 rounded-full bg-gradient-to-b from-[#E0B95B] to-[#8C6D23] p-[2px] shadow-lg"
    >
      <div className="h-full w-full rounded-full bg-[#11041C] p-[3px]">
        <div className="flex h-full w-full items-center justify-center rounded-full border border-[#D4AF37]/70">
          <Icon className="h-6 w-6 text-[#E0B95B]" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Card
 * -------------------------------------------------------------------------- */

type Stat = (typeof stats)[number]

/**
 * One stat: a card that tilts toward the cursor, with the number floating above
 * the tilting plane and drifting after the pointer.
 *
 * TWO ELEMENTS, NOT ONE. `perspective` on an element applies to its CHILDREN,
 * never to its own transform — so the wrapper holds the perspective and the
 * inner card holds the rotation. Collapsing them would silently produce a flat
 * 2D skew instead of a tilt.
 *
 * The wrapper is also what carries the stagger variant. Framer propagates
 * variants through motion components only, so this has to be a `motion.div`
 * sitting directly under the `motion.dl` — a plain div here would break the
 * chain and nothing would stagger.
 */
function StatCard({
  stat,
  Icon,
  reduced,
}: {
  stat: Stat
  Icon: LucideIcon
  reduced: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  /*
    Pointer position as a 0..1 fraction of the card, NOT raw pixels — so the
    same transform ranges work whether the card is 375px wide on a phone or
    350px in a four-up row, and the tilt always reaches exactly MAX_TILT at the
    edge. 0.5/0.5 is the resting centre.
  */
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const tiltX = useSpring(px, TILT_SPRING)
  const tiltY = useSpring(py, TILT_SPRING)
  const magX = useSpring(px, MAGNET_SPRING)
  const magY = useSpring(py, MAGNET_SPRING)

  /* rotateX is inverted: pointer below centre should push the card's top edge
     away, not toward. Getting this backwards is what makes a tilt feel wrong
     without being obviously broken. */
  const rotateY = useTransform(tiltX, [0, 1], [-MAX_TILT, MAX_TILT])
  const rotateX = useTransform(tiltY, [0, 1], [MAX_TILT, -MAX_TILT])

  const magnetX = useTransform(magX, [0, 1], [-MAX_PULL, MAX_PULL])
  const magnetY = useTransform(magY, [0, 1], [-MAX_PULL, MAX_PULL])

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }

  /* Springs carry it home rather than snapping — the card settles instead of
     jumping flat the instant the pointer crosses the edge. */
  const handleLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      variants={reduced ? ITEM_REDUCED : ITEM}
      className="relative"
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={reduced ? undefined : handleMove}
        onMouseLeave={reduced ? undefined : handleLeave}
        style={
          reduced
            ? undefined
            : { rotateX, rotateY, transformStyle: 'preserve-3d' }
        }
        className="flex h-full items-center gap-5 rounded-lg border border-transparent p-6 transition-colors duration-500 hover:border-white/10 hover:bg-white/[0.02] lg:px-10 lg:py-8"
      >
        <MetallicRing Icon={Icon} />

        <div>
          {/* `z: 20` lifts the number off the tilting plane. It only renders as
              depth because the parent is preserve-3d and the grandparent holds
              the perspective — without either it is an inert no-op. */}
          <motion.dd
            style={
              reduced ? undefined : { x: magnetX, y: magnetY, z: 20 }
            }
            className="text-4xl font-bold text-[#D4AF37]"
          >
            {stat.value}
            {stat.suffix}
          </motion.dd>
          <dt className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400">
            {stat.label}
          </dt>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- *
 * Section
 * -------------------------------------------------------------------------- */

/**
 * The hero's closing stats bar.
 *
 * THE GROUND IS FULLY OPAQUE, AND THAT IS THE BUG FIX. This previously used
 * `bg-[#150524]/90` with `backdrop-blur-md`. Nothing in this component ever
 * drew a gradient — but the hero's `hero-orb-b` (a 653px radial gradient under
 * `blur(64px)`) and the key-light layer sit directly behind this band, and 10%
 * transparency plus a backdrop blur smeared both of them straight across the
 * numbers. A solid `#0d0216` — the hero gradient's own end colour — blocks
 * them outright. Do not reintroduce alpha or `backdrop-blur` here.
 *
 * Rendered as a <dl>: each item is a number and its label, which is exactly a
 * description list. `<dd>` comes before `<dt>` because the number reads first.
 */
export function StatsFooter({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()

  return (
    <div
      className={cn('relative z-10 w-full bg-[#0d0216]', className)}
    >
      <motion.dl
        variants={CONTAINER}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid w-full grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            stat={stat}
            Icon={ICONS[i] ?? Globe}
            reduced={reduced}
          />
        ))}
      </motion.dl>

      {/*
        Double bottom border — a hairline, a 2px gap of the ground behind, then
        a heavier gold rule. Grounds the band against the ivory section below.
      */}
      <div aria-hidden className="h-[1px] w-full bg-[#D4AF37]/30" />
      <div aria-hidden className="mt-[2px] h-[3px] w-full bg-[#D4AF37]/70" />
    </div>
  )
}
