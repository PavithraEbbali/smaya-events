'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { initLenis, type LenisTeardown } from '@/lib/lenis'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { assertThemeInSync } from '@/lib/theme'

/**
 * Boots Lenis for the whole app and keeps ScrollTrigger in sync. Skipped
 * entirely under `prefers-reduced-motion`, where native scrolling is correct.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const reduced = usePrefersReducedMotion()
  const pathname = usePathname()

  // Dev-only: warns if lib/theme.ts has drifted from the @theme tokens.
  useEffect(() => {
    assertThemeInSync()
  }, [])

  useEffect(() => {
    if (reduced) return

    let destroy: LenisTeardown | undefined
    let cancelled = false

    initLenis().then((result) => {
      if (cancelled) {
        result.destroy()
        return
      }
      destroy = result.destroy
    })

    return () => {
      cancelled = true
      destroy?.()
    }
  }, [reduced])

  // Route changes must land at the top and re-measure every ScrollTrigger,
  // since the new page's element positions are entirely different.
  useEffect(() => {
    window.scrollTo(0, 0)

    let cancelled = false
    const id = window.setTimeout(() => {
      import('@/lib/gsap').then(({ loadGsap }) =>
        loadGsap().then(({ ScrollTrigger }) => {
          if (!cancelled) ScrollTrigger.refresh()
        }),
      )
    }, 260)

    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [pathname])

  return <>{children}</>
}
