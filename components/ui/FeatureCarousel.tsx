'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Image from 'next/image'
import {
  AnimatePresence,
  motion,
  type PanInfo,
  type Transition,
} from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useMobileViewport, usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Slide = {
  key: string
  label: string
  /** Image echoed behind the carousel as an out-of-focus wash. */
  ambient?: string
  /** `spotlight` is true only for the centred slide. */
  render: (spotlight: boolean) => ReactNode
}

type Props = {
  slides: readonly Slide[]
  /** Names the region for assistive tech, e.g. "Celebration services". */
  label: string
  className?: string
}

/**
 * How far a neighbouring slide sits from the centre, as a fraction of the
 * slide's own width.
 *
 * Below 1 the neighbours sit PARTLY BEHIND the active slide and peek out at
 * its edges, which is the look this is modelled on. It is also what keeps them
 * inside the section: at a full slide-width step they would push past the white
 * panel on a 1024px screen.
 */
const STEP_RATIO = 0.58
/**
 * How many slides either side of the active one are mounted.
 *
 * One. At two, the far slide sits 2 x STEP out and measured 25px past the white
 * section's edge at 1280 — faint at low opacity, but a card edge floating on
 * the page background all the same.
 */
const WINDOW = 1
/** One wheel gesture moves one slide, however hard it is flicked. */
const WHEEL_LOCK_MS = 500

/**
 * The mobile "burst" entrance.
 *
 * Stiff and lightly damped on purpose — 400/25 overshoots slightly before it
 * settles, and that overshoot is what reads as a pop rather than a fade.
 */
const BURST: Transition = { type: 'spring', stiffness: 400, damping: 25 }

/** Dwell per card while auto-advancing on mobile. */
const AUTO_ADVANCE_MS = 2000
/** How long a manual tap holds the carousel still before it resumes. */
const AUTO_RESUME_MS = 8000

/**
 * A centre-focused carousel: one prominent slide, its neighbours scaled back
 * and dimmed behind it, driven by wheel, drag, buttons or keyboard.
 *
 * NOTHING CLIPS THE ACTIVE SLIDE. The stage clips horizontally so a peeking
 * neighbour cannot push the page wide, and nothing else clips at all — see the
 * notes on the stage and the track.
 */
