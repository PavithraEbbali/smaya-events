'use client'

import { useRef } from 'react'

import { getIcon, type IconName } from '@/lib/icons'
import { useInViewOnce } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  name: IconName
  size?: number
  className?: string
  /** Wrapper treatment — `circle` matches the source service cards. */
  variant?: 'circle' | 'bare'
  accent?: 'plum' | 'coral' | 'gold'
}

const circleTone = {
  plum: 'bg-smaya-plum/10 text-smaya-plum group-hover:bg-smaya-plum group-hover:text-white',
  coral:
    'bg-smaya-coral/15 text-smaya-coral group-hover:bg-smaya-coral group-hover:text-white',
  gold: 'bg-smaya-gold/15 text-smaya-gold group-hover:bg-smaya-gold group-hover:text-smaya-charcoal',
} as const

/**
 * lucide icon with a stroke draw-in on scroll into view, plus a rotate/bounce
 * on hover of the containing `.group` (Section 4, item 12).
 */
export function IconBadge({
  name,
  size = 26,
  className,
  variant = 'circle',
  accent = 'plum',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInViewOnce(ref)
  const Icon = getIcon(name)

  const icon = (
    <span
      className={cn(
        'icon-draw inline-flex transition-transform duration-500 will-change-transform',
        'group-hover:-rotate-6 group-hover:scale-110',
      )}
      data-drawn={inView || undefined}
    >
      <Icon size={size} aria-hidden />
    </span>
  )

  if (variant === 'bare') {
    return (
      <span ref={ref} className={cn('inline-flex', className)}>
        {icon}
      </span>
    )
  }

  return (
    <span
      ref={ref}
      className={cn(
        'flex items-center justify-center rounded-full transition-colors duration-300',
        'h-12 w-12 sm:h-14 sm:w-14',
        circleTone[accent],
        className,
      )}
    >
      {icon}
    </span>
  )
}
