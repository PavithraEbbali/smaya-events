'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { loadGsap } from '@/lib/gsap'
import { usePrefersReducedMotion } from '@/lib/hooks'

const BlackHoleTransition = dynamic(
  () => import('@/components/ui/BlackHoleTransition'),
  { ssr: false },
)

/**
 * Module scope, deliberately — NOT sessionStorage. A full page reload is a
 * genuine "initial page load" and should replay the sequence; only a
 * client-side navigation back to Home should skip it. A module flag resets on
 * reload and survives route changes, which is exactly that distinction.
 */
let introPlayed = false

/* ---- Timeline (ms from start) -------------------------------------------
   0     monogram sweeps in behind closed doors, gold ring draws around it
   620   doors begin parting, monogram starts collapsing inward
   1340  black-hole gravity well: motes spiral in, then burst
   ~2560 settled
   The headline assembles under the burst rather than after it, so the
   perceived wait is shorter than the timeline suggests.
-------------------------------------------------------------------------- */
const MONOGRAM_MS = 620
const DOOR_MS = 900
const BLACK_HOLE_AT = 1340

/**
 * Hard ceiling on the whole sequence. The doors cover the hero until they
 * part, so if GSAP fails to load, the ticker never runs, or a tween is
 * interrupted, this tears the overlay down anyway rather than leaving the
 * page behind a closed curtain.
 */
const WATCHDOG_MS = 4200

/** Delay (seconds) the hero copy should wait before entering. */
export const INTRO_COPY_DELAY = 1.6
export const NO_INTRO_COPY_DELAY = 0.1

export type IntroDecision = 'pending' | 'play' | 'skip'

/**
 * useLayoutEffect on the client, useEffect on the server.
 *
 * The curtain hook below HAS to run before paint — with a plain useEffect the
 * browser can paint the frame where the doors first appear but the header has
 * not hidden yet, which is exactly the flash being fixed. React warns if
 * useLayoutEffect is called during a server render, hence the swap.
 */
const useBeforePaint =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Decides — once, on the client — whether the opening sequence runs. Hero reads
 * this too, so its copy delay is fixed from the first resolved render.
 */
export function useIntroDecision(): IntroDecision {
  const reduced = usePrefersReducedMotion()
  const [decision, setDecision] = useState<IntroDecision>('pending')

  useEffect(() => {
    if (decision !== 'pending') return
    if (reduced || introPlayed) {
      setDecision('skip')
      return
    }
    introPlayed = true
    setDecision('play')
  }, [reduced, decision])

  return decision
}

