'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { ArrowUpRight, Plus } from 'lucide-react'

import type { VerticalService } from '@/data/verticals'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { Counter } from '@/components/ui/Counter'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- *
 * Per-card theme and content.
 *
 * Keyed by the service title so it stays aligned with data/verticals.ts even if
 * the order there changes — an index would silently pair the wrong animation
 * with the wrong card the moment someone reorders the array.
 * -------------------------------------------------------------------------- */

type Variant =
  | 'split'
  | 'scan'
  | 'nodes'
  | 'flip'
  | 'pan'
  | 'curtain'

type Theme = {
  variant: Variant
  img: string
  /** Card ground. */
  base: string
  /** The one colour that carries this card. */
  accent: string
  /** Body copy on the ground. */
  muted: string
  detail: string[]
}

const THEMES: Record<string, Theme> = {
  Conferences: {
    variant: 'split',
    img: '/corporate-conferences-realistic.jpg',
    base: '#131C31',
    accent: '#8FB0F0',
    muted: 'rgba(226,232,255,0.72)',
    detail: [
      'Keynote track · main auditorium',
      'Breakout track · 4 parallel rooms',
      'Workshop track · hands-on labs',
      'Speaker green room & AV rehearsal',
    ],
  },
  'Product Launch': {
    variant: 'scan',
    img: '/corporate-product-launch-realistic.jpg',
    base: '#0A0E14',
    accent: '#22D3EE',
    muted: 'rgba(207,231,238,0.7)',
    detail: [
      'Reveal staging · motorised drop',
      'LED wall · 8K, 4mm pitch',
      'Line array PA · 118 dB coverage',
      'Press kit · embargo assets',
    ],
  },
  'Team Building': {
    variant: 'nodes',
    img: '/corporate-team-building-realistic.jpg',
    base: '#06322C',
    accent: '#34D399',
    muted: 'rgba(209,244,235,0.72)',
    detail: [
      'Outdoor Offsites',
      'Leadership Labs',
      'Workshops',
      'Sports Leagues',
      'Volunteer Days',
    ],
  },
  'Annual Day': {
    variant: 'flip',
    img: '/corporate-annual-day-realistic.jpg',
    base: '#1C1B1F',
    accent: '#D4AF37',
    muted: 'rgba(238,233,222,0.72)',
    detail: ['Guests hosted', 'Awards presented', 'Years running', 'Cities'],
  },
  'Corporate Retreats': {
    variant: 'pan',
    img: '/corporate-retreats-realistic.jpg',
    base: '#12261C',
    accent: '#C08B4F',
    muted: 'rgba(226,236,227,0.72)',
    detail: [
      'Strategy · leadership intensives',
      'Strategy · quarterly planning',
      'Wellness · sunrise yoga & trails',
      'Wellness · unstructured evenings',
    ],
  },
  'Award Nights': {
    variant: 'curtain',
    img: '/corporate-award-nights-realistic.jpg',
    base: '#08070C',
    accent: '#F5C542',
    muted: 'rgba(245,238,220,0.72)',
    detail: [
      'Bespoke trophy design',
      'Cinematic reveal films',
      'Red carpet & step-and-repeat',
      'Live orchestra scoring',
    ],
  },
}

/**
 * Where a card sits relative to the reader's travel through the deck.
 * `past` and `before` are both "not the front card" but must never be
 * collapsed — see the phase comment at the call site.
 */
type Phase = 'before' | 'active' | 'past'

/** Where the first card pins, clearing the fixed navbar. */
const PIN_TOP = 96
/** Each card pins this much lower than the one before, fanning the deck. */
const PIN_STEP = 18
/** Sub-pixel slack — sticky tops rarely land on an exact integer. */
const PIN_EPS = 2
/** How long a card must hold the front of the deck before it plays itself. */
const AUTO_REVEAL_MS = 1000

/** Attendance-style figures for the Annual Day ticker. */
const TICKER = [
  { end: 2400, suffix: '+' },
  { end: 46, suffix: '' },
  { end: 11, suffix: '' },
  { end: 7, suffix: '' },
]

/* -------------------------------------------------------------------------- *
 * Ambient background motion
 *
 * One layer per card, sitting under everything else. Keyframes live in
 * globals.css; the per-card parameters live here as inline styles because the
 * colours and timings are data — a class string assembled from them would never
 * survive Tailwind's static scanner.
 * -------------------------------------------------------------------------- */

