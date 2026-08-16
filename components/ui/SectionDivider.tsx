'use client'

import { useRef } from 'react'

import { useInViewOnce } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  tone?: 'gold' | 'plum' | 'light'
}

const STROKE = {
  gold: 'var(--color-smaya-gold)',
  plum: 'var(--color-smaya-plum)',
  light: 'rgba(255,255,255,0.55)',
} as const

/**
 * SVG path-draw divider (Section 4, item 5). The stroke draws itself in as the
 * divider scrolls into view — the same `stroke-dasharray`/`dashoffset`
 * technique used for the nav-link underlines.
 */
export function SectionDivider({ className, tone = 'gold' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewOnce(ref)

  return (
    <div
      ref={ref}
      className={cn('flex w-full justify-center py-12 sm:py-16', className)}
      aria-hidden
    >
      <svg
        width="220"
        height="24"
        viewBox="0 0 220 24"
        fill="none"
        className="max-w-full"
      >
        <g
          stroke={STROKE[tone]}
          strokeWidth="1.25"
          strokeLinecap="round"
          fill="none"
        >
          <path
            className="path-draw"
            data-drawn={inView || undefined}
            style={{ '--path-length': '96' } as React.CSSProperties}
            d="M2 12 H 96"
          />
          <path
            className="path-draw"
            data-drawn={inView || undefined}
            style={
              {
                '--path-length': '60',
                transitionDelay: '160ms',
              } as React.CSSProperties
            }
            d="M110 3 L 119 12 L 110 21 L 101 12 Z"
          />
          <path
            className="path-draw"
            data-drawn={inView || undefined}
            style={
              {
                '--path-length': '96',
                transitionDelay: '320ms',
              } as React.CSSProperties
            }
            d="M218 12 H 124"
          />
        </g>
      </svg>
    </div>
  )
}
