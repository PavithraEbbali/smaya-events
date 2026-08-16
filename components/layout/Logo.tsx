import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type Props = {
  /** `light` = for dark backgrounds (ivory monogram + white wordmark). */
  tone?: 'light' | 'dark'
  className?: string
  wordmarkClassName?: string
  size?: number
  href?: string | null
  showWordmark?: boolean
}

/**
 * The supplied "SA" monogram artwork plus the serif SMAYA EVENTS wordmark.
 * Both PNGs are tight, background-keyed crops of the original file in
 * /public/logo — the artwork itself is untouched beyond the crop and, for the
 * light variant, a contrast recolour of the navy strokes.
 */
export function Logo({
  tone = 'dark',
  className,
  wordmarkClassName,
  size = 36,
  href = '/',
  showWordmark = true,
}: Props) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src={
          tone === 'light'
            ? '/logo/smaya-monogram-light.png'
            : '/logo/smaya-monogram.png'
        }
        alt=""
        width={size}
        height={size}
        priority
        className="shrink-0"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span
          className={cn(
            'font-serif text-base font-bold uppercase leading-none tracking-[0.18em] sm:text-lg',
            tone === 'light' ? 'text-white' : 'text-smaya-charcoal',
            wordmarkClassName,
          )}
        >
          Smaya
          <span className="text-smaya-gold">.</span>
          <span className="ml-1.5 hidden text-[0.6em] tracking-[0.3em] opacity-70 sm:inline">
            Events
          </span>
        </span>
      )}
    </span>
  )

  if (!href) return content

  return (
    <Link
      href={href}
      aria-label="Smaya Events — home"
      className="relative z-50 inline-flex items-center"
      data-tap
    >
      {content}
    </Link>
  )
}
