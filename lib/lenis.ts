import type Lenis from 'lenis'

import { loadGsap } from './gsap'
import { setLenis } from './lenis-instance'

export type LenisTeardown = () => void

/**
 * Boots Lenis and hands scroll driving over to GSAP's ticker, so ScrollTrigger
 * and Lenis share a single rAF loop and never disagree about scroll position.
 *
 * Lenis scrolls the window (not a custom container), so the correct wiring is
 * `lenis.on('scroll', ScrollTrigger.update)` plus a ticker-driven `raf` — a
 * `scrollerProxy` is only needed when the scroller is a nested element.
 */
export async function initLenis(): Promise<{
  lenis: Lenis
  destroy: LenisTeardown
}> {
  const [{ default: LenisCtor }, { gsap, ScrollTrigger }] = await Promise.all([
    import('lenis'),
    loadGsap(),
  ])

  const lenis = new LenisCtor({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    // Native momentum on touch feels better than an emulated one, and keeps
    // scroll off the main thread on mobile.
    syncTouch: false,
    touchMultiplier: 1.6,
  })

  const onScroll = () => ScrollTrigger.update()
  lenis.on('scroll', onScroll)

  const raf = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  ScrollTrigger.refresh()

  /* Published so programmatic scrolling goes THROUGH Lenis rather than
     competing with it — see lib/lenis-instance.ts. */
  setLenis(lenis)

  return {
    lenis,
    destroy: () => {
      setLenis(null)
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    },
  }
}
