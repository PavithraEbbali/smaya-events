'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

import { EASE } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'

/**
 * Route-to-route clip-path wipe, replacing the old AnimatePresence fade/slide.
 * Deliberately short (420ms) so navigation still feels instant.
 *
 * Only the *entering* page is animated. App Router swaps `children`
 * synchronously on navigation, so an exit animation would need the outgoing
 * tree kept alive — not worth the complexity for a sub-500ms wipe.
 *
 * The clip-path is dropped once the wipe lands: a resting `clip-path` would
 * make <main> a containing block for every `position: fixed` descendant.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = usePrefersReducedMotion()
  const [wiping, setWiping] = useState(false)
  const [mounted, setMounted] = useState(false)

  // The wipe is armed only after the first client render. Framer serialises
  // `initial` into the SSR markup, and a clipped <main> in the HTML would
  // leave the whole site blank if JS never runs. The first paint therefore
  // gets no wipe (the hero's split-door reveal covers that moment); every
  // route change after it does.
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) setWiping(true)
  }, [pathname, mounted])

  if (reduced) {
    return <main className="flex flex-grow flex-col">{children}</main>
  }

  return (
    <motion.main
      key={pathname}
      initial={mounted ? { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0.6 } : false}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
      transition={{ duration: 0.42, ease: EASE }}
      onAnimationComplete={() => setWiping(false)}
      // A resting clip-path would make <main> a containing block for every
      // `position: fixed` descendant, so it is dropped once the wipe lands.
      style={wiping ? undefined : { clipPath: 'none' }}
      className="flex flex-grow flex-col"
    >
      {children}
    </motion.main>
  )
}
