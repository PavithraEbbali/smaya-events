'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

import { usePointerFine, usePrefersReducedMotion } from '@/lib/hooks'
import { springSnappy } from '@/lib/animations'

const PULL_RADIUS = 40

type Props = {
  children: ReactNode
  className?: string
  /** How far the element may travel toward the cursor, in px. */
  strength?: number
}

/**
 * Pulls its child toward the cursor within ~40px and springs back on leave.
 * Desktop only — on touch (and with reduced motion) it renders a plain
 * wrapper and never attaches a listener.
 */
export function MagneticButton({
  children,
  className,
  strength = PULL_RADIUS,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const pointerFine = usePointerFine()
  const reduced = usePrefersReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, springSnappy)
  const springY = useSpring(y, springSnappy)

  const active = pointerFine && !reduced

  if (!active) {
    return <div className={className}>{children}</div>
  }

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = event.clientX - (rect.left + rect.width / 2)
    const relY = event.clientY - (rect.top + rect.height / 2)
    // Normalise against half the element so the pull is proportional, then
    // clamp to `strength` so large buttons don't fly across the screen.
    const cappedX = Math.max(-1, Math.min(1, relX / (rect.width / 2)))
    const cappedY = Math.max(-1, Math.min(1, relY / (rect.height / 2)))
    x.set(cappedX * strength)
    y.set(cappedY * strength * 0.6)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
