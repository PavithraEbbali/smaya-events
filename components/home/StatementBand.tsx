'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'

import { EASE_OUT, viewportOnce } from '@/lib/animations'
import { useInViewOnce } from '@/lib/hooks'
import { RevealText } from '@/components/ui/RevealText'
import { cn } from '@/lib/utils'

/**
 * The beat between the seven service cards and the founder story.
 *
 * Deliberately still. A scrolling ticker sat here previously and fought the
 * grid above it for attention — after seven video tiles the page needs a
 * breath, not more movement. This does one job: explain what the seven cards
 * have in common, and hand the reader to the story below.
 *
 * The only motion is a line-by-line mask reveal and a rule that draws itself.
 */
export function StatementBand({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const drawn = useInViewOnce(ref)

  return (
    <section
      className={cn(
        'relative bg-smaya-ivory px-5 py-20 sm:px-6 sm:py-28 lg:py-32',
        className,
      )}
    >
      <div ref={ref} className="mx-auto flex max-w-3xl flex-col items-center text-center">
        {/* Rule that draws in — the same technique as the section dividers. */}
        <svg
          width="120"
          height="8"
          viewBox="0 0 120 8"
          fill="none"
          aria-hidden
          className="mb-10"
        >
          <path
            className="path-draw"
            data-drawn={drawn || undefined}
            style={{ '--path-length': '120' } as React.CSSProperties}
            d="M0 4 H 52"
            stroke="var(--color-smaya-gold)"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            className="path-draw"
            data-drawn={drawn || undefined}
            style={
              { '--path-length': '30', transitionDelay: '180ms' } as React.CSSProperties
            }
            d="M60 1 L 65 4 L 60 7 L 55 4 Z"
            stroke="var(--color-smaya-gold)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            className="path-draw"
            data-drawn={drawn || undefined}
            style={
              { '--path-length': '120', transitionDelay: '320ms' } as React.CSSProperties
            }
            d="M120 4 H 68"
            stroke="var(--color-smaya-gold)"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>

        <RevealText
          stagger={140}
          className="font-serif text-[1.75rem] leading-[1.3] tracking-[-0.015em] text-smaya-charcoal sm:text-4xl lg:text-[2.75rem]"
        >
          <span>One cohesive team.</span>
          <span>Absolute ownership from</span>
          <span>
            concept to{' '}
            <span className="italic font-light text-smaya-gold-deep">
              curtain-up
            </span>
            .
          </span>
        </RevealText>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, delay: 0.45, ease: EASE_OUT }}
          className="mt-8 max-w-lg text-[15px] font-light leading-relaxed text-smaya-charcoal/60 sm:text-base"
        >
          From an intimate sangeeth to a breathtaking festival for thousands,
          our visionary planners are the experts standing beside you on the day.
          Never outsourced. Always exceptional.
        </motion.p>
      </div>
    </section>
  )
}
