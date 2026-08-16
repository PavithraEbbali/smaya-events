'use client'

import { useCallback, type MouseEvent } from 'react'

import { ButtonLink } from '@/components/ui/Button'
import { MagneticButton } from '@/components/ui/MagneticButton'

/** Payload handed to the analytics layer when a vertical CTA is engaged. */
export interface CtaClickPayload {
  readonly vertical: string
  readonly label: string
  readonly destination: string
  readonly surface: 'hero' | 'footer-band'
}

type Props = {
  href: string
  label: string
  vertical: string
  surface: CtaClickPayload['surface']
  className?: string
  onEngage?: (payload: CtaClickPayload) => void
}

/**
 * The vertical CTA.
 *
 * It stays a real anchor. Converting it to a `<button>` with an onClick
 * navigate would cost middle-click, cmd-click, "open in new tab", the status-bar
 * URL preview and crawlability — so the typed handler runs *alongside*
 * navigation for intent tracking, and never calls preventDefault.
 */
export function VerticalCtaLink({
  href,
  label,
  vertical,
  surface,
  className,
  onEngage,
}: Props) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const payload: CtaClickPayload = {
        vertical,
        label,
        destination: href,
        surface,
      }

      onEngage?.(payload)

      // Fire-and-forget: a slow or missing analytics layer must never delay or
      // block the navigation the visitor actually asked for.
      try {
        window.dispatchEvent(
          new CustomEvent<CtaClickPayload>('smaya:cta', { detail: payload }),
        )
      } catch {
        /* no-op */
      }

      // `event` is intentionally not prevented — the anchor navigates as normal.
      void event
    },
    [href, label, vertical, surface, onEngage],
  )

  return (
    <MagneticButton className="w-full sm:w-auto">
      <ButtonLink
        href={href}
        size="lg"
        onClick={handleClick}
        data-cta-surface={surface}
        className={className}
      >
        {label}
      </ButtonLink>
    </MagneticButton>
  )
}