/** A soft drifting light. The building block for most of the six. */
function Orb({
  color,
  size,
  left,
  top,
  anim = 'smaya-corp-drift',
  duration,
  delay = 0,
  blur = 80,
  opacity = 0.55,
}: {
  color: string
  size: number
  left: string
  top: string
  anim?: string
  duration: number
  delay?: number
  blur?: number
  opacity?: number
}) {
  return (
    <span
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left,
        top,
        opacity,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        animation: `${anim} ${duration}s ease-in-out ${delay}s infinite`,
        willChange: 'transform',
      }}
    />
  )
}

const BOKEH_AMBIENT = [
  { left: '12%', size: 7, dur: 13, delay: 0 },
  { left: '26%', size: 4, dur: 16, delay: 2.4 },
  { left: '41%', size: 9, dur: 11, delay: 4.1 },
  { left: '57%', size: 5, dur: 15, delay: 1.2 },
  { left: '69%', size: 8, dur: 12, delay: 5.6 },
  { left: '84%', size: 5, dur: 17, delay: 3.3 },
  { left: '93%', size: 6, dur: 14, delay: 6.8 },
]

function CardAmbient({ theme }: { theme: Theme }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: theme.base }}
    >
      {theme.variant === 'split' && (
        <>
          <Orb color="#38BDF8" size={420} left="-8%" top="-30%" duration={19} opacity={0.4} />
          <Orb
            color="#6366F1"
            size={380}
            left="58%"
            top="45%"
            anim="smaya-corp-drift-alt"
            duration={24}
            opacity={0.45}
          />
          <Orb color="#8FB0F0" size={240} left="30%" top="60%" duration={16} delay={3} opacity={0.28} />
        </>
      )}

      {theme.variant === 'scan' && (
        <>
          {/* Laser grid. Two gradients — verticals and horizontals — crawling one
              cell per cycle so the tile seam never shows. */}
          <span
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.accent}1f 1px, transparent 1px), linear-gradient(to bottom, ${theme.accent}1f 1px, transparent 1px)`,
              backgroundSize: '48px 48px, 48px 48px',
              animation: 'smaya-corp-grid 6s linear infinite',
              maskImage: 'radial-gradient(ellipse 90% 70% at 50% 50%, #000 30%, transparent 100%)',
            }}
          />
          <Orb color="#A855F7" size={360} left="-10%" top="30%" duration={21} opacity={0.4} />
          <Orb
            color="#22D3EE"
            size={300}
            left="62%"
            top="-20%"
            anim="smaya-corp-drift-alt"
            duration={17}
            opacity={0.35}
          />
          {/* Neon sweep raking across the grid. */}
          <span
            className="absolute inset-y-0 w-1/3"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accent}30, #A855F740, transparent)`,
              filter: 'blur(24px)',
              animation: 'smaya-corp-sweep 7s ease-in-out infinite',
            }}
          />
        </>
      )}

      {theme.variant === 'nodes' && (
        <>
          {/* Blobs, not circles — the border-radius morphs inside the keyframe,
              so the mesh reads organic rather than as drifting discs. */}
          <span
            className="absolute"
            style={{
              width: 460,
              height: 400,
              left: '-12%',
              top: '-25%',
              background: `radial-gradient(circle, #10B981 0%, transparent 70%)`,
              filter: 'blur(70px)',
              opacity: 0.5,
              animation: 'smaya-corp-wave 20s ease-in-out infinite',
            }}
          />
          <span
            className="absolute"
            style={{
              width: 420,
              height: 380,
              left: '55%',
              top: '35%',
              background: `radial-gradient(circle, #2DD4BF 0%, transparent 70%)`,
              filter: 'blur(70px)',
              opacity: 0.45,
              animation: 'smaya-corp-wave 26s ease-in-out -8s infinite reverse',
            }}
          />
          <Orb color="#34D399" size={220} left="28%" top="55%" duration={18} delay={2} opacity={0.3} />
        </>
      )}

      {theme.variant === 'flip' && (
        <>
          {[
            { left: '6%', w: 130, d: 9, delay: 0 },
            { left: '44%', w: 90, d: 12, delay: 2.5 },
            { left: '72%', w: 160, d: 10.5, delay: 5 },
          ].map((leak) => (
            <span
              key={leak.left}
              className="absolute -inset-y-1/4"
              style={{
                left: leak.left,
                width: leak.w,
                background: `linear-gradient(180deg, transparent, ${theme.accent}, transparent)`,
                filter: 'blur(38px)',
                animation: `smaya-corp-shimmer ${leak.d}s ease-in-out ${leak.delay}s infinite`,
              }}
            />
          ))}
          <Orb color="#D4AF37" size={320} left="20%" top="20%" duration={23} opacity={0.22} />
        </>
      )}

      {theme.variant === 'pan' && (
        <>
          <Orb color="#C08B4F" size={460} left="-14%" top="20%" duration={28} opacity={0.4} />
          <Orb
            color="#D9A45B"
            size={300}
            left="60%"
            top="-25%"
            anim="smaya-corp-drift-alt"
            duration={32}
            opacity={0.3}
          />
          <Orb color="#3F7A52" size={340} left="35%" top="50%" duration={24} delay={4} opacity={0.35} />
        </>
      )}

      {theme.variant === 'curtain' && (
        <>
          <Orb color="#F5C542" size={340} left="30%" top="35%" duration={26} opacity={0.16} />
          {BOKEH_AMBIENT.map((b) => (
            <span
              key={b.left}
              className="absolute rounded-full"
              style={{
                left: b.left,
                bottom: '-6%',
                width: b.size,
                height: b.size,
                backgroundColor: theme.accent,
                boxShadow: `0 0 12px 3px ${theme.accent}90`,
                filter: 'blur(1px)',
                animation: `smaya-corp-bokeh ${b.dur}s linear ${b.delay}s infinite`,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Section backdrop — the atmosphere the whole deck sits on
 * -------------------------------------------------------------------------- */

/** Drift paths. Deliberately unequal durations so the four never resync. */
const DRIFT_ORBS = [
  { color: '#22D3EE', size: 520, left: '-6%', top: '4%', x: [0, 60, -40, 0], y: [0, -40, 30, 0], dur: 26 },
  { color: '#6366F1', size: 620, left: '58%', top: '18%', x: [0, -70, 45, 0], y: [0, 35, -30, 0], dur: 34 },
  { color: '#D4AF37', size: 460, left: '20%', top: '58%', x: [0, 50, -55, 0], y: [0, -30, 25, 0], dur: 30 },
  { color: '#10B981', size: 560, left: '68%', top: '70%', x: [0, -45, 60, 0], y: [0, 30, -35, 0], dur: 38 },
]

function StackBackdrop({
  progress,
  reduced,
}: {
  progress: MotionValue<number>
  reduced: boolean
}) {
  /* Parallax: the grid travels against the page, so the field reads as depth
     behind the cards rather than a texture glued to them. */
  const gridY = useTransform(progress, [0, 1], ['-8%', '8%'])
  const veil = useTransform(progress, [0, 0.5, 1], [0.75, 0.4, 0.75])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-x-4 -inset-y-12 -z-10 overflow-hidden rounded-[2.5rem] sm:-inset-x-8"
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 20% 0%, #101A2E 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 85% 100%, #0C1F1B 0%, transparent 60%), #070A11',
      }}
    >
      {/* Animated grid, drifting on scroll. Oversized vertically so the
          parallax travel never exposes an edge. */}
      <motion.div
        className="absolute inset-x-0 -inset-y-[12%]"
        style={{
          y: reduced ? 0 : gridY,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 75% 60% at 50% 50%, #000 20%, transparent 95%)',
        }}
      />

      {/* Floating ambient orbs. */}
      {DRIFT_ORBS.map((orb) => (
        <motion.span
          key={orb.color}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.left,
            top: orb.top,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(110px)',
            opacity: 0.42,
          }}
          animate={reduced ? undefined : { x: orb.x, y: orb.y }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Low-opacity particle field. Static dots, moved only by the parallax —
          a second animated layer here reads as noise, not atmosphere. */}
      <motion.div
        className="absolute inset-x-0 -inset-y-[12%] opacity-40"
        style={{
          y: reduced ? 0 : gridY,
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '132px 132px',
          backgroundPosition: '34px 18px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 0%, transparent 90%)',
        }}
      />

      {/* Keeps the glass cards reading as glass — without it the orbs compete
          with the card grounds instead of sitting behind them. */}
      <motion.div
        className="absolute inset-0 bg-[#05070C]"
        style={{ opacity: reduced ? 0.55 : veil }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * The stack
 * -------------------------------------------------------------------------- */

/**
 * Scroll-driven stacking cards.
 *
 * Each card is its own `sticky` block pinned a few pixels lower than the one
 * before it, so as the page scrolls they gather into a fanned deck rather than
 * scrolling away. The card underneath scales down and dims as the next arrives,
 * which is what reads as depth.
 */
export function CorporateStack({
  services,
}: {
  services: readonly VerticalService[]
}) {
  const cards = services.filter((s) => THEMES[s.title])
  const wrappers = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(-1)
  /* One entry per card index. A Set rather than a single "which card is open"
     value, so a reveal is genuinely independent — nothing about card 3 entering
     or leaving this collection touches card 1. */
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(() => new Set())
  /* Index -> pending timeout. Each card owns its own 1000ms countdown; these
     are refs because a running timer is not something the UI renders. */
  const timers = useRef(new Map<number, number>())
  const armed = useRef(new Set<number>())
  const sectionRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  /* Spans the reader's whole approach and departure, so the backdrop's parallax
     is already in motion before the first card pins. */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  /*
    WHICH CARD IS "ACTIVE" IS A STACK-LEVEL QUESTION, NOT A PER-CARD ONE.

    A card cannot answer it alone. Once it pins it STAYS pinned — sticky holds
    it at its offset while the rest of the deck gathers on top — so "am I at my
    pin line?" stays true long after the card is buried and is useless as an
    activity test. An IntersectionObserver has the same blind spot: a covered
    card is still fully intersecting.

    What actually distinguishes the front of the deck is ordering. Every card at
    or above its pin line is pinned; the LAST such card is the one nothing has
    covered yet. So one listener walks the deck and takes the highest index that
    has arrived — which flips to i+1 at the exact moment card i+1 pins over
    card i, and flips back on the way up.
  */
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      let front = -1
      for (let i = 0; i < wrappers.current.length; i++) {
        const el = wrappers.current[i]
        if (!el) continue
        const { top, bottom } = el.getBoundingClientRect()
        /* `bottom > 0` drops cards scrolled clean off the top, so leaving the
           section upward deactivates the deck instead of stranding the last
           card as permanently active. */
        if (top <= PIN_TOP + i * PIN_STEP + PIN_EPS && bottom > 0) front = i
      }

      /*
        NOTHING PINNED YET, BUT THE FIRST CARD MAY ALREADY BE ON SCREEN.

        Pinning is the wrong sole trigger for card one. On a tall display the
        deck's first card is fully visible the moment the page loads — it starts
        826px down, so any viewport past ~1100px tall shows it without a single
        scroll — and it would sit there inert waiting for a pin that has already
        been satisfied for every card behind it. Same on a reload that restores
        mid-page.

        So: the front of the deck is the last PINNED card, or, before anything
        has pinned, card one once it is substantially on screen. The 60% floor
        is what keeps this from firing while the card is still a sliver at the
        bottom of the viewport, which would spend the reveal before the reader
        can see it.
      */
      if (front === -1) {
        const first = wrappers.current[0]
        if (first) {
          const r = first.getBoundingClientRect()
          const vh = window.innerHeight
          const shown = Math.min(r.bottom, vh) - Math.max(r.top, 0)
          if (shown >= Math.min(r.height, vh) * 0.6) front = 0
        }
      }

      setActive((prev) => (prev === front ? prev : front))
    }

    /* Coalesce to one measurement per frame — scroll fires far faster than
       layout changes, and this reads geometry on every call. */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    /*
      A mount-time measurement goes stale on its own.

      Card photographs and webfonts land after this effect runs and reflow
      everything below them. If the reader has not scrolled — exactly the
      already-in-view case above — no scroll event ever arrives to correct it,
      and a card sitting in position at load is missed. Observing the deck's own
      box catches those late shifts.
    */
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
    PER-CARD ARMING.

    The bug this replaces: arming only the card that is exactly `active`. A
    trackpad fling, a Lenis ease, or any scroll covering more than one 476px
    card-pitch between two animation frames moves the front of the deck from
    card 1 to card 5 in a single measurement. Cards 2, 3 and 4 never occupy the
    active slot, so they never armed and stayed shut for good — reproduced
    exactly, and the reason the deck failed on "subsequent cards".

    The fix is to arm on REACHED, not on ACTIVE: every index up to and including
    the front gets its own countdown. `armed` makes that idempotent, so a card
    already counting down (or already revealed) is never restarted by ordinary
    scrolling.
  */
  useEffect(() => {
    const pending = timers.current
    const claimed = armed.current

    /* Descending: arm everything the reader has now reached. */
    for (let i = 0; i <= active; i++) {
      if (claimed.has(i)) continue
      claimed.add(i)
      pending.set(
        i,
        window.setTimeout(() => {
          pending.delete(i)
          /* A NEW Set, and only this index added — card i revealing cannot
             disturb any other card's entry. */
          setRevealed((prev) => {
            if (prev.has(i)) return prev
            const next = new Set(prev)
            next.add(i)
            return next
          })
        }, AUTO_REVEAL_MS),
      )
    }

    /* Ascending: everything now below the reader is disarmed and re-hidden, so
       the next downward pass replays it. Cancelling a pending timeout here is
       safe — unlike the `past` case, the reader has genuinely gone back up. */
    let rewound = false
    for (const i of [...claimed]) {
      if (i <= active) continue
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
        const next = new Set([...prev].filter((i) => i <= active))
        return next.size === prev.size ? prev : next
      })
    }
  }, [active])

  /* Every outstanding countdown dies with the component. */
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current.clear()
    },
    [],
  )

  return (
    /* `isolate` is load-bearing: it gives the backdrop's negative z-index a
       stacking context of its own. Without it, `-z-10` would drop the whole
       field behind the section's white background and render it invisible. */
    <div ref={sectionRef} className="relative isolate">
      <StackBackdrop progress={scrollYProgress} reduced={reduced} />
      {cards.map((service, i) => (
        <StackCard
          key={service.title}
          service={service}
          index={i}
          total={cards.length}
          /*
            THREE PHASES, NOT A BOOLEAN — this is what makes the deck
            reversible without reintroducing the bug that broke it.

            `past` and `before` are both "not the front card", and collapsing
            them into one falsy state is precisely what used to cancel every
            pending reveal: a card you scrolled DOWN past was treated the same
            as one you had not reached, so it slammed shut mid-countdown.
            Separating them means only genuinely-upward travel resets a card.
          */
          phase={active < 0 || active < i ? 'before' : active === i ? 'active' : 'past'}
          revealed={revealed.has(i)}
          register={(el) => {
            wrappers.current[i] = el
          }}
        />
      ))}
    </div>
  )
}

function StackCard({
  service,
  index,
  total,
  phase,
  revealed,
  register,
}: {
  service: VerticalService
  index: number
  total: number
  phase: Phase
  revealed: boolean
  register: (el: HTMLDivElement | null) => void
}) {
  const theme = THEMES[service.title]
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  /*
    The countdown itself lives in CorporateStack, keyed by index — see the
    arming effect there. This card only renders the result.

    `override` is the reader's own click, and `null` means "nobody has touched
    it, follow the scroll". Kept separate from `revealed` rather than seeding a
    `useState` from the prop, because a copied prop goes stale: the parent
    un-reveals a card on upward travel, and a local copy would sit there open.
  */
  const [override, setOverride] = useState<boolean | null>(null)
  const open = override ?? revealed

  /*
    Scrolling back above the card clears a manual override, so the next
    downward pass replays cleanly instead of honouring a stale click.

    Keyed on PHASE, not on `revealed`. Keying it on `revealed` looks equivalent
    and silently isn't: a card opened by hand that the scroll never auto-revealed
    has `revealed === false` the entire time, so the effect never re-runs and the
    card stays open forever — including back at the top of the page, where it is
    the only card still showing its reveal.
  */
  useEffect(() => {
    if (phase === 'before') setOverride(null)
  }, [phase])

  /*
    `end start` — the card's own exit, not the container's.

    The progress this reads is how far THIS card has travelled out of the
    viewport, which is what should drive its own recede. Measuring against the
    whole stack instead would make every card shrink on the same schedule
    regardless of where it actually sits.
  */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9])
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.45])

  /* Each card pins slightly lower than the last, so the stack fans downward and
     you can still see the edge of everything beneath. */
  const top = PIN_TOP + index * PIN_STEP

  return (
    <div
      ref={(el) => {
        ref.current = el
        register(el)
      }}
      className="sticky"
      data-stack-card={index}
      data-active={phase === 'active'}
      data-phase={phase}
      data-revealed={revealed}
      data-override={String(override)}
      data-open={open}
      style={{ top, marginBottom: index === total - 1 ? 0 : 28 }}
    >
      <motion.article
        style={reduced ? undefined : { scale }}
        className="relative isolate mx-auto w-full max-w-5xl overflow-hidden rounded-3xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
      >
        <div className="relative grid min-h-[26rem] grid-cols-1 lg:min-h-[28rem] lg:grid-cols-2">
          <CardAmbient theme={theme} />

          {/* ------------------------------ Copy ------------------------------ */}
          <div className="relative z-20 flex flex-col justify-between gap-8 p-8 sm:p-12">
            {/* Scrim, not a glass box. The copy column sits over drifting orbs,
                so it needs contrast — but boxing a heading that is already the
                largest thing on the card just adds a border for its own sake.
                A directional wash holds legibility and stays invisible. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'linear-gradient(100deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 55%, transparent 100%)',
              }}
            />
            <div>
              <span className="flex items-center gap-3">
                <span
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.42em] opacity-70"
                  style={{ color: theme.accent }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  aria-hidden
                  className="h-px w-8"
                  style={{ backgroundColor: `${theme.accent}66` }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.42em] text-white/35">
                  {String(total).padStart(2, '0')}
                </span>
              </span>
              <h3
                className="mt-6 bg-clip-text font-serif text-[2.1rem] font-black leading-[1.02] tracking-[-0.02em] text-transparent sm:text-[2.75rem]"
                style={{
                  backgroundImage: `linear-gradient(104deg, #FFFFFF 0%, #FFFFFF 42%, ${theme.accent} 100%)`,
                }}
              >
                {service.title}
              </h3>
              <span
                aria-hidden
                className="mt-5 block h-px w-14"
                style={{
                  background: `linear-gradient(90deg, ${theme.accent}, transparent)`,
                }}
              />
              <p
                className="mt-5 max-w-sm text-[0.9375rem] font-light leading-[1.75]"
                style={{ color: theme.muted }}
              >
                {service.longDesc ?? service.desc}
              </p>
            </div>

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
                      scale: 1.045,
                      backgroundColor: `${theme.accent}26`,
                      boxShadow: `0 0 28px -4px ${theme.accent}, 0 0 0 1px ${theme.accent}80`,
                    }
              }
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="group/cta inline-flex w-fit items-center gap-3 rounded-full border px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em]"
              style={{
                borderColor: `${theme.accent}55`,
                color: theme.accent,
                backgroundColor: open ? `${theme.accent}1a` : 'transparent',
              }}
            >
              {open ? 'Close' : LABELS[theme.variant]}
              <motion.span
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ duration: 0.3 }}
                className="inline-flex"
              >
                <Plus size={14} aria-hidden />
              </motion.span>
            </motion.button>
          </div>

          {/* ----------------------------- Visual ----------------------------- */}
          <div className="relative min-h-[16rem] overflow-hidden lg:min-h-full">
            <CardVisual
              variant={theme.variant}
              theme={theme}
              open={open}
              reduced={reduced}
              title={service.title}
            />
          </div>
        </div>

        {/* The card beneath darkens as the next one arrives over it. */}
        {!reduced && (
          <motion.div
            aria-hidden
            style={{ opacity: dim }}
            className="pointer-events-none absolute inset-0 z-30 bg-black"
          />
        )}
      </motion.article>
    </div>
  )
}

