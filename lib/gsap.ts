import type { gsap as GsapType } from 'gsap'

type Gsap = typeof GsapType

type CoreBundle = {
  gsap: Gsap
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
}

type SplitBundle = CoreBundle & {
  SplitText: typeof import('gsap/SplitText').SplitText
}

let corePromise: Promise<CoreBundle> | null = null
let splitPromise: Promise<SplitBundle> | null = null

/**
 * GSAP + ScrollTrigger are loaded on demand, per section, so they stay out of
 * the initial bundle. Call this inside an effect and bail if the component
 * unmounted before it resolved.
 */
export function loadGsap(): Promise<CoreBundle> {
  corePromise ??= (async () => {
    const [core, st] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    const gsap = core.gsap
    gsap.registerPlugin(st.ScrollTrigger)
    return { gsap, ScrollTrigger: st.ScrollTrigger }
  })()
  return corePromise
}

/** Adds SplitText on top of the core bundle (headline reveals only). */
export function loadSplitText(): Promise<SplitBundle> {
  splitPromise ??= (async () => {
    const [bundle, split] = await Promise.all([
      loadGsap(),
      import('gsap/SplitText'),
    ])
    bundle.gsap.registerPlugin(split.SplitText)
    return { ...bundle, SplitText: split.SplitText }
  })()
  return splitPromise
}
