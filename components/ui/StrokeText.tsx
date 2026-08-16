'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  /** Repeated to fill the band — e.g. "Celebrate." */
  phrase: string
  /** How many times to repeat per row. */
  repeat?: number
  className?: string
  /** Drift distance as a percentage of its own width, on scroll. */
  drift?: number
  tone?: 'light' | 'dark'
  /**
   * Overrides the default type scale. Set this when the band sits behind a
   * specific headline rather than a whole section — at the default it is taller
   * than most headlines and spills onto whatever is above and below.
   *
   * Must be a `text-*` class only; the line-height is applied after it for the
   * tailwind-merge reason noted below.
   */
  sizeClassName?: string
}

const DEFAULT_SIZE = 'text-[18vw] sm:text-[15vw] lg:text-[12vw]'

/**
 * Oversized outlined brand phrase used as a texture layer BEHIND section
 * headers. Stroke-only, no fill, so it reads as depth rather than as competing
 * copy.
 *
 * Strictly decorative: aria-hidden and pointer-events-none, because a screen
 * reader announcing "Celebrate. Celebrate. Celebrate." before every heading
 * would be actively hostile.
 */
export function StrokeText({
  phrase,
  repeat = 4,
  className,
  drift = 12,
  tone = 'light',
  sizeClassName = DEFAULT_SIZE,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ['0%', '0%'] : [`${drift}%`, `-${drift}%`],
  )

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 select-none overflow-hidden',
        className,
      )}
    >
      <motion.div
        style={{ x }}
        className="flex w-max whitespace-nowrap will-change-transform"
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'brand-etch font-serif font-black uppercase tracking-[-0.03em]',
              sizeClassName,
              // AFTER the text sizes on purpose. tailwind-merge treats
              // `text-<size>` as also setting line-height, so a `leading-*`
              // placed before it gets dropped.
              'leading-[0.82]',
              tone === 'dark' ? 'brand-etch-light' : 'brand-etch-dark',
            )}
          >
            {phrase}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
