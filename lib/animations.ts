import type { Transition, Variants } from 'framer-motion'

/** The house easing curve — matches `--ease-smaya` in globals.css. */
export const EASE = [0.76, 0, 0.24, 1] as const

/** Softer curve for entrances that shouldn't feel mechanical. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 20,
  mass: 0.6,
}

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
  mass: 0.5,
}

/**
 * Parent for any grid/list that used to hand-roll `delay: i * 0.1` on each
 * child. Put `staggerContainer` on the parent and `staggerItem` on the items.
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.16, delayChildren: 0.1 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
}

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_OUT } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_OUT } },
}

/** Shared `viewport` prop so every section triggers at the same point. */
export const viewportOnce = { once: true, margin: '-80px' } as const

/**
 * Standard ScrollTrigger config for a scrubbed, scroll-position-tied tween.
 * `scrub: true` means the tween tracks the scrollbar rather than firing once.
 */
export function scrubConfig(trigger: Element, extra?: Record<string, unknown>) {
  return {
    trigger,
    start: 'top 85%',
    end: 'top 35%',
    scrub: true,
    ...extra,
  }
}

/** One-shot ScrollTrigger config for entrance animations. */
export function enterConfig(trigger: Element, extra?: Record<string, unknown>) {
  return {
    trigger,
    start: 'top 80%',
    toggleActions: 'play none none none',
    ...extra,
  }
}
