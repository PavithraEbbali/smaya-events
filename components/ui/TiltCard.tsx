'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

import { usePointerFine, usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const MAX_TILT = 8

type Props = {
  children: ReactNode
  className?: string
  /** Max rotation in degrees on each axis. */
  max?: number
  /** Adds a gold glow that follows the cursor across the card face. */
  glare?: boolean
}

/**
 * 3D mouse-tilt wrapper (Section 4, item 8). Spring-damped, capped at ~8°, and
 * resets on leave. Never mounts its listeners on touch or under reduced motion.
 */
export function TiltCard({
  children,
  className,
  max = MAX_TILT,
  glare = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const pointerFine = usePointerFine()
  const reduced = usePrefersReducedMotion()

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const spring = { stiffness: 180, damping: 18, mass: 0.5 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring)

  const active = pointerFine && !reduced

  if (!active) {
    return <div className={cn('relative', className)}>{children}</div>
  }

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = (event.clientX - rect.left) / rect.width
    const ny = (event.clientY - rect.top) / rect.height
    px.set(nx)
    py.set(ny)
    if (glare) {
      el.style.setProperty('--glare-x', `${nx * 100}%`)
      el.style.setProperty('--glare-y', `${ny * 100}%`)
    }
  }

  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    /*
     * `h-full` is load-bearing, not cosmetic. Perspective has to live on the
     * transformed element's parent, so this wrapper sits between the caller's
     * box and the card. Without a height it computes to `auto`, and callers
     * that size their card with `h-full` (the portfolio and gallery masonry,
     * whose row height comes from `auto-rows-*`) then resolve against `auto`
     * and collapse the whole subtree — including the images — to zero.
     */
    <div className="h-full [perspective:1200px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={cn('relative will-change-transform', className)}
      >
        {children}
        {glare && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(400px circle at var(--glare-x,50%) var(--glare-y,50%), rgba(212,175,55,0.18), transparent 70%)',
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