export function HeroIntro({ decision }: { decision: IntroDecision }) {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const [blackHole, setBlackHole] = useState(false)
  const [finished, setFinished] = useState(false)

  const playing = decision === 'play' && !finished

  /*
    Hide the site chrome behind the curtain.

    The overlay is z-[60] but it is INSIDE the hero section, and the header is
    fixed at the document level — so the header wins regardless of the number,
    and the nav rendered straight over the closed doors. Rather than escalate a
    z-index war across a stacking context, the intro states plainly that it is
    running and globals.css hides [data-site-header] while it is.

    Written to <html>, not to a React context: the header lives in the layout
    and the intro lives in the page, so there is no shared provider between
    them, and threading one through would make every route pay for a sequence
    only Home plays.

    FAILS OPEN. The attribute is only ever ADDED by this component, and the
    cleanup removes it on unmount — so without JS, or if this component never
    mounts, the header is simply visible. The watchdog in the effect below
    already guarantees `finished` flips even if GSAP never loads, which tears
    the attribute down with it.
  */
  useBeforePaint(() => {
    if (!playing) return
    const root = document.documentElement
    root.dataset.intro = 'playing'
    return () => {
      delete root.dataset.intro
    }
  }, [playing])

  useEffect(() => {
    if (decision !== 'play') return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const watchdog = window.setTimeout(() => {
      if (!cancelled) setFinished(true)
    }, WATCHDOG_MS)

    loadGsap().then(({ gsap }) => {
      if (cancelled || !leftRef.current || !rightRef.current) return

      const tl = gsap.timeline()

      // 1. Monogram sweeps in — a clip-path wipe up the artwork, which is a
      //    raster file, paired with a real stroke-dasharray draw on the ring.
      tl.fromTo(
        markRef.current,
        { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0, scale: 0.94 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          scale: 1,
          duration: MONOGRAM_MS / 1000,
          ease: 'power3.out',
        },
      )

      if (ringRef.current) {
        const len = ringRef.current.getTotalLength()
        gsap.set(ringRef.current, {
          strokeDasharray: len,
          strokeDashoffset: len,
        })
        tl.to(
          ringRef.current,
          { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' },
          0.1,
        )
      }

      // 2. Doors part to uncover the hero.
      tl.to(
        [leftRef.current, rightRef.current],
        {
          xPercent: (i: number) => (i === 0 ? -101 : 101),
          duration: DOOR_MS / 1000,
          ease: 'power4.inOut',
        },
        MONOGRAM_MS / 1000,
      )

      // 3. The monogram collapses toward the centre — the well takes it.
      tl.to(
        markRef.current,
        { scale: 0.1, opacity: 0, rotate: 25, duration: 0.6, ease: 'power3.in' },
        (BLACK_HOLE_AT - 260) / 1000,
      )

      const holeTimer = window.setTimeout(
        () => !cancelled && setBlackHole(true),
        BLACK_HOLE_AT,
      )

      cleanup = () => {
        tl.kill()
        window.clearTimeout(holeTimer)
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(watchdog)
      cleanup?.()
    }
  }, [decision])

  if (!playing) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[60] overflow-hidden"
    >
      {/* Doors */}
      <div className="absolute inset-0 flex">
        <div
          ref={leftRef}
          className="relative h-full w-1/2 bg-gradient-to-br from-smaya-charcoal via-smaya-plum-deep to-smaya-charcoal will-change-transform"
        >
          <span className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-smaya-gold/70 to-transparent" />
        </div>
        <div
          ref={rightRef}
          className="relative h-full w-1/2 bg-gradient-to-bl from-smaya-charcoal via-smaya-plum-deep to-smaya-charcoal will-change-transform"
        >
          <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-smaya-gold/70 to-transparent" />
        </div>
      </div>

      {/*
        Monogram + drawn ring, above the doors so the well can swallow it.

        CENTRED ON THE VIEWPORT, NOT ON THE STAGE — measured, not guessed.

        This used to be `inset-0`, which centres inside the positioned ancestor:
        the hero's `min-h-[100svh]` stage. On a phone that stage GROWS past its
        minimum once the headline, tagline, CTA and explore link stack up — 924px
        against an 812px viewport at 375 — so `place-items-center` was centring
        in a box 112px taller than the screen and the monogram sat 56px BELOW the
        optical centre. It reads as a skew because the door seam beside it is
        genuinely centred, so the two disagree.

        Pinning the box to `top-0 h-[100svh]` makes the centre the middle of what
        the visitor can actually see. The doors keep `inset-0` — they SHOULD
        cover the whole stage.

        Desktop is unaffected: from `lg` the stage is `h-svh` exactly, so this
        box and the old one are the same rectangle.
      */}
      <div className="absolute inset-x-0 top-0 z-[5] grid h-[100svh] place-items-center">
        <div ref={markRef} className="relative opacity-0 will-change-transform">
          <svg
            viewBox="0 0 160 160"
            className="absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 sm:h-[190px] sm:w-[190px]"
            fill="none"
          >
            <circle
              ref={ringRef}
              cx="80"
              cy="80"
              r="74"
              stroke="var(--color-smaya-gold)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
          <Image
            src="/logo/smaya-monogram-light.png"
            alt=""
            width={104}
            height={104}
            priority
            className="h-[76px] w-[76px] sm:h-[104px] sm:w-[104px]"
          />
        </div>
      </div>

      <BlackHoleTransition
        active={blackHole}
        onComplete={() => setFinished(true)}
      />
    </div>
  )
}
