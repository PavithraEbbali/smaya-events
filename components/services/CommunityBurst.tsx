'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { animate, motion, useMotionValue, type Variants } from 'framer-motion'

import type { VerticalService } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { useCoarsePointer, usePrefersReducedMotion } from '@/lib/hooks'


/* -------------------------------------------------------------------------- *
 * Card data
 *
 * Keyed by service title to stay aligned with data/verticals.ts — an index
 * would silently pair the wrong photograph with the wrong circle the moment
 * anyone reorders that array.
 *
 * FILENAMES ARE KEBAB-CASE AND LOWERCASE ON PURPOSE. The originals arrived as
 * `Apartment events.jpeg` etc. — spaces need percent-encoding in a URL, and a
 * capitalised path resolves on Windows (case-insensitive) but 404s on the Linux
 * host that serves production. Both bugs are silent locally, which is the worst
 * place for them to hide.
 * -------------------------------------------------------------------------- */

type Card = {
  img: string
  /** Tints the numeral, icon and hover bloom. */
  accent: string
}

const CARDS: Record<string, Card> = {
  'Apartment Events': { img: '/community-apartment-events.jpg', accent: '#BAE6FD' },
  'Women Meetups': { img: '/community-women-meetups.jpg', accent: '#FBCFE8' },
  'Pet Meetups': { img: '/community-pet-meetups.jpg', accent: '#FED7AA' },
  'Family Days': { img: '/community-family-days.jpg', accent: '#C7D2FE' },
  Festivals: { img: '/community-festivals.jpg', accent: '#E9D5FF' },
}

/* -------------------------------------------------------------------------- *
 * Motion configuration
 * -------------------------------------------------------------------------- */

/** How far above its slot a coin starts. */
const DROP_FROM = -420

/**
 * The coin drop.
 *
 * The brief asks for `bounce: 0.4` alongside `damping: 12, mass: 1.2`, but
 * framer reads a spring EITHER as physics (stiffness/damping/mass) OR as
 * duration-and-bounce — mixing the two lets one silently win. So the bounce is
 * converted to the physics that produce it and passed as one coherent set:
 *
 *   bounce 0.4  ->  damping ratio Z ~= 0.6
 *   Z = damping / (2 * sqrt(stiffness * mass))
 *   0.6 = 12 / (2 * sqrt(k * 1.2))   ->   k ~= 83
 *
 * Same felt result, no ambiguity about which branch framer took.
 */
const COIN_DROP = {
  type: 'spring' as const,
  stiffness: 83,
  damping: 12,
  mass: 1.2,
}

/** One turn. Eased, never sprung — a bouncy spin reads as a wobble. */
const SPIN_SECONDS = 0.85
const SPIN_EASE = [0.65, 0, 0.35, 1] as const

/** The reveal. Quick enough to feel simultaneous with the spin starting. */
const FADE = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

/* Parent/child variant pair. The parent names the state; every child resolves
   its own `rest` and `hover` under that name, which is what lets one hover
   drive the overlay, icon, numeral and copy together. */
const CONTENT: Variants = {
  rest: { opacity: 0, transition: FADE },
  hover: { opacity: 1, transition: FADE },
}

/* -------------------------------------------------------------------------- *
 * Section
 * -------------------------------------------------------------------------- */

export function CommunityBurst({ services }: { services: readonly VerticalService[] }) {
  const items = services.filter((s) => CARDS[s.title])
  const reduced = usePrefersReducedMotion()
  /*
    HIDING THE COPY BEHIND HOVER IS A DESKTOP-ONLY IDEA.

    A touch device has no hover, so on a phone the brief's default state is five
    unlabelled photographs — the titles, descriptions and numbers would never
    appear at all. `pointer: fine` is the honest test for "this input can
    hover"; where it cannot, the content is simply shown. The reveal is an
    enhancement for pointers, never the only route to the words.
  */
  const isTouch = useCoarsePointer()

  return (
    <motion.ul
      initial={reduced ? false : 'dropped'}
      whileInView="settled"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        dropped: {},
        settled: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
      }}
      className="relative flex flex-wrap items-start justify-center gap-x-6 gap-y-8 sm:gap-x-10 sm:gap-y-12"
    >
      {items.map((service, i) => (
        <Coin
          key={service.title}
          service={service}
          index={i}
          reduced={reduced}
          isTouch={isTouch}
        />
      ))}
    </motion.ul>
  )
}

/* -------------------------------------------------------------------------- *
 * One coin
 * -------------------------------------------------------------------------- */

