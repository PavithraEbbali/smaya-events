'use client'

import Image from 'next/image'
import { motion, useTransform, type MotionValue } from 'framer-motion'

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
          Below `lg` these now render in HeroCardsStatic at ~82vw, so the old
          `1px` hint is actively wrong — it was correct only while the column
          was `hidden lg:block` and phones genuinely never saw these images.
          Leaving it would ship a 1px-wide candidate stretched across most of
          the screen.
        */
        sizes="(min-width: 1024px) 512px, 82vw"
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
 * from the hero's 300vh track, and that track is `lg:h-[300vh]` — on a phone the
 * hero is a single viewport, so `progress` never advances and all three cards
 * would sit frozen on top of one another. That is why the column was
 * `hidden lg:block`, and why the cards were simply absent on mobile rather than
 * merely restyled.
 *
 * So mobile gets a different mechanism for the same content: a swipeable strip,
 * one card at a time with the next peeking. No scroll coupling, no transforms
 * to drive — the browser's own scrolling does the work, which is also why it
 * cannot get out of step with the page the way a pinned track can.
 * -------------------------------------------------------------------------- */

export function HeroCardsStatic() {
  return (
    <ul
      /* `scroll-px-6` matches the hero's own gutter so a snapped card lines up
         with the headline above it rather than hugging the screen edge. */
      className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {[TOP, MIDDLE, BOTTOM].map((card) => (
        <li
          key={card.index}
          className="relative aspect-[4/3] w-[82%] shrink-0 snap-start"
        >
          <div className={FRAME}>
            <CardFace card={card} />
          </div>
        </li>
      ))}
    </ul>
  )
}