const LABELS: Record<Variant, string> = {
  split: 'Open the agenda',
  scan: 'Scan the spec',
  nodes: 'Break it out',
  flip: 'Flip the ledger',
  pan: 'Slide the schedule',
  curtain: 'Raise the curtain',
}

/* -------------------------------------------------------------------------- *
 * Six interactions. Each owns a genuinely different mechanic — a split, a
 * clip-path wipe, a spring-out graph, a 3D flip, a translate and a curtain —
 * rather than one animation re-skinned six times.
 * -------------------------------------------------------------------------- */

function CardVisual({
  variant,
  theme,
  open,
  reduced,
  title,
}: {
  variant: Variant
  theme: Theme
  open: boolean
  reduced: boolean
  title: string
}) {
  const t = reduced ? { duration: 0 } : undefined

  switch (variant) {
    /* 1. Split-screen accordion — the photo parts down the middle. */
    case 'split':
      return (
        <Layer>
          <Detail theme={theme} heading="Multi-track agenda" items={theme.detail} />
          <motion.div
            animate={{ x: open ? '-101%' : '0%' }}
            transition={t ?? { duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-y-0 left-0 z-10 w-1/2 overflow-hidden"
          >
            {/* A 200%-wide inner box so the two halves together reconstruct one
                uncropped photograph rather than two independent crops. */}
            <div className="absolute inset-y-0 left-0 w-[200%]">
              <Image src={theme.img} alt={title} fill sizes="50vw" className="object-cover" />
            </div>
          </motion.div>
          <motion.div
            animate={{ x: open ? '101%' : '0%' }}
            transition={t ?? { duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-y-0 right-0 z-10 w-1/2 overflow-hidden"
          >
            <div className="absolute inset-y-0 right-0 w-[200%]">
              <Image src={theme.img} alt="" fill sizes="50vw" className="object-cover" />
            </div>
          </motion.div>
        </Layer>
      )

    /* 2. Laser scan — a clip-path wipe with a glowing edge riding it. */
    case 'scan':
      return (
        <Layer>
          <Detail theme={theme} heading="Staging & AV" items={theme.detail} mono />
          <motion.div
            animate={{ clipPath: open ? 'inset(100% 0 0 0)' : 'inset(0% 0 0 0)' }}
            transition={t ?? { duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="group/scan absolute inset-0 z-10"
          >
            <Image src={theme.img} alt={title} fill sizes="50vw" className="object-cover" />
            {/* Idle hover line, independent of the open state. */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover/scan:opacity-100"
              style={{ background: theme.accent, boxShadow: `0 0 18px 2px ${theme.accent}` }}
            />
          </motion.div>
          {/* The scan bar itself, travelling the same distance as the wipe. */}
          {!reduced && (
            <motion.span
              aria-hidden
              animate={{ top: open ? '100%' : '0%', opacity: open ? [0, 1, 1, 0] : 0 }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
              className="pointer-events-none absolute inset-x-0 z-20 h-[2px]"
              style={{ background: theme.accent, boxShadow: `0 0 26px 4px ${theme.accent}` }}
            />
          )}
        </Layer>
      )

    /* 3. Kinetic nodes — the group springs apart into linked pills. */
    case 'nodes':
      return (
        <Layer>
          <motion.div
            animate={{ opacity: open ? 0.18 : 1 }}
            transition={t ?? { duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image src={theme.img} alt={title} fill sizes="50vw" className="object-cover" />
          </motion.div>
          <div className="absolute inset-0 z-10 flex flex-wrap content-center items-center justify-center gap-2 p-8">
            {theme.detail.map((node, i) => (
              <motion.span
                key={node}
                initial={false}
                animate={
                  open
                    ? { opacity: 1, scale: 1, y: 0 }
                    : { opacity: 0, scale: 0.4, y: 14 }
                }
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 320,
                        damping: 22,
                        delay: open ? i * 0.07 : 0,
                      }
                }
                whileHover={
                  reduced
                    ? undefined
                    : {
                        scale: 1.08,
                        y: -3,
                        backgroundColor: 'rgba(0,0,0,0.62)',
                        boxShadow: `0 0 26px -2px ${theme.accent}, 0 0 0 1px ${theme.accent}99`,
                      }
                }
                className="cursor-default rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[0.8125rem] font-semibold tracking-[0.02em] backdrop-blur-md"
                style={{ color: theme.accent, boxShadow: `0 0 20px -6px ${theme.accent}80` }}
              >
                {node}
              </motion.span>
            ))}
          </div>
        </Layer>
      )

    /* 4. 3D ledger flip — one box, two faces, rotated on X. */
    case 'flip':
      return (
        <div className="absolute inset-0 [perspective:1400px]">
          <motion.div
            animate={{ rotateX: open ? 180 : 0 }}
            transition={t ?? { duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="relative h-full w-full [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <Image src={theme.img} alt={title} fill sizes="50vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center gap-4 border border-white/10 bg-black/40 p-8 backdrop-blur-md [backface-visibility:hidden] [transform:rotateX(180deg)] sm:p-10">
              <MicroLabel theme={theme}>Milestone ledger</MicroLabel>
              {theme.detail.map((label, i) => (
                <div key={label} className="flex items-baseline justify-between gap-4 border-b pb-3" style={{ borderColor: `${theme.accent}33` }}>
                  <span className="text-[0.8125rem]" style={{ color: theme.muted }}>
                    {label}
                  </span>
                  <span className="font-serif text-2xl font-black" style={{ color: theme.accent }}>
                    {/* Counters only run once the face is actually showing. */}
                    {open ? (
                      <Counter end={TICKER[i].end} suffix={TICKER[i].suffix} />
                    ) : (
                      0
                    )}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )

    /* 5. Panoramic pan — the photo slides aside like a window. */
    case 'pan':
      return (
        <Layer>
          <Detail theme={theme} heading="Dual-track itinerary" items={theme.detail} />
          <motion.div
            animate={{ x: open ? '-101%' : '0%' }}
            transition={t ?? { duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 z-10"
          >
            <Image src={theme.img} alt={title} fill sizes="50vw" className="object-cover" />
          </motion.div>
        </Layer>
      )

    /* 6. Velvet curtains — two draped halves part over a lit stage. */
    case 'curtain':
      return (
        <Layer>
          <Image src={theme.img} alt={title} fill sizes="50vw" className="object-cover" />
          {/* Spotlight, which only makes sense once the curtains are open. */}
          <motion.div
            aria-hidden
            animate={{ opacity: open ? 1 : 0 }}
            transition={t ?? { duration: 0.9, delay: open ? 0.35 : 0 }}
            className="absolute inset-0 z-[5]"
            style={{
              background: `radial-gradient(ellipse 55% 45% at 50% 42%, ${theme.accent}40 0%, transparent 70%)`,
            }}
          />
          {/*
            Translucent here, unlike the other four.

            Everywhere else the covering layer slides fully away, so the panel
            can be opaque. Curtains part onto a LIT STAGE — an opaque panel
            would hide the photograph and the spotlight that are the whole
            point of the reveal, so this one scrims instead of covering.
          */}
          <Detail
            theme={theme}
            heading="Trophy & show design"
            items={theme.detail}
            z={6}
            translucent
          />
          {!reduced && open && (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[7]">
              {BOKEH.map((b, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: [0, 0.8, 0], y: -60 }}
                  transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute rounded-full blur-[2px]"
                  style={{
                    left: b.left,
                    top: b.top,
                    width: b.size,
                    height: b.size,
                    backgroundColor: theme.accent,
                  }}
                />
              ))}
            </div>
          )}
          {(['left', 'right'] as const).map((side) => (
            <motion.div
              key={side}
              animate={{ x: open ? (side === 'left' ? '-101%' : '101%') : '0%' }}
              transition={t ?? { duration: 1, ease: [0.76, 0, 0.24, 1] }}
              className={cn('absolute inset-y-0 z-10 w-1/2', side === 'left' ? 'left-0' : 'right-0')}
              style={{
                background: `repeating-linear-gradient(90deg, #4A0E1B 0px, #6B1626 14px, #3A0A14 28px)`,
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
              }}
            />
          ))}
        </Layer>
      )
  }
}

const BOKEH = [
  { left: '18%', top: '62%', size: 10 },
  { left: '34%', top: '74%', size: 6 },
  { left: '52%', top: '58%', size: 12 },
  { left: '68%', top: '70%', size: 7 },
  { left: '82%', top: '64%', size: 9 },
]

/**
 * Shared positioning context for a card's visual half.
 *
 * Deliberately TRANSPARENT. It used to paint `theme.base`, which was harmless
 * when the ground was flat — but that opaque fill would now sit on top of the
 * ambient layer and hide every orb behind the visual half. Letting it through
 * is the whole point of the glass panels below.
 */
function Layer({ children }: { children: ReactNode }) {
  return <div className="absolute inset-0 overflow-hidden">{children}</div>
}

/** The panel each interaction uncovers. */
function Detail({
  theme,
  heading,
  items,
  mono = false,
  z = 0,
  translucent = false,
}: {
  theme: Theme
  heading: string
  items: string[]
  mono?: boolean
  z?: number
  translucent?: boolean
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col p-6 sm:p-7',
        translucent ? 'justify-end' : 'justify-center',
      )}
      style={{ zIndex: z }}
    >
      {/*
        A GLASS PANEL INSET FROM THE EDGE, not a full-bleed opaque fill.

        The fill used to be `theme.base` — sound when the ground was flat, but it
        would now sit over the ambient layer and cancel the very motion this
        upgrade adds. Frosting it instead lets the orbs drift behind the copy,
        and the inset margin lets them show around it too.
      */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md sm:p-7">
        <MicroLabel theme={theme}>{heading}</MicroLabel>
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            /*
              The row drives the arrow through a variant rather than the arrow
              owning its own `whileHover`. Hovering the arrow itself is a 14px
              target; letting the whole row publish `hover` means the motion
              fires anywhere along the line, and the two stay in sync.
            */
            <motion.li
              key={item}
              initial={false}
              whileHover="hover"
              animate={{ color: theme.muted }}
              variants={{ hover: { color: '#FFFFFF' } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={cn(
                'flex cursor-default items-start gap-3 text-[0.8125rem] leading-relaxed',
                mono && 'font-mono text-[0.75rem]',
              )}
            >
              <motion.span
                aria-hidden
                className="mt-0.5 inline-flex shrink-0"
                variants={{ hover: { x: 4, y: -2 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                style={{ color: theme.accent }}
              >
                <ArrowUpRight size={14} />
              </motion.span>
              {item}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * Tracked uppercase micro-label with a lit dot.
 *
 * `tracking` this wide pushes the trailing space outside the glyph box, which
 * reads as a stray indent before the next element — `pr` of the same measure
 * puts it back.
 */
function MicroLabel({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px 2px ${theme.accent}80` }}
      />
      <span
        className="pr-[0.34em] font-mono text-[10px] font-medium uppercase tracking-[0.34em]"
        style={{ color: theme.accent }}
      >
        {children}
      </span>
    </span>
  )
}
