'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'

import { usePrefersReducedMotion } from '@/lib/hooks'

type Card = {
  index: string
  label: string
  caption: string
  src: string
}

/*
  All three Unsplash IDs are already in use elsewhere on this site (the fitness,
  corporate and celebrations vertical heroes), so they are known to resolve and
  are covered by the existing images.unsplash.com entry in next.config.mjs.
  Do not invent plausible-looking Unsplash IDs — that ships 404s that only
  surface in production.
*/
const BOTTOM: Card = {
  index: '01',
  label: 'Fitness & Wellness',
  caption: 'Festivals & retreats',
  src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=70',
}

const MIDDLE: Card = {
  index: '02',
  label: 'Corporate',
  caption: 'Conferences & launches',
  src: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&w=1000&q=70',
}

const TOP: Card = {
  index: '03',
  label: 'Celebrations',
  caption: 'Weddings & sangeeths',
  src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=70',
}

const FRAME =
  'absolute inset-0 overflow-hidden rounded-lg border border-[#D4AF37]/50 shadow-2xl bg-[#160624] will-change-transform'

/** Photo, legibility scrim, inset rule, caption. */
function CardFace({ card }: { card: Card }) {
  return (
    <>
      <Image
        src={card.src}
        alt=""
        fill
        /*
          Below `lg` these render full-width in HeroCardsStatic. The hint was `1px`
          originally, which was correct only while the column was
          `hidden lg:block` and phones genuinely never saw these images — left
          alone it would ship a 1px-wide candidate stretched across two-thirds
          of the screen.
        */
        sizes="(min-width: 1024px) 512px, 92vw"
        loading="eager"
        className="object-cover"
      />

      {/* Bottom gradient. Deep enough that the gold caption holds even on the
          lightest frames — the celebrations photo is high-key and washed the
          text out at a shallower ramp. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#160624]/95 via-[#160624]/45 to-transparent"
      />

      {/* Inset rule — what makes the card read as mounted rather than as a
          cropped photograph. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 z-20 border border-[#D4AF37]/60"
      />

      <div className="absolute bottom-6 left-6 z-30">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          {card.index} / {card.label}
        </p>
        <p className="font-serif text-xl tracking-wide text-white">
          {card.caption}
        </p>
      </div>
    </>
  )
}

/**
 * Three cards that peel apart as the hero's scroll track advances.
 *
 * Takes `progress` rather than owning a `useScroll`: the track is the hero
 * <section> itself — it has to be, because the background layers and the stats
 * bar live inside the same sticky viewport — so the ref and the scroll hook
 * live there and this stays presentational.
 *
 * EVERY TRANSFORM IS FRAMER'S. There are deliberately no Tailwind `rotate-*` or
 * `translate-*` utilities on these cards. Tailwind v4 compiles those to the
 * discrete `rotate:` / `translate:` CSS properties, which compose with framer's
 * `transform:` rather than replacing it — so a static offset silently ADDS to
 * the animated one and the resting fan drifts. Keeping all of it in the motion
 * style means one source of truth for where a card sits.
 *
 * The rest state at progress 0 is the fanned stack (y 0/20/40, scale
 * 1/0.95/0.9, rotate 0/3/-4), so if the scroll never advances — reduced motion,
 * framer failing, the track collapsed on mobile — what remains is the intended
 * composition rather than an empty or half-peeled deck.
 */
export function ScrollRevealCards({
  progress,
}: {
  progress: MotionValue<number>
}) {
  /* Card 03 — top. Dealt away first: up, right, and tilting as it goes. */
  const topX = useTransform(progress, [0, 0.33], [0, 400])
  const topY = useTransform(progress, [0, 0.33], [0, -400])
  const topRotate = useTransform(progress, [0, 0.33], [0, 15])
  const topOpacity = useTransform(progress, [0, 0.2, 0.33], [1, 0.5, 0])
  const topScale = useTransform(progress, [0, 0.33], [1, 0.9])

  /* Card 02 — middle. Rises to primary, holds, then follows the same arc. */
  const midX = useTransform(progress, [0, 0.33, 0.66], [0, 0, 400])
  const midY = useTransform(progress, [0, 0.33, 0.66], [20, 0, -400])
  const midRotate = useTransform(progress, [0, 0.33, 0.66], [3, 0, 15])
  const midOpacity = useTransform(progress, [0.33, 0.53, 0.66], [1, 0.5, 0])
  const midScale = useTransform(progress, [0, 0.33, 0.66], [0.95, 1, 1.05])

  /* Card 01 — bottom. Rises to primary and stays. */
  const bottomY = useTransform(progress, [0, 0.33, 0.66, 1], [40, 20, 0, 0])
  const bottomScale = useTransform(progress, [0, 0.33, 0.66, 1], [0.9, 0.95, 1, 1])
  const bottomRotate = useTransform(progress, [0, 0.33, 0.66], [-4, -2, 0])

  /*
    The max-w below is height-aware, not the flat `max-w-lg` it used to be.

    The deck is the tallest thing in the hero grid, and the hero lives inside an
    `overflow-hidden` viewport exactly one screen tall — so at 512px wide it was
    384px tall and, with the copy and the stats bar, demanded a 630px viewport
    MINIMUM. Anything shorter sliced the stats bar in half.

    Capping the WIDTH by viewport height is what keeps `aspect-[4/3]` intact:
    69.3svh of width is 52svh of height. `min()` means 32rem (the old max-w-lg)
    still wins on any viewport taller than ~740px, so the common case renders
    identically — this only engages on short laptops.
  */
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[min(32rem,69.3svh)] [perspective:1000px]">
      {/* Bottom — z-10 */}
      <motion.div
        style={{ y: bottomY, scale: bottomScale, rotate: bottomRotate }}
        className={`${FRAME} z-10`}
      >
        <CardFace card={BOTTOM} />
      </motion.div>

      {/* Middle — z-20 */}
      <motion.div
        style={{
          x: midX,
          y: midY,
          scale: midScale,
          rotate: midRotate,
          opacity: midOpacity,
        }}
        className={`${FRAME} z-20`}
      >
        <CardFace card={MIDDLE} />
      </motion.div>

      {/* Top — z-30 */}
      <motion.div
        style={{
          x: topX,
          y: topY,
          scale: topScale,
          rotate: topRotate,
          opacity: topOpacity,
        }}
        className={`${FRAME} z-30`}
      >
        <CardFace card={TOP} />
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Mobile deck
 *
 * The scroll-driven version above cannot work below `lg`: it reads its progress
 * from the hero's 300vh track, and that track is `lg:h-[300vh]`, so on a phone
 * `progress` never advances and all three cards would sit frozen on top of one
 * another. Mobile therefore needs its own mechanism for the same content.
 *
 * IT IS A FULL-WIDTH SNAP DECK, AND THE WIDTH IS THE WHOLE POINT.
 *
 * Two earlier attempts clipped their captions. A peeking strip (82vw) leaves the
 * neighbour sliced at the viewport edge, and a continuous marquee is worse
 * because EVERY card is mid-transit — that is what cut "…estivals & retreats"
 * and "Weddin…". Both were legible only by accident of timing.
 *
 * At `w-full` + `snap-center` a settled card occupies the entire track, so its
 * caption, index and image are whole by construction rather than by luck. The
 * dots below carry the affordance the peek used to provide, and they are real
 * buttons, so the deck is operable without a swipe.
 * -------------------------------------------------------------------------- */

const DECK = [TOP, MIDDLE, BOTTOM]

/**
 * Dwell time per card.
 *
 * 1000ms is a deliberate choice by the site owner over the 4500ms this shipped
 * with. Worth knowing what it costs: the smooth scroll between cards takes
 * roughly 300-400ms of that second, so each card is actually still for about
 * 600ms — enough to register an image, not enough to read "03 / Celebrations —
 * Weddings & sangeeths". The deck reads as motion rather than as content at
 * this speed.
 *
 * It stays accessible regardless: touch, hover and focus all pause it, and
 * prefers-reduced-motion switches it off, which is what WCAG 2.2.2 asks of
 * anything that auto-updates.
 */
const AUTO_ADVANCE_MS = 1000

export function HeroCardsStatic() {
  const trackRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = usePrefersReducedMotion()

  /* Index from scroll position rather than from a timer, so the dots can never
     disagree with what is on screen. Guarded so it only sets state on an actual
     change — scroll fires far faster than the index moves. */
  const syncActive = () => {
    const el = trackRef.current
    if (!el) return
    const next = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
    setActive((prev) =>
      prev === next ? prev : Math.min(DECK.length - 1, Math.max(0, next)),
    )
  }

  const goTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  /*
    AUTO-ADVANCE.

    THE TICK READS `scrollLeft`, IT DOES NOT READ `active`, and that is the
    whole design. Depending on `active` would put it in the dependency array,
    so every advance would tear down and recreate the interval — restarting the
    countdown from zero on each step and, worse, on every stray scroll event
    that nudged the index. Reading the DOM at tick time keeps one stable timer
    and makes drift between the timer and the carousel impossible.

    `document.hidden` is checked inside the tick rather than through a
    visibilitychange listener: browsers already throttle background intervals to
    roughly once a minute, so the only thing left to prevent is advancing while
    nobody is looking, and one boolean does that without a second subscription.

    Reduced motion switches it off entirely. An auto-rotating carousel is
    exactly the kind of unrequested movement that setting exists to stop, and
    the deck stays fully usable by swipe and by the dots.
  */
  useEffect(() => {
    if (paused || reduced) return

    const id = window.setInterval(() => {
      const el = trackRef.current
      if (!el || document.hidden) return
      const width = Math.max(1, el.clientWidth)
      const next = (Math.round(el.scrollLeft / width) + 1) % DECK.length
      el.scrollTo({ left: next * width, behavior: 'smooth' })
    }, AUTO_ADVANCE_MS)

    return () => window.clearInterval(id)
  }, [paused, reduced])

  return (
    /*
      Pause covers pointer, touch and keyboard, because "don't move while I am
      engaged" means all three. `onFocusCapture` is on the wrapper rather than
      the buttons so focus anywhere inside — including a dot reached by Tab —
      holds the deck still.
    */
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      /* Resume only once the momentum scroll has settled; resuming on touchend
         would fight the flick the reader just made. */
      onTouchEnd={() => window.setTimeout(() => setPaused(false), 2500)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <ul
        ref={trackRef}
        onScroll={syncActive}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {DECK.map((card) => (
          <li
            key={card.index}
            className="relative aspect-[16/10] w-full shrink-0 snap-center"
          >
            <div className={FRAME}>
              <CardFace card={card} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-center gap-2">
        {DECK.map((card, i) => (
          <button
            key={card.index}
            type="button"
            data-tap
            onClick={() => goTo(i)}
            aria-label={`Show ${card.label}`}
            aria-current={i === active ? 'true' : undefined}
            /* 24x44 — WCAG 2.5.8's minimum width with the vertical dimension
               doing the ergonomic work, the same trade the services carousel
               dots make. */
            className="flex h-11 w-6 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            <span
              aria-hidden
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/35'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
