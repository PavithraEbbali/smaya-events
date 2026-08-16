'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion'

import type { VerticalService } from '@/data/verticals'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- *
 * Reel data
 *
 * Keyed by service title to stay aligned with data/verticals.ts — an index
 * would silently pair the wrong photograph and the wrong lighting with the
 * wrong frame the moment anyone reorders that array.
 * -------------------------------------------------------------------------- */

type Frame = {
  img: string
  /** Ambient the section takes on while this frame holds the centre. */
  glow: string
  /** Border tint for the same. */
  tint: string
  numeral: string
  tags: string[]
  sizes: string
}

const FRAMES: Record<string, Frame> = {
  'DJ Nights': {
    img: '/performance-dj.jpg',
    glow: 'rgba(34,211,238,0.20)',
    tint: 'rgba(34,211,238,0.45)',
    numeral: '01',
    tags: ['Booth', 'Line array', 'Laser rig'],
    sizes: '(min-width: 1024px) 50vw, (min-width: 768px) 65vw, 80vw',
  },
  'Live Concerts': {
    img: '/performance-concert.jpg',
    glow: 'rgba(245,158,11,0.20)',
    tint: 'rgba(245,158,11,0.45)',
    numeral: '02',
    tags: ['Front of house', 'Monitors', 'Backline'],
    sizes: '(min-width: 1024px) 50vw, (min-width: 768px) 65vw, 80vw',
  },
  'Comedy Shows': {
    img: '/performance-comedy.jpg',
    glow: 'rgba(251,146,60,0.20)',
    tint: 'rgba(251,146,60,0.45)',
    numeral: '03',
    tags: ['Open mic', 'Headliners', 'Club set'],
    sizes: '(min-width: 1024px) 50vw, (min-width: 768px) 65vw, 80vw',
  },
  'Theme Parties': {
    img: '/performance-parties.jpg',
    glow: 'rgba(244,114,182,0.20)',
    tint: 'rgba(244,114,182,0.45)',
    numeral: '04',
    tags: ['Concept', 'Costume', 'Set build'],
    sizes: '(min-width: 1024px) 50vw, (min-width: 768px) 65vw, 80vw',
  },
  'Talent Shows': {
    img: '/performance-talent.jpg',
    glow: 'rgba(212,175,55,0.20)',
    tint: 'rgba(212,175,55,0.45)',
    numeral: '05',
    tags: ['Auditions', 'Semis', 'Grand final'],
    sizes: '(min-width: 1024px) 50vw, (min-width: 768px) 65vw, 80vw',
  },
}

/** Running order of the reel, independent of the data array's order. */
const REEL = [
  'DJ Nights',
  'Live Concerts',
  'Comedy Shows',
  'Theme Parties',
  'Talent Shows',
]

/* -------------------------------------------------------------------------- *
 * The pinned reel
 * -------------------------------------------------------------------------- */

