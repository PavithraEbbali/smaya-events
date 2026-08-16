'use client'

import { useEffect, useState } from 'react'

function useMediaQuery(query: string, initial = false) {
  const [matches, setMatches] = useState(initial)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}

/**
 * True only on devices with a precise pointer. Everything decorative that
 * tracks the cursor (custom cursor, magnetic buttons, 3D tilt, particles)
 * gates on this so it never *runs* on touch — not merely renders invisibly.
 * Starts `false` so touch devices never see a flash of desktop-only chrome.
 */
export function usePointerFine() {
  return useMediaQuery('(pointer: fine)')
}

/**
 * True only once a COARSE pointer is CONFIRMED.
 *
 * The mirror of `usePointerFine`, and not interchangeable with `!usePointerFine()`.
 * Both start `false` before the query resolves, so the two phrasings disagree
 * about what "unknown" means: `!usePointerFine()` reads as "assume this device
 * CANNOT hover", while this reads as "assume it CAN".
 *
 * Use this one wherever the unresolved frame must render the hover-capable
 * state — anything hidden until hover, for instance, would otherwise flash
 * fully revealed on first paint and then collapse once the query settled.
 */
export function useCoarsePointer() {
  return useMediaQuery('(pointer: coarse)')
}

/**
 * True once the viewport is confirmed at least `sm` wide.
 *
 * Intended for TIMING decisions, not layout ones — express layout in CSS
 * breakpoints instead, since this starts `false` and corrects itself in an
 * effect, which means the first paint would use the wrong arrangement. Being
 * briefly wrong about a transition duration is harmless; being briefly wrong
 * about where something sits is a visible jump.
 */
export function useWideViewport() {
  return useMediaQuery('(min-width: 640px)')
}

/** Honours the OS "reduce motion" setting. */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * `true` once the element has scrolled into view. Used for the CSS-driven
 * reveals (text lines, icon strokes, divider paths) that don't need GSAP.
 */
export function useInViewOnce<T extends Element>(
  ref: React.RefObject<T | null>,
  options?: IntersectionObserverInit,
) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15, ...options },
    )

    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  return inView
}

/** `true` once the window has scrolled past `threshold` pixels. */
export function useScrolled(threshold = 50) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