export function FeatureCarousel({ slides, label, className }: Props) {
  const [active, setActive] = useState(0)
  const [metrics, setMetrics] = useState({ step: 0, height: 0 })
  const metricsRef = useRef(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduced = usePrefersReducedMotion()
  const isMobile = useMobileViewport()

  const count = slides.length

  /*
    Manual interaction suspends the auto-advance. `paused` is a timestamp-free
    boolean cleared by a timeout, so a reader who taps an arrow gets a clear
    window to read before the carousel starts moving again.
  */
  const [paused, setPaused] = useState(false)
  const resumeTimer = useRef<number | undefined>(undefined)

  const suspendAuto = useCallback(() => {
    setPaused(true)
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current)
    resumeTimer.current = window.setTimeout(() => setPaused(false), AUTO_RESUME_MS)
  }, [])

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current)
    },
    [],
  )

  const go = useCallback(
    (next: number) => {
      /* Clamped, NOT wrapped — this is the manual path and it is shared with
         desktop, where the end-stop and the disabled arrow are the existing
         behaviour. Only the timer below wraps. */
      setActive(Math.max(0, Math.min(count - 1, next)))
      suspendAuto()
    },
    [count, suspendAuto],
  )

  /*
    AUTO-ADVANCE — MOBILE ONLY.

    `window.innerWidth < 768` is checked INSIDE the tick rather than in the
    dependency array, for the same reason the hero deck reads scrollLeft at tick
    time: a width in the deps would tear down and rebuild the interval on every
    resize frame, and a stale closure would otherwise keep the desktop decision
    from first render forever.

    It WRAPS where the arrows clamp. An auto-advance that stops dead on the last
    slide is worse than none — it looks broken rather than finished — and the
    brief asks for cards that cycle. The manual arrows keep their end-stops, so
    desktop behaviour is untouched.

    Reduced motion switches it off entirely: this is unrequested movement, which
    is exactly what that setting exists to stop.
  */
  useEffect(() => {
    if (paused || reduced || count < 2) return

    const id = window.setInterval(() => {
      if (document.hidden || window.innerWidth >= 768) return
      setActive((prev) => (prev + 1) % count)
    }, AUTO_ADVANCE_MS)

    return () => window.clearInterval(id)
  }, [paused, reduced, count])

  /*
    The FIRST positioning must not animate.

    `step` is 0 until the slide has been measured, so the first render puts every
    slide at x: 0 — stacked. The measured render then moves them out, and framer
    treats that as a transition, so the carousel would visibly deal itself open
    on every page load. This ref makes that one change instant and lets every
    change after it spring. It is flipped in an effect, deliberately after the
    render that reads it.
  */
  const settled = useRef(false)
  useEffect(() => {
    if (metricsRef.current > 0) settled.current = true
  })

  /*
    The step and the track height are MEASURED, not assumed.

    Slides are absolutely positioned so they can overlap, which means the track
    has no intrinsic height and the horizontal step cannot be a constant — the
    slide width is responsive and the cards are different heights, and they grow
    again when one is opened. A ResizeObserver on the active slide keeps both in
    step with whatever it is currently doing.
  */
  useLayoutEffect(() => {
    const el = slideRefs.current[active]
    if (!el) return

    const measure = () => {
      const w = el.offsetWidth
      metricsRef.current = w * STEP_RATIO
      setMetrics({ step: w * STEP_RATIO, height: el.offsetHeight })
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [active])

  /* ------------------------- Wheel navigation -------------------------- */

  const wheelLock = useRef(false)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    /*
      A NATIVE, NON-PASSIVE LISTENER — React's onWheel cannot do this.

      React attaches wheel at the root as PASSIVE, so preventDefault() inside an
      onWheel prop is ignored and the page scrolls anyway. The listener has to be
      registered here with { passive: false }.
    */
    const onWheel = (e: WheelEvent) => {
      /* Trackpads send horizontal deltas for a sideways two-finger pan; take
         whichever axis is dominant so both gestures drive the carousel. */
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (Math.abs(delta) < 8) return

      const dir = delta > 0 ? 1 : -1
      const at = activeRef.current

      /*
        THE PAGE MUST NEVER BE TRAPPED.

        At the first slide scrolling up, or the last scrolling down, this does
        NOT preventDefault — the gesture falls through and the page carries on
        past the section. Without that release a reader who scrolls into this
        section can never scroll out of it, which is the standard failure of
        scroll-jacked carousels and a serious one.
      */
      if ((dir > 0 && at === count - 1) || (dir < 0 && at === 0)) return

      /*
        BOTH CALLS ARE REQUIRED, AND preventDefault ALONE DOES NOTHING HERE.

        This site runs Lenis smooth scroll, which registers its own wheel
        listener on `window` and moves the page PROGRAMMATICALLY — it never
        consults `defaultPrevented`. Measured: a synthetic wheel dispatched
        anywhere on the page, carousel or not, already comes back prevented.
        So `preventDefault()` on its own would let the page glide on underneath
        while the carousel advanced.

        `stopPropagation` is what actually holds the page: this listener is on
        the stage and Lenis's is on window, so bubbling reaches us first and the
        event never gets there. `preventDefault` stays for the native fallback
        when Lenis is off — reduced motion, or its script failing.

        Neither is called at the boundary, so the gesture falls through to Lenis
        and the reader scrolls out of the section normally.
      */
      e.preventDefault()
      e.stopPropagation()
      if (wheelLock.current) return
      wheelLock.current = true
      go(at + dir)
      window.setTimeout(() => {
        wheelLock.current = false
      }, WHEEL_LOCK_MS)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [count, go])

  /* ------------------------------- Drag -------------------------------- */

  /*
    A drag that ends on the card must not also fire the card's click.

    The cards open on click and the burst is not undoable, so a swipe that
    happens to start on one would otherwise open it. The flag is read by a
    CAPTURE-phase click listener, which sees the event before the card does.
  */
  const draggedRef = useRef(false)

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info
    const threshold = metrics.step * 0.45
    if (offset.x < -threshold || velocity.x < -450) go(active + 1)
    else if (offset.x > threshold || velocity.x > 450) go(active - 1)
    window.setTimeout(() => {
      draggedRef.current = false
    }, 0)
  }

  const swallowClickAfterDrag = (e: React.MouseEvent) => {
    if (!draggedRef.current) return
    e.stopPropagation()
    e.preventDefault()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!trackRef.current?.contains(document.activeElement)) return
      if (e.key === 'ArrowLeft') go(active - 1)
      if (e.key === 'ArrowRight') go(active + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, go])

  const ambient = slides[active]?.ambient

  return (
    <div
      ref={stageRef}
      /*
        `overflow-x-clip` on the STAGE, and it is not the same thing as clipping
        the active slide.

        Without it the peeking neighbour runs past the viewport on a phone —
        measured documentElement.scrollWidth 511 against a 375px section. On a
        375px screen you cannot show a 323px active card AND a meaningful peek
        without something being trimmed; the neighbour is the right thing to
        trim.

        What it does NOT clip:
          - the active slide, which is centred and comfortably inside;
          - the opened card's decorations, which are anchored to the card's own
            edges and already trimmed by the card's own overflow-hidden;
          - the confetti, which canvas-confetti draws to a FIXED, full-viewport
            canvas appended to <body>, outside this subtree entirely.

        `clip`, not `hidden`: hidden would force the other axis to `auto` and
        make this a scroll container, which would trap the page's scroll and
        cut the card off vertically. `clip` leaves the vertical axis alone.
      */
      className={cn('relative overflow-x-clip', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      {/*
        Ambient wash — the active card's own artwork, thrown far out of focus.

        z-0, NOT z-[-1]. A negative z-index would put this behind the ANCESTOR
        SECTION'S background, and that section is opaque white with its own
        stacking context, so the wash would be painted over and invisible. It
        sits at z-0 with the track at z-10 above it instead, which achieves the
        same thing without fighting the stacking context.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl"
      >
        <AnimatePresence initial={false}>
          {ambient && (
            <motion.div
              key={ambient}
              initial={{ opacity: 0 }}
              /* 0.6, up from 0.3 — at a third it was barely distinguishable
                 from the section's white. Still stepped down under reduced
                 motion, where the crossfade between slides is the point. */
              animate={{ opacity: reduced ? 0.35 : 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={ambient}
                alt=""
                fill
                /* Tiny on purpose. It is blurred to 100px and never read, so a
                   full-width fetch would be pure waste. */
                sizes="320px"
                /* `saturate-200` before the blur. A 100px blur averages the
                   artwork down to a near-grey wash, so the colour has to be
                   pushed hard first or nothing survives it. */
                className="scale-150 object-cover blur-[100px] saturate-200"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*
        THE TRACK IS NOT CLIPPED, AND THAT IS DELIBERATE.

        `overflow-visible` is stated rather than left to the default so nobody
        "tidies" it into `overflow-hidden` later — the neighbouring slides have
        to spill past the track to peek at all.
      */}
      <motion.div
        ref={trackRef}
        className="relative z-10 mx-auto w-full overflow-visible"
        style={{ height: metrics.height || undefined }}
        animate={{ height: metrics.height || undefined }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        drag={reduced ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        onDragStart={() => {
          draggedRef.current = true
        }}
        onDragEnd={handleDragEnd}
        onClickCapture={swallowClickAfterDrag}
      >
        {slides.map((slide, i) => {
          const offset = i - active
          const distance = Math.abs(offset)
          if (distance > WINDOW) return null

          const isActive = offset === 0

          return (
            <motion.div
              key={slide.key}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              /*
                `mx-auto` centres each slide and framer's `x` offsets it from
                there. Deliberately NOT `-translate-x-1/2`: Tailwind v4 compiles
                that to the discrete `translate:` property, which COMPOSES with
                framer's `transform` rather than replacing it, so the two would
                silently add up and every slide would sit half a width off.
              */
              className={cn(
                /*
                  Fixed widths, not viewport fractions — the card is a fixed
                  height, so a fluid width would keep changing its proportions
                  and the copy's line count with it.

                  CAPPED, THOUGH, and that cap is a real bug fix. `w-[320px]`
                  is wider than the column it sits in on a 320px phone: the
                  container is 280px after the page's px-5, so the card ran 40px
                  past it and an `overflow-x-clip` ancestor quietly sliced the
                  right-hand 40px off every slide. No horizontal scrollbar, no
                  console warning — just missing card.

                  `max-w-full` keeps the fixed width everywhere it fits and
                  yields to the container only where it does not, which is the
                  one place the fixed-proportion argument stops applying.
                */
                'absolute inset-x-0 top-0 mx-auto w-[320px] max-w-full md:w-[380px]',
                /*
                  Rule 3. Only the spotlit slide is interactive — the cards open
                  on click and fire a burst, and a stray hit on a half-hidden
                  neighbour would fire the wrong one.
                */
                isActive
                  ? 'pointer-events-auto'
                  : 'pointer-events-none cursor-pointer',
              )}
              /*
                The active slide is lifted far above its neighbours so its
                decorations can never slide under one. The gap is 10 per step
                rather than 1 so there is room for a card's own internal layers
                (decorations z-20, copy z-30, artwork z-50) without them ever
                reaching a neighbouring slide's band.
              */
              style={{ zIndex: 100 - distance * 10 }}
              initial={false}
              animate={{
                x: offset * metrics.step,
                scale: isActive ? 1 : 0.84,
                opacity: isActive ? 1 : 0.5,
                filter: isActive ? 'blur(0px)' : 'blur(1.5px)',
              }}
              /*
                Hover belongs to the spotlit slide alone. Framer resolves
                `whileHover` over `animate`, so this lifts the active card from
                its resting scale of 1 and leaves the neighbours — which are
                pointer-events-none anyway — untouched.
              */
              whileHover={
                isActive && !reduced ? { scale: 1.02, y: -5 } : undefined
              }
              transition={
                reduced || !settled.current
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 260, damping: 32 }
              }
              aria-hidden={!isActive}
              /* Removes the whole subtree from the tab order and from hit
                 testing while it is off-centre, which `pointer-events-none`
                 alone does not do for keyboard users. */
              inert={!isActive ? true : undefined}
              aria-roledescription="slide"
              aria-label={`${slide.label} — ${i + 1} of ${count}`}
            >
              {/* A neighbour is a big, inviting target that does nothing.
                  Clicking one brings it to the centre instead. */}
              {!isActive && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => go(i)}
                  aria-hidden
                  className="pointer-events-auto absolute inset-0 z-[60] cursor-pointer"
                >
                  <span className="sr-only">Show {slide.label}</span>
                </button>
              )}
              {/*
                THE BURST IS A KEYED WRAPPER, NOT A CHANGE TO THE SLIDE ITSELF.

                The outer motion.div owns `x`, `scale`, `opacity` and `blur` for
                every slide at once — that is the horizontal glide, and touching
                it would change how the neighbours travel on every viewport.
                This wrapper sits inside it and only ever exists for the ACTIVE
                slide on a narrow screen, so the two compose: the deck still
                slides, and the card that lands pops as it arrives.

                `key={active}` is what makes it fire. A wrapper that merely
                re-renders would animate nothing; remounting on every index
                change is what replays `initial -> animate`, which is precisely
                the "whenever the slide index changes" trigger asked for — and
                it works identically whether the change came from an arrow, a
                dot, a drag or the 2s timer, because all four route through the
                same `active`.

                Reduced motion falls through to the plain render: a spring that
                overshoots is the definition of the movement that setting exists
                to suppress.
              */}
              {isActive && isMobile && !reduced ? (
                <motion.div
                  key={active}
                  initial={{ scale: 0.85, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={BURST}
                >
                  {slide.render(isActive)}
                </motion.div>
              ) : (
                slide.render(isActive)
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* ------------------------------ Controls ------------------------------ */}
      <div className="relative z-10 mt-10 flex items-center justify-center gap-6">
        <CarouselButton
          direction="prev"
          onClick={() => go(active - 1)}
          disabled={active === 0}
        />

        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label={`${label} slides`}
        >
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={slide.label}
              onClick={() => go(i)}
              data-tap
              className="group/dot flex h-8 w-5 items-center justify-center"
            >
              <span
                className={cn(
                  'block rounded-full transition-all duration-300',
                  i === active
                    ? 'h-2 w-6 bg-smaya-plum'
                    : 'h-2 w-2 bg-smaya-charcoal/25 group-hover/dot:bg-smaya-charcoal/50',
                )}
              />
            </button>
          ))}
        </div>

        <CarouselButton
          direction="next"
          onClick={() => go(active + 1)}
          disabled={active === count - 1}
        />
      </div>
    </div>
  )
}

function CarouselButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tap
      aria-label={direction === 'prev' ? 'Previous service' : 'Next service'}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
        /*
          MEASURED, AND BOTH VALUES WERE FAILING.

          The outline was `charcoal/15` — 1.36:1 against this white ground, so
          the button did not read as a button at all, and at slide 0 the
          disabled prev arrow's glyph measured 1.71:1. Half the control pair was
          a ghost on first view, which is why this carousel was reported as
          having no arrows.

          `/50` is not a guess: sweeping the alpha against the measured ground,
          0.3 gives 1.92, 0.4 gives 2.49 and 0.5 is the first value clearing the
          3:1 WCAG 1.4.11 asks of a control's boundary, at 3.31. An earlier pass
          used /40 on an estimate against white-ish and landed under.

          The disabled arrow stays deliberately quieter — it must read as
          unavailable — and 1.4.11 exempts inactive controls, so /45 (2.87:1) is
          a judgement call rather than a threshold: enough to show an end-stop
          exists, not enough to invite a tap.
        */
        disabled
          ? 'cursor-not-allowed border-smaya-charcoal/25 text-smaya-charcoal/45'
          : 'border-smaya-charcoal/50 text-smaya-plum hover:border-smaya-plum hover:bg-smaya-plum hover:text-white',
      )}
    >
      <Icon size={18} aria-hidden />
    </button>
  )
}
