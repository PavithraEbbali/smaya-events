'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  mp4: string
  /** Lighter cut for small viewports and data-saver connections. */
  mobileMp4?: string
  poster: string
  /** Decorative by default — the heading carries the meaning. */
  posterAlt?: string
  className?: string
  /** Set on the page's LCP hero so the poster is not lazy-loaded. */
  priority?: boolean
}

/** Narrow shape of the Network Information API, which TS does not ship types for. */
type Connection = { saveData?: boolean; effectiveType?: string }

/**
 * Looping hero footage with the poster as a real fallback rather than a
 * placeholder.
 *
 * The poster image is always rendered underneath; the video fades in over it
 * only once a frame is actually decodable. So a missing file, a slow
 * connection, a codec the browser refuses, or `prefers-reduced-motion` all land
 * on the same well-composed still instead of a black rectangle.
 *
 * Source selection happens in JS rather than via `<source media>`, which Safari
 * ignores — a phone would otherwise download the desktop cut.
 */
export function HeroVideo({
  mp4,
  mobileMp4,
  poster,
  posterAlt = '',
  className,
  priority = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduced = usePrefersReducedMotion()
  const [src, setSrc] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reduced) {
      setSrc(null)
      return
    }

    const connection = (
      navigator as Navigator & { connection?: Connection }
    ).connection
    const effectiveType = connection?.effectiveType

    // Data-saver, or a genuinely poor pipe: the poster alone is a perfectly
    // good hero, and pushing ~800KB there is user-hostile.
    if (connection?.saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
      setSrc(null)
      return
    }

    // Otherwise everyone gets footage — a mid-tier connection gets the lighter
    // cut rather than being cut off entirely.
    const small = window.matchMedia('(max-width: 768px)').matches
    const preferLight = small || effectiveType === '3g'
    setSrc(preferLight && mobileMp4 ? mobileMp4 : mp4)
  }, [reduced, mp4, mobileMp4])

  // Some browsers reach a playable state before React attaches the handler.
  useEffect(() => {
    const video = videoRef.current
    if (video && video.readyState >= 3) setReady(true)
  }, [src])

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <Image
        src={poster}
        alt={posterAlt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-center"
      />

      {src && (
        <video
          ref={videoRef}
          key={src}
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000',
            ready ? 'opacity-100' : 'opacity-0',
          )}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onCanPlay={() => setReady(true)}
          onError={() => setReady(false)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  )
}

export default HeroVideo
