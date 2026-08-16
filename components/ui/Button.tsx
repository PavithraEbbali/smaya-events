'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const baseClasses =
  'inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-smaya-gold disabled:pointer-events-none disabled:opacity-50'

/**
 * The gold `default` variant carries the shimmer sweep (globals.css `.shimmer`)
 * rather than a flat hover colour.
 */
const variantClasses: Record<ButtonVariant, string> = {
  default: 'shimmer text-smaya-charcoal shadow-md hover:text-smaya-charcoal',
  outline: 'border border-smaya-gold text-smaya-gold hover:bg-smaya-gold/10',
  ghost: 'hover:bg-smaya-charcoal hover:text-white',
  link: 'text-smaya-gold underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'min-h-11 px-8 py-2',
  sm: 'min-h-11 px-4 text-xs sm:min-h-9',
  lg: 'min-h-14 px-10 text-base',
  icon: 'h-11 w-11',
}

export function buttonClasses(
  variant: ButtonVariant = 'default',
  size: ButtonSize = 'default',
  className?: string,
) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /**
   * Classes for the motion wrapper, not the control itself.
   *
   * The wrapper is `inline-block`, so it shrinks to fit its content — which
   * means a `w-full` passed via `className` resolves to 100% of a shrink-wrapped
   * box and does nothing. Stretching a button (full-width on mobile, say) has to
   * happen here.
   */
  wrapperClassName?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      wrapperClassName,
      variant = 'default',
      size = 'default',
      ...props
    },
    ref,
  ) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('inline-block', wrapperClassName)}
    >
      <button
        className={buttonClasses(variant, size, className)}
        ref={ref}
        data-tap
        {...props}
      />
    </motion.div>
  ),
)
Button.displayName = 'Button'

export interface ButtonLinkProps
  extends Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> {
  href: React.ComponentProps<typeof Link>['href']
  variant?: ButtonVariant
  size?: ButtonSize
  /** See `ButtonProps.wrapperClassName` — required for full-width buttons. */
  wrapperClassName?: string
}

/** Same treatment as `Button`, but renders a real `next/link` anchor. */
const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      className,
      wrapperClassName,
      variant = 'default',
      size = 'default',
      ...props
    },
    ref,
  ) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('inline-block', wrapperClassName)}
    >
      <Link
        className={buttonClasses(variant, size, className)}
        ref={ref}
        data-tap
        {...props}
      />
    </motion.div>
  ),
)
ButtonLink.displayName = 'ButtonLink'

export { Button, ButtonLink }
