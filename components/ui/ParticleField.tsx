'use client'

import { useEffect, useRef } from 'react'

import { usePrefersReducedMotion } from '@/lib/hooks'
import { alpha } from '@/lib/theme'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** Particles per 100k px² of canvas — kept deliberately low. */
  density?: number
  opacity?: number
}

type Particle = {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  a: number
  phase: number
}

/**
 * Ambient drifting gold particles over dark sections. Canvas-based (no
 * tsparticles dependency), pauses when scrolled out of view, and refuses to
 * mount at all under `prefers-reduced-motion`.
 *
 * Loaded via next/dynamic with `ssr: false` at every call site.
 */
export function ParticleField({
  className,
  density = 4,
  opacity = 0.5,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reduced) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let frame = 0
    let running = true
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const seed = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round((width * height) / 100_000) * density
      particles = Array.from({ length: Math.max(12, Math.min(count, 90)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -0.05 - Math.random() * 0.22,
        a: 0.15 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number) => {
      if (!running) return
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.y < -6) {
          p.y = height + 6
          p.x = Math.random() * width
        }
        if (p.x < -6) p.x = width + 6
        if (p.x > width + 6) p.x = -6

        const twinkle = 0.65 + 0.35 * Math.sin(t / 900 + p.phase)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = alpha('gold', p.a * twinkle * opacity)
        ctx.fill()
      }

      frame = requestAnimationFrame(draw)
    }

    seed()
    frame = requestAnimationFrame(draw)

    const onResize = () => seed()
    window.addEventListener('resize', onResize)

    // Stop burning frames while the field is off-screen.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true
        frame = requestAnimationFrame(draw)
      } else if (!entry.isIntersecting && running) {
        running = false
        cancelAnimationFrame(frame)
      }
    })
    observer.observe(canvas)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [reduced, density, opacity])

  if (reduced) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  )
}

export default ParticleField
