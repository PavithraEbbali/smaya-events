'use client'

import { Children, useRef, type ReactNode } from 'react'

import { useInViewOnce } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  className?: string
  /** ms between successive children. */
  stagger?: number
  as?: 'div' | 'blockquote' | 'p'
}

/**
 * Line-by-line clip-path mask reveal (Section 4, item 3). Each direct child is
 * treated as a "line" and unmasks in turn as the block enters the viewport.
 *
 * Pure CSS transitions driven by one IntersectionObserver — no GSAP payload for
 * something this small.
 */
export function RevealText({
  children,
  className,
  stagger = 120,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewOnce(ref)

  return (
    <Tag ref={ref as never} className={cn(className)}>
      {Children.map(children, (child, i) => (
        <span
          className="reveal-line"
          data-revealed={inView || undefined}
          style={{ '--reveal-delay': `${i * stagger}ms` } as React.CSSProperties}
        >
          {child}
        </span>
      ))}
    </Tag>
  )
}
