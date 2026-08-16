import type Lenis from 'lenis'

/**
 * The live Lenis instance, for code that needs to MOVE the page.
 *
 * Deliberately its own module with a single type-only import, so reading it
 * costs nothing: `lib/lenis.ts` statically imports the gsap loader, and a
 * component that only wants to scroll should not pull that in.
 *
 * Why this exists at all: Lenis drives scrolling from its own rAF loop, setting
 * the scroll position every frame. A native `window.scrollTo({behavior:
 * 'smooth'})` runs its OWN animation over the same property, so the two fight —
 * Lenis reasserts its target each frame and the native tween is overwritten
 * mid-flight. Anything that scrolls programmatically has to go through Lenis
 * while Lenis is running, and fall back to native only when it is not (which is
 * the reduced-motion case, where the provider never boots it).
 */
let current: Lenis | null = null

export function setLenis(instance: Lenis | null) {
  current = instance
}

export function getLenis(): Lenis | null {
  return current
}
