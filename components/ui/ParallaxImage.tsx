'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'

import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  src: string
  alt: string
  className?: string
  imageClassName?: string
  sizes?: string
  priority?: boolean
  /** Drift distance as a percentage of the image's own height. */
  strength?: number
  children?: React.ReactNode
}

/**
 * Image that drifts at a different scroll speed than its container
 * (Section 4, item 4). The image is rendered 120% tall and offset so the drift
 * never exposes an edge.
 */
export function ParallaxImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = '(max-width: 768px) 100vw, 33vw',
  priority = false,
  strength = 10,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ['0%', '0%'] : [`-${strength}%`, `${strength}%`],
  )

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div
        style={{ y }}
        className="absolute inset-x-0 -top-[10%] h-[120%] will-change-transform"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            'object-cover transition-transform duration-700 group-hover:scale-105',
            imageClassName,
          )}
        />
      </motion.div>
      {children}
    </div>
  )
}