export function StageGallery({ services }: { services: readonly VerticalService[] }) {
  const reduced = usePrefersReducedMotion()

  const frames = REEL.map((t) => services.find((s) => s.title === t)).filter(
    (s): s is VerticalService => Boolean(s) && Boolean(FRAMES[s!.title]),
  )

  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [travel, setTravel] = useState(0)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  })

  /*
    TRAVEL IS MEASURED, NOT GUESSED.

    The usual shortcut is `x: ['0%', '-80%']`, which encodes the card count and
    the viewport width as a constant and is wrong the moment either changes —
    the reel either stops short of the last frame or runs past it into empty
    space. The honest distance is the track's own overflow: how much wider it is
    than the screen. Re-measured on resize, because both terms depend on it.
  */
  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (!track) return
      setTravel(Math.max(0, track.scrollWidth - window.innerWidth))
    }
    measure()
    window.addEventListener('resize', measure)
    /* Photographs settle after first layout and change the track's width. */
    const ro = new ResizeObserver(measure)
    if (trackRef.current) ro.observe(trackRef.current)
    return () => {
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [frames.length])

  /* Springing the OUTPUT keeps the reel gliding a beat behind the wheel, which
     is what reads as weight. Springing the input instead would also delay the
     progress bar and the lighting, so they would lag the picture. */
  const xRaw = useTransform(scrollYProgress, [0, 1], [0, -travel])
  const x = useSpring(xRaw, { stiffness: 120, damping: 28, mass: 0.6 })

  /* Which frame holds the centre. Guarded so this only ever sets state on an
     actual change — scroll fires far faster than the index moves. */
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (frames.length < 2) return
    const next = Math.min(frames.length - 1, Math.max(0, Math.round(v * (frames.length - 1))))
    setActive((prev) => (prev === next ? prev : next))
  })

  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })

  if (frames.length === 0) return null
  const lit = FRAMES[frames[active].title]

  /*
    REDUCED MOTION GETS A REAL LAYOUT, NOT A FROZEN ONE.

    Keeping the 400vh wrapper without the horizontal travel would leave four
    viewports of dead scroll past a motionless frame. The pin is dropped
    entirely and the reel becomes a plain vertical stack.
  */
  if (reduced) {
    return (
      <div className="w-full bg-[#050507] py-20">
        <Header />
        <ul className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
          {frames.map((service, i) => (
            <li key={service.title}>
              <Card service={service} index={i} total={frames.length} reduced />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    /*
      THE PIN IS DESKTOP-ONLY, AND CSS DECIDES — NOT JAVASCRIPT.

      Below `md` the 400vh wrapper collapses to auto, the pin becomes static and
      the reel stacks vertically. On a phone, four viewport-heights of vertical
      scrolling that only move a filmstrip sideways is a tunnel: the page feels
      stuck, and it fights the swipe the user actually expects.

      Expressed as breakpoint classes rather than a `matchMedia` branch on
      purpose. A JS gate would have to pick one arrangement for the server HTML
      and correct itself after hydration, which is a visible jump at whichever
      width guessed wrong. CSS is right on the first paint at every width.

      `travel` then needs no gate either: it is measured as
      `track.scrollWidth - window.innerWidth`, and a column track is never wider
      than the screen, so it resolves to 0 and `x` simply never moves.
    */
    <div ref={wrapRef} className="relative w-full bg-[#050507] md:h-[400vh]" data-reel-wrap>
      <div className="flex flex-col items-center overflow-hidden py-16 md:sticky md:top-0 md:h-screen md:flex-row md:py-0">
        {/* Ambient. Transitions on its own colour so the room changes mood as
            the reel advances rather than cutting between frames. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={{ background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${lit.glow} 0%, transparent 70%)` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/*
          TOP SCRIM, BEHIND THE HEADER.

          The header floats over the filmstrip, so once it clears the navbar it
          sits on photography rather than on the section's own ground. A fade
          from the obsidian gives the type a fixed contrast floor that does not
          depend on which frame happens to be under it — and reads as the top of
          a cinema frame rather than as a panel.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-72"
          style={{
            background:
              'linear-gradient(to bottom, #050507 0%, rgba(5,5,7,0.92) 34%, rgba(5,5,7,0.55) 66%, transparent 100%)',
          }}
        />

        <Header floating />

        {/* ------------------------------ The reel ----------------------------- */}
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-full flex-col items-center gap-8 px-5 md:w-auto md:flex-shrink-0 md:flex-row md:px-12"
          data-reel-track
        >
          {frames.map((service, i) => (
            <Card
              key={service.title}
              service={service}
              index={i}
              total={frames.length}
              active={i === active}
            />
          ))}
        </motion.div>

        {/* --------------------------- Progress HUD --------------------------- */}
        {/* The HUD reports progress through the PIN, so it has nothing to say
            once the reel is an ordinary vertical stack. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 hidden items-center justify-center gap-5 px-12 md:flex">
          <span className="font-mono text-[11px] font-bold tracking-[0.28em] text-white">
            {lit.numeral}
          </span>
          <div className="relative h-px w-40 overflow-hidden bg-white/20 sm:w-64">
            <motion.div
              className="absolute inset-y-0 left-0 w-full origin-left"
              style={{ scaleX: progress, backgroundColor: lit.tint }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-[0.28em] text-white/40">
            {String(frames.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Header
 * -------------------------------------------------------------------------- */

function Header({ floating = false }: { floating?: boolean }) {
  return (
    <header
      className={cn(
        'px-6 text-center',
        floating
          ? /*
              CLEARS THE FIXED NAVBAR.

              The site header is `position: fixed` and 77px tall, and this
              section pins at `top: 0` — so the old `top-10` (40px) put the
              eyebrow underneath the navigation the moment the reel locked into
              place. 96px clears it outright, 112px from `sm` up gives the
              breathing room rather than merely avoiding a collision.
            */
            /* Floats over the reel only where the reel pins. While stacked it
               sits in normal flow above the cards, because an absolutely
               positioned header over an auto-height container would land on
               top of the first frame. */
            'relative z-30 mx-auto max-w-3xl pb-12 md:pointer-events-none md:absolute md:inset-x-0 md:top-24 md:pb-0 lg:top-28'
          : 'mx-auto mb-14 max-w-3xl',
      )}
    >
      <span className="flex items-center justify-center gap-4">
        <span aria-hidden className="h-px w-10 bg-amber-500/40" />
        {/* `pr` matches the tracking: the wide letter-spacing adds a trailing
            gap after the last glyph, which otherwise pushes the label
            off-centre between its two rules. */}
        <span className="pr-[0.3em] text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
          Performances
        </span>
        <span aria-hidden className="h-px w-10 bg-amber-500/40" />
      </span>

      <h2 className="mt-3 font-serif text-[2.25rem] font-bold leading-[1.03] tracking-[-0.03em] text-white sm:text-5xl">
        The Main Stage
      </h2>

      <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] font-light leading-relaxed text-slate-300">
        Five formats, one production standard — sound, light and staging built
        around the room and the crowd it holds.
      </p>
    </header>
  )
}

/* -------------------------------------------------------------------------- *
 * One frame
 * -------------------------------------------------------------------------- */

function Card({
  service,
  index,
  total,
  active = false,
  reduced = false,
}: {
  service: VerticalService
  index: number
  total: number
  active?: boolean
  reduced?: boolean
}) {
  const frame = FRAMES[service.title]

  return (
    <motion.article
      data-frame={index}
      data-active={active}
      initial={false}
      animate={{
        borderColor: active && !reduced ? frame.tint : 'rgba(255,255,255,0.15)',
        scale: active || reduced ? 1 : 0.96,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.55)',
      }}
      /*
        THE BORDER AND GLOW GO THROUGH FRAMER, NOT THROUGH `hover:` CLASSES.

        `animate` writes `border-color` as an INLINE style, and an inline style
        beats any class — a Tailwind `hover:border-amber-500/30` here would be
        silently overridden and never appear. `whileHover` overrides only the
        keys it names, so `scale` keeps following the scroll-driven active state
        underneath and reverts cleanly on unhover.
      */
      whileHover={
        reduced
          ? undefined
          : {
              borderColor: 'rgba(245,158,11,0.55)',
              boxShadow:
                '0 20px 50px rgba(245,158,11,0.15), 0 30px 70px -20px rgba(0,0,0,0.85)',
            }
      }
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        /* `group` is what lets the image and the HUD react — without it every
           `group-hover:` below is inert. */
        'group relative flex-shrink-0 overflow-hidden rounded-3xl border',
        reduced
          ? 'aspect-[16/10] w-full'
          : /* Full-width 16:10 while stacked, the tall cinema frame once the
               pin engages at `md`. A 70vh card on a phone leaves almost no
               room for the caption block pinned to its foot. */
            'aspect-[16/10] w-full md:aspect-auto md:h-[70vh] md:w-[65vw] lg:w-[50vw]',
      )}
    >
      <Image
        src={frame.img}
        alt={service.title}
        fill
        sizes={frame.sizes}
        quality={90}
        priority={index === 0}
        /* No brightness filter and no full-frame scrim — the picture renders
           untouched. Legibility is bought by the HUD's own frosted panel, which
           covers only the corner it occupies. */
        /* CSS, not framer: nothing writes an inline transform to the <img>, so
           a class works here where it would not on the article. */
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* A whisper of vignette at the edges only, so the rounded corners read
          as a frame rather than a crop. The centre stays untouched. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* ------------------------------ Glass HUD ---------------------------- */}
      <div className="absolute bottom-6 left-6 right-6 z-20 max-w-lg rounded-2xl border border-white/20 bg-black/60 p-6 backdrop-blur-xl transition-[transform,border-color,backdrop-filter,background-color] duration-500 ease-out group-hover:-translate-y-2 group-hover:border-amber-500/30 group-hover:bg-black/70 group-hover:backdrop-blur-2xl sm:bottom-8 sm:left-8 sm:p-8 md:right-auto">
        <span className="flex flex-wrap items-center gap-2">
          {frame.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/85"
            >
              {tag}
            </span>
          ))}
        </span>

        <h3 className="mt-4 font-serif text-[1.75rem] font-bold leading-[1.05] tracking-[-0.025em] text-white sm:text-[2.25rem]">
          {service.title}
        </h3>

        <p className="mt-2.5 text-[0.875rem] font-normal leading-[1.6] text-slate-200">
          {service.desc}
        </p>

        <span
          className="mt-4 flex items-center gap-3 font-mono text-[10px] font-bold tracking-[0.28em]"
          style={{ color: frame.tint.replace('0.45', '1') }}
        >
          {frame.numeral}
          <span aria-hidden className="h-px w-8" style={{ backgroundColor: frame.tint }} />
          <span className="text-white/35">{String(total).padStart(2, '0')}</span>
        </span>
      </div>
    </motion.article>
  )
}
