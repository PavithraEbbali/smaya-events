'use client'

import { motion } from 'framer-motion'

import { fadeUp, viewportOnce } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { SplitText } from './SplitText'

type Props = {
  eyebrow?: string
  /** Leading, non-accented part of the headline. */
  title: string
  /** Rendered in gold italic — the house headline pattern. */
  accent?: string
  body?: string
  align?: 'center' | 'left'
  tone?: 'light' | 'dark'
  /** Tie the assembly to scroll position rather than a one-shot entrance. */
  scrub?: boolean
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  titleClassName?: string
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  body,
  align = 'center',
  tone = 'light',
  scrub = false,
  className,
  as = 'h2',
  titleClassName,
}: Props) {
  const centered = align === 'center'

  return (
    <div
      className={cn(
        'flex flex-col',
        centered ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <motion.span
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className={cn(
            'mb-4 block text-xs font-black uppercase tracking-[0.25em]',
            tone === 'dark' ? 'text-smaya-gold' : 'text-smaya-plum',
          )}
        >
          {eyebrow}
        </motion.span>
      )}

      <SplitText
        as={as}
        mode={scrub ? 'scrub' : 'enter'}
        className={cn(
          'font-serif font-black leading-[1.05] tracking-tight',
          'text-3xl sm:text-4xl md:text-5xl',
          tone === 'dark' ? 'text-white' : 'text-smaya-charcoal',
          titleClassName,
        )}
      >
        {title}
        {accent && (
          <>
            {' '}
            <span className="italic font-light text-smaya-gold">{accent}</span>
          </>
        )}
      </SplitText>

      {body && (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className={cn(
            'mt-6 max-w-2xl text-base leading-relaxed sm:text-lg',
            tone === 'dark' ? 'text-white/70' : 'text-smaya-charcoal/70',
          )}
        >
          {body}
        </motion.p>
      )}
    </div>
  )
}
