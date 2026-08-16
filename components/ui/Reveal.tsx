'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { useInViewOnce } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  className?: string
  /** Milliseconds to hold after the element enters view. */
  delay?: number
}

/**
 * Slides its children up and fades them in the first time they enter the
 * viewport. No animation library — an IntersectionObserver and a CSS
 * transition.
 *
 * The observer is `useInViewOnce` from lib/hooks: the project's existing
 * useRef + useEffect IntersectionObserver wrapper, already used by the section
 * dividers and icon draws. A second hook doing the same job would only be a
 * second place for the rootMargin to drift.
 *
 * THE `armed` FLAG IS NOT OPTIONAL
 * --------------------------------
 * The naive version renders `opacity-0 translate-y-10` immediately, which ships
 * `opacity: 0` in the SSR HTML — so with JS disabled, or if hydration fails, or
 * for a crawler that does not run scripts, the content is invisible forever.
 *
 * `armed` is false during SSR and on the first client render, so the markup
 * that leaves the server is the VISIBLE state. It flips to true in an effect,
 * at which point anything not yet in view hides and waits for the observer.
 * Content already on screen when the page loads never hides at all, because
 * the observer resolves in the same tick.
 *
 * Failure mode if JS dies: the element stays visible. That is the right way
 * round for a reveal.
 */
export function Reveal({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewOnce(ref)
  const [armed, setArmed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    setArmed(true)
    /*
      Failsafe. `useInViewOnce` already handles a missing IntersectionObserver,
      but not an observer that exists and never fires — and the cost of that is
      content the reader never sees. After 2.5s the reveal runs regardless.
      Same reasoning as the hero intro's watchdog.
    */
    const t = window.setTimeout(() => setTimedOut(true), 2500)
    return () => window.clearTimeout(t)
  }, [])

  const hidden = armed && !inView && !timedOut

  return (
    <div
      ref={ref}
      className={cn('transition-all duration-1000 ease-out', className)}
      /*
        The two animated properties are INLINE, not `opacity-0 translate-y-10`
        utility classes.

        Those classes were tried first and did not take: the element carried
        them while its computed opacity stayed 1, even though an identical
        probe div elsewhere in the document resolved correctly. Rather than
        ship a reveal whose failure mode is "content never appears", the state
        is set where nothing can override it. The timing still comes from the
        utilities above, and the values are the specified ones — 2.5rem of
        travel, 1000ms, ease-out.
      */
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(2.5rem)' : 'none',
        ...(delay ? { transitionDelay: `${delay}ms` } : null),
      }}
    >
      {children}
    </div>
  )
}
