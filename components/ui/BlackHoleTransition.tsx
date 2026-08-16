'use client'

import { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/lib/hooks'
import { alpha as withAlpha } from '@/lib/theme'

type Props = {
  /** Starts the animation when it flips to true. */
  active: boolean
  onComplete?: () => void
}

type Mote = {
  angle: number
  radius: number
  spin: number
  fall: number
  size: number
  hue: number
}

const SPIRAL_MS = 1150
const BURST_MS = 520
const TOTAL_MS = SPIRAL_MS + BURST_MS

/**
 * The single deliberate "wow" moment (Section 4, item 11): a radial gravity
 * well. Gold motes curve inward toward a centre point, collapse, and release
 * as a light burst — played once, on first load, immediately after the hero's
 * split-door reveal lands.
 *
 * Loaded via next/dynamic with `ssr: false`; refuses to run under reduced
 * motion, where it completes instantly instead.
 */
export function BlackHoleTransition({ active, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)
  const reduced = usePrefersReducedMotion()
  const completedRef = useRef(false)

  useEffect(() => {
    if (!active || completedRef.current) return

    const finish = () => {
      if (completedRef.current) return
      completedRef.current = true
      setDone(true)
      onComplete?.()
    }

    if (reduced) {
      finish()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      finish()
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      finish()
      return
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0

    // Sized from the canvas's own box — it fills the hero, not the viewport.
    const size = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width || window.innerWidth
      height = rect.height || window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()

    const cx = () => width / 2
    const cy = () => height * 0.5
    const maxRadius = Math.hypot(width, height) / 2

    const motes: Mote[] = Array.from({ length: 220 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: maxRadius * (0.25 + Math.random() * 0.9),
      spin: (0.8 + Math.random() * 1.6) * (Math.random() < 0.5 ? -1 : 1),
      fall: 0.6 + Math.random() * 0.7,
      size: 0.8 + Math.random() * 2.2,
      hue: Math.random(),
    }))

    const easeIn = (t: number) => t * t * t
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    let start: number | undefined
    let frame: number

    const render = (now: number) => {
      start ??= now
      const elapsed = now - start
      ctx.clearRect(0, 0, width, height)

      const centreX = cx()
      const centreY = cy()

      if (elapsed < SPIRAL_MS) {
        const t = elapsed / SPIRAL_MS
        const collapse = easeIn(t)

        // The well itself — a dark core with a thin gold accretion rim.
        const coreR = 10 + 46 * easeOut(t)
        const core = ctx.createRadialGradient(
          centreX,
          centreY,
          0,
          centreX,
          centreY,
          coreR * 2.4,
        )
        core.addColorStop(0, withAlpha('charcoal', 0.9 * t))
        core.addColorStop(0.55, withAlpha('plum', 0.45 * t))
        core.addColorStop(1, withAlpha('charcoal', 0))
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(centreX, centreY, coreR * 2.4, 0, Math.PI * 2)
        ctx.fill()

        for (const m of motes) {
          // Radius shrinks toward the core while the angle accelerates — the
          // combination is what reads as "curving inward" rather than falling.
          const r = m.radius * (1 - collapse * m.fall)
          const a = m.angle + collapse * m.spin * 5.2
          const x = centreX + Math.cos(a) * r
          const y = centreY + Math.sin(a) * r * 0.82

          const alpha = Math.min(1, 0.25 + collapse * 1.1)
          ctx.beginPath()
          ctx.arc(x, y, m.size * (1 - collapse * 0.35), 0, Math.PI * 2)
          ctx.fillStyle =
            m.hue > 0.75
              ? withAlpha('goldLight', alpha)
              : withAlpha('gold', alpha)
          ctx.fill()

          // A short trailing streak sells the orbital velocity.
          if (collapse > 0.25) {
            ctx.beginPath()
            ctx.moveTo(x, y)
            const trailA = a - 0.16 * collapse * Math.sign(m.spin)
            const trailR = r * 1.05
            ctx.lineTo(
              centreX + Math.cos(trailA) * trailR,
              centreY + Math.sin(trailA) * trailR * 0.82,
            )
            ctx.strokeStyle = withAlpha('gold', alpha * 0.35)
            ctx.lineWidth = m.size * 0.6
            ctx.stroke()
          }
        }
      } else {
        // Burst: everything the well swallowed comes back out as light.
        const t = Math.min(1, (elapsed - SPIRAL_MS) / BURST_MS)
        const eased = easeOut(t)
        const r = 20 + maxRadius * 1.35 * eased
        const alpha = 1 - t

        const burst = ctx.createRadialGradient(
          centreX,
          centreY,
          Math.max(0, r * 0.55),
          centreX,
          centreY,
          r,
        )
        burst.addColorStop(0, `rgba(255,255,255,0)`)
        burst.addColorStop(0.72, withAlpha('goldLight', alpha * 0.55))
        burst.addColorStop(0.88, withAlpha('gold', alpha * 0.8))
        burst.addColorStop(1, withAlpha('gold', 0))
        ctx.fillStyle = burst
        ctx.beginPath()
        ctx.arc(centreX, centreY, r, 0, Math.PI * 2)
        ctx.fill()

        const flash = 1 - Math.min(1, t * 2.6)
        if (flash > 0) {
          ctx.fillStyle = `rgba(255,252,240,${flash * 0.55})`
          ctx.beginPath()
          ctx.arc(centreX, centreY, 40 + 180 * eased, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (elapsed < TOTAL_MS) {
        frame = requestAnimationFrame(render)
      } else {
        finish()
      }
    }

    frame = requestAnimationFrame(render)
    window.addEventListener('resize', size)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', size)
    }
  }, [active, reduced, onComplete])

  if (reduced || done || !active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[70] h-full w-full"
    />
  )
}

export default BlackHoleTransition