function Coin({
  service,
  index,
  reduced,
  isTouch,
}: {
  service: VerticalService
  index: number
  reduced: boolean
  isTouch: boolean
}) {
  const card = CARDS[service.title]
  const Icon = getIcon(service.icon)

  /*
    THE SPIN IS A MOTION VALUE, NOT A VARIANT — and that is the one deviation
    from the brief's structure, for a reason worth stating.

    As a variant pair (`rest: rotate 0`, `hover: rotate 360`) framer animates
    360 -> 0 on mouse-leave, so the card visibly spins BACKWARDS every time the
    cursor departs. Setting the rest transition to zero duration fixes that but
    snaps if the pointer leaves mid-turn.

    Driven imperatively the turn always completes, then the value is SET to 0
    without animating. 360° and 0° are the same picture, so nothing moves — the
    rotation is genuinely back at 0 and the interaction repeats cleanly, which
    is what the brief asks for, with no reverse and no snap in any case.

    The CONTENT still uses the parent/child variant orchestration the brief
    describes; only the rotation is imperative.
  */
  const rotate = useMotionValue(0)
  const spinning = useRef(false)

  const spin = () => {
    if (reduced || spinning.current) return
    spinning.current = true
    animate(rotate, 360, { duration: SPIN_SECONDS, ease: SPIN_EASE }).then(() => {
      rotate.set(0)
      spinning.current = false
    })
  }

  return (
    <motion.li
      data-coin={index}
      className="w-[13.5rem] shrink-0 sm:w-[15rem] lg:w-[16.5rem]"
      /* No initial/animate of its own — the list names the state and this
         resolves its own drop under it. */
      variants={{
        dropped: { y: DROP_FROM, opacity: 0 },
        settled: { y: 0, opacity: 1, transition: COIN_DROP },
      }}
    >
      <motion.div
        onHoverStart={spin}
        data-reveal={isTouch ? 'always' : 'hover'}
        /*
          `initial` IS ALWAYS "rest" — it must not depend on `canHover`.

          `useMediaQuery` starts false and corrects itself in an effect, so a
          canHover-derived `initial` is computed from the WRONG value on the
          first render: every card mounted with its content at opacity 1 and
          then faded out once the query resolved. On screen that is a flash of
          all five cards' copy on every page load.

          Pinning `initial` to "rest" makes the first paint the hidden state on
          every device. A pointer then stays there with nothing to animate, and
          touch — which genuinely needs the words, having no hover — fades them
          in just after mount. The fallback if the query never resolves is
          content-hidden on a pointer, which is exactly the design.
        */
        /*
          REMOUNTED WHEN THE POINTER TYPE RESOLVES.

          `initial` is only read once, so a component mounted as "rest" can
          reach the revealed state only by ANIMATING there — and on touch that
          makes the titles, the only copy those users get, dependent on an
          animation actually running. Keying on the pointer type remounts the
          subtree the moment the query settles, so touch mounts already showing
          its content, with nothing to animate and nothing to fail.

          A pointer device never re-keys: it renders "rest" from the first paint
          and stays there, so there is no flash and no wasted remount.
        */
        key={isTouch ? 'touch' : 'pointer'}
        initial={isTouch ? 'hover' : 'rest'}
        animate={isTouch ? 'hover' : 'rest'}
        whileHover={isTouch ? undefined : 'hover'}
        style={{ rotate }}
        className="relative aspect-square w-full cursor-default overflow-hidden rounded-full"
      >
        {/* The photograph. The ONLY thing visible at rest — everything below it
            starts at opacity 0. */}
        <Image
          src={card.img}
          alt={service.title}
          fill
          sizes="(min-width: 1024px) 264px, (min-width: 640px) 240px, 216px"
          className="object-cover"
        />

        {/* Contrast floor. Hidden at rest, so the picture is unobstructed; it
            fades in with the copy so the copy always lands on it, never on the
            bare photograph. */}
        <motion.span
          aria-hidden
          variants={CONTENT}
          className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/75 to-black/90"
        />

        {/* Accent bloom, same timing. */}
        <motion.span
          aria-hidden
          variants={CONTENT}
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 100%, ${card.accent}26 0%, transparent 62%)`,
            boxShadow: `inset 0 0 0 1px ${card.accent}55`,
          }}
        />

        {/* ------------------------------ Content ----------------------------- */}
        {/* One wrapper carries the variant for the whole block, so the numeral,
            icon, title and copy arrive as a single object rather than four
            things fading at slightly different moments. */}
        <motion.div
          variants={CONTENT}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-[14%] text-center"
        >
          <span
            aria-hidden
            className="font-mono text-[10px] font-bold tracking-[0.28em]"
            style={{ color: card.accent }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <Icon
            size={28}
            strokeWidth={1.7}
            aria-hidden
            className="sm:h-8 sm:w-8"
            style={{ color: card.accent }}
          />

          <h3 className="font-serif text-[1.0625rem] font-black leading-tight tracking-[-0.01em] text-white sm:text-[1.1875rem]">
            {service.title}
          </h3>

          <p className="text-[0.75rem] font-medium leading-[1.45] text-white/90 sm:text-[0.8125rem]">
            {service.desc}
          </p>
        </motion.div>
      </motion.div>
    </motion.li>
  )
}
