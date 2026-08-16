'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { LottieRefCurrentProps } from 'lottie-react'

import { verticalList, type Accent, type VerticalSlug } from '@/data/verticals'
import { getIcon, type IconName } from '@/lib/icons'
import { loadGsap } from '@/lib/gsap'
import { staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'
import { usePointerFine, usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import {
  ServicesSectionBackdrop,
  ServicesSectionHeader,
} from './ServicesSectionHeader'
import { TiltCard } from '@/components/ui/TiltCard'

/* ------------------------------------------------------------------ *
 * Lottie player — lazy, client-only.
 *
 * `lottie-react` reaches for `document` during module evaluation, so it must
 * never be part of the server bundle. Note that the imperative handle arrives
 * through the component's own `lottieRef` PROP, not a React ref — next/dynamic
 * does not forward refs, so a ref would silently be null.
 * ------------------------------------------------------------------ */
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => null,
})

/* ------------------------------- Types ------------------------------ */

/** How a card's Lottie behaves. Discriminated so each branch is exhaustive. */
export type CardAnimation =
  /** Plays forever, untouched by hover (Celebrations' ambient drift). */
  | { readonly kind: 'ambient'; readonly speed: number }
  /** Plays forever, but the card layers other effects on top (campfire, crowd). */
  | { readonly kind: 'loop'; readonly speed: number }
  /** Holds on `idleFrame`; hover plays forward, leaving reverses back. */
  | { readonly kind: 'hoverSequence'; readonly idleFrame: number; readonly speed: number }

/** Non-Lottie flourishes a card can opt into. */
export interface CardEffects {
  /** GSAP scale/parallax push on the card's backdrop (Adventure). */
  readonly gsapZoom?: boolean
  /** Sweeping radial "DJ lights" across the card head (Entertainment). */
  readonly djLights?: boolean
}

/**
 * Footage filling the whole card. Playback is bound to viewport visibility,
 * so an off-screen card decodes nothing.
 */
export interface CardBackgroundVideo {
  readonly mp4: string
  /** Lighter cut for small viewports and mid-tier connections. */
  readonly mobileMp4?: string
  /** Rendered underneath; also the reduced-motion and slow-link fallback. */
  readonly poster: string
}

export interface CardProps {
  readonly id: VerticalSlug
  readonly title: string
  readonly description: string
  readonly lottiePath: string
  readonly href: string
  /** Rendered when the Lottie JSON is absent or malformed. */
  readonly icon: IconName
  readonly accent: Accent
  readonly animation: CardAnimation
  readonly effects?: CardEffects
  /** When present the card becomes a dark, video-backed tile. */
  readonly backgroundVideo?: CardBackgroundVideo
}

/** Minimal structural shape of a Bodymovin document. */
interface LottieDocument {
  readonly v: string
  readonly fr: number
  readonly op: number
  readonly layers: readonly unknown[]
  readonly [key: string]: unknown
}

/* --------------------------- Card definitions ------------------------ *
 * Copy and routing come from data/verticals.ts (single source of truth);
 * only presentation-level config lives here.
 * -------------------------------------------------------------------- */

const ANIMATION_BY_SLUG: Readonly<
  Record<
    VerticalSlug,
    {
      lottiePath: string
      animation: CardAnimation
      effects?: CardEffects
      backgroundVideo?: CardBackgroundVideo
    }
  >
> = {
  celebrations: {
    lottiePath: '/lottie/celebration.json',
    animation: { kind: 'ambient', speed: 0.35 },
  },
  corporate: {
    lottiePath: '/lottie/corporate.json',
    animation: { kind: 'hoverSequence', idleFrame: 0, speed: 1.6 },
  },
  fitness: {
    lottiePath: '/lottie/fitness.json',
    animation: { kind: 'hoverSequence', idleFrame: 0, speed: 1.3 },
  },
  adventure: {
    lottiePath: '/lottie/adventure.json',
    animation: { kind: 'loop', speed: 1 },
    effects: { gsapZoom: true },
  },
  entertainment: {
    lottiePath: '/lottie/entertainment.json',
    animation: { kind: 'loop', speed: 1 },
    effects: { djLights: true },
  },
  community: {
    lottiePath: '/lottie/community.json',
    animation: { kind: 'hoverSequence', idleFrame: 0, speed: 1.4 },
  },
  workshops: {
    lottiePath: '/lottie/workshops.json',
    animation: { kind: 'hoverSequence', idleFrame: 0, speed: 1.2 },
  },
}

/**
 * Every vertical ships a card clip under a predictable name, so the paths are
 * derived rather than restated seven times. Encoded as true 8s seamless loops
 * (see ai.wing → decisions.card-video-backgrounds for the ffmpeg recipe).
 */
function cardVideo(slug: VerticalSlug): CardBackgroundVideo {
  return {
    mp4: `/videos/${slug}-card.mp4`,
    mobileMp4: `/videos/${slug}-card-mobile.mp4`,
    poster: `/videos/${slug}-card-poster.jpg`,
  }
}

export const SERVICE_CARDS: readonly CardProps[] = verticalList.map((vertical) => ({
  id: vertical.slug,
  title: vertical.name,
  description: vertical.tagline,
  href: `/services/${vertical.slug}`,
  icon: vertical.icon,
  accent: vertical.accent,
  backgroundVideo: cardVideo(vertical.slug),
  ...ANIMATION_BY_SLUG[vertical.slug],
}))

/* ------------------------------- Hooks ------------------------------- */

/**
 * Fetches a Bodymovin document once the card is near the viewport.
 *
 * `lottie-react` takes parsed `animationData`, not a URL, so the JSON is
 * fetched here. Deferring until the card approaches the fold keeps seven
 * animation payloads off the critical path.
 */
function useLottieDocument(path: string, enabled: boolean) {
  const [data, setData] = useState<LottieDocument | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!enabled || data || failed) return
    let cancelled = false
    const controller = new AbortController()

    fetch(path, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} for ${path}`)
        return res.json() as Promise<unknown>
      })
      .then((json) => {
        if (cancelled) return
        // A 404 handled by an HTML fallback would parse but isn't a Lottie doc.
        const doc = json as LottieDocument
        if (!doc || typeof doc !== 'object' || !Array.isArray(doc.layers)) {
          throw new Error(`Not a Lottie document: ${path}`)
        }
        setData(doc)
      })
      .catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return
        setFailed(true)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [path, enabled, data, failed])

  return { data, failed } as const
}

/**
 * Tracks visibility continuously (unlike `useNearViewport`, which latches).
 * Card footage plays only while on screen, so a grid of them never decodes
 * more than what the visitor is actually looking at.
 */
function useIsVisible(ref: React.RefObject<Element | null>, threshold = 0.25) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold])

  return visible
}

/** Chooses the appropriate cut, or null when footage should be skipped. */
function useVideoSource(video: CardBackgroundVideo | undefined, reduced: boolean) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!video || reduced) {
      setSrc(null)
      return
    }
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    const effectiveType = connection?.effectiveType

    if (connection?.saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
      setSrc(null)
      return
    }
    const small = window.matchMedia('(max-width: 768px)').matches
    const preferLight = small || effectiveType === '3g'
    setSrc(preferLight && video.mobileMp4 ? video.mobileMp4 : video.mp4)
  }, [video, reduced])

  return src
}

/** True once the element has come within `rootMargin` of the viewport. */
function useNearViewport(ref: React.RefObject<Element | null>, rootMargin = '300px') {
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return near
}

/* ------------------------------ The card ----------------------------- */

function ServiceCard({ card, index }: { card: CardProps; index: number }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLSpanElement>(null)
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const reduced = usePrefersReducedMotion()
  const pointerFine = usePointerFine()
  const near = useNearViewport(rootRef)
  const { data, failed } = useLottieDocument(card.lottiePath, near && !reduced)

  const hasVideo = Boolean(card.backgroundVideo)
  const visible = useIsVisible(rootRef)
  const videoSrc = useVideoSource(card.backgroundVideo, reduced)
  const [videoReady, setVideoReady] = useState(false)

  const [hovered, setHovered] = useState(false)
  const Icon = getIcon(card.icon)
  const coral = card.accent === 'coral'
  const isContinuous = card.animation.kind === 'ambient' || card.animation.kind === 'loop'

  // Footage runs only while the card is on screen — it starts the moment the
  // card scrolls into view and stops the moment it leaves.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return
    if (visible) {
      void video.play().catch(() => {
        /* autoplay refused — the poster underneath still carries the card */
      })
    } else {
      video.pause()
    }
  }, [visible, videoSrc])

  /** Set the resting state once the animation is mounted and ready. */
  const handleReady = useCallback(() => {
    const player = lottieRef.current
    if (!player) return
    player.setSpeed(card.animation.speed)

    if (isContinuous) {
      player.play()
      return
    }
    // hoverSequence: hold the idle pose rather than autoplaying.
    player.goToAndStop(card.animation.idleFrame, true)
  }, [card.animation, isContinuous])

  // Reduced motion: freeze every card on its first frame, whatever its kind.
  useEffect(() => {
    if (!reduced) return
    lottieRef.current?.goToAndStop(0, true)
  }, [reduced, data])

  const handleEnter = useCallback(() => {
    if (!pointerFine || reduced) return
    setHovered(true)

    const player = lottieRef.current
    if (player && card.animation.kind === 'hoverSequence') {
      player.setDirection(1)
      player.play()
    }

    if (card.effects?.gsapZoom && backdropRef.current) {
      const target = backdropRef.current
      void loadGsap().then(({ gsap }) => {
        gsap.to(target, { scale: 1.14, duration: 0.7, ease: 'power3.out' })
      })
    }
  }, [pointerFine, reduced, card.animation.kind, card.effects?.gsapZoom])

  const handleLeave = useCallback(() => {
    if (!pointerFine || reduced) return
    setHovered(false)

    const player = lottieRef.current
    if (player && card.animation.kind === 'hoverSequence') {
      player.setDirection(-1)
      player.play()
    }

    if (card.effects?.gsapZoom && backdropRef.current) {
      const target = backdropRef.current
      void loadGsap().then(({ gsap }) => {
        gsap.to(target, { scale: 1, duration: 0.9, ease: 'power3.out' })
      })
    }
  }, [pointerFine, reduced, card.animation.kind, card.effects?.gsapZoom])

  // The icon is the resting visual until a valid document is in hand, so a
  // missing or malformed JSON degrades to the existing design rather than a
  // blank badge.
  const showLottie = Boolean(data) && !failed && !reduced

  return (
    <motion.div ref={rootRef} variants={staggerItem} className="h-full">
      <TiltCard glare className="group h-full">
        <Link
          href={card.href}
          data-tap
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onFocus={handleEnter}
          onBlur={handleLeave}
          aria-label={`${card.title} — ${card.description}`}
          className={cn(
            'relative flex h-full flex-col justify-between overflow-hidden rounded-2xl',
            'p-7 shadow-sm sm:p-8',
            'transition-[border-color,box-shadow] duration-500',
            'hover:border-smaya-gold hover:shadow-xl',
            hasVideo
              ? 'border border-white/10 bg-smaya-charcoal min-h-[19rem]'
              : 'border border-black/5 bg-white',
          )}
        >
          {/* Celebrations: footage fills the tile, poster underneath. */}
          {hasVideo && card.backgroundVideo && (
            <span aria-hidden className="absolute inset-0">
              <Image
                src={card.backgroundVideo.poster}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover object-center"
              />
              {videoSrc && (
                <video
                  ref={videoRef}
                  key={videoSrc}
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700',
                    videoReady ? 'opacity-100' : 'opacity-0',
                  )}
                  poster={card.backgroundVideo.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  onCanPlay={() => setVideoReady(true)}
                  onError={() => setVideoReady(false)}
                >
                  <source src={videoSrc} type="video/mp4" />
                </video>
              )}
              {/*
                Bottom-weighted scrim. The sangeet footage is busy and carries
                bright stage lighting, so the copy needs a real gradient beneath
                it rather than a flat tint — this keeps the faces readable at the
                top while the text block sits on near-solid charcoal.
              */}
              <span className="absolute inset-0 bg-gradient-to-t from-smaya-charcoal via-smaya-charcoal/75 to-smaya-charcoal/25" />
              <span className="absolute inset-0 bg-gradient-to-br from-smaya-plum/40 via-transparent to-transparent transition-opacity duration-700 group-hover:opacity-60" />
            </span>
          )}

          {/* Adventure: the layer GSAP pushes on hover. */}
          {card.effects?.gsapZoom && (
            <span
              ref={backdropRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 origin-center will-change-transform"
              style={{
                background:
                  'radial-gradient(120% 90% at 25% 15%, rgba(255,111,97,0.16) 0%, rgba(255,111,97,0) 62%)',
              }}
            />
          )}

          {/* Entertainment: sweeping DJ lights across the card head. */}
          {card.effects?.djLights && (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 h-32 transition-opacity duration-700',
                hovered ? 'opacity-100' : 'opacity-0',
              )}
            >
              <span className="absolute inset-0 bg-[radial-gradient(60%_120%_at_20%_0%,rgba(255,111,97,0.42)_0%,transparent_70%)]" />
              <span className="absolute inset-0 bg-[radial-gradient(55%_120%_at_50%_0%,rgba(212,175,55,0.40)_0%,transparent_70%)]" />
              <span className="absolute inset-0 bg-[radial-gradient(60%_120%_at_80%_0%,rgba(91,52,128,0.42)_0%,transparent_70%)]" />
            </span>
          )}

          <div className="relative">
            {/* Badge: Lottie when available, lucide icon otherwise. */}
            <span
              className={cn(
                'mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300',
                hasVideo
                  ? 'border border-white/20 bg-white/10 text-white backdrop-blur-md group-hover:bg-smaya-gold group-hover:text-smaya-charcoal'
                  : coral
                    ? 'bg-smaya-coral/15 text-smaya-coral group-hover:bg-gradient-to-br group-hover:from-smaya-plum group-hover:to-smaya-coral group-hover:text-white'
                    : 'bg-smaya-plum/10 text-smaya-plum group-hover:bg-gradient-to-br group-hover:from-smaya-plum group-hover:to-smaya-gold group-hover:text-white',
              )}
            >
              {showLottie && data ? (
                <Lottie
                  lottieRef={lottieRef}
                  animationData={data}
                  loop={isContinuous}
                  autoplay={false}
                  onDOMLoaded={handleReady}
                  className="h-9 w-9"
                  rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                  aria-hidden
                />
              ) : (
                <Icon
                  size={26}
                  aria-hidden
                  className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                />
              )}
            </span>

            <h3
              className={cn(
                'mb-3 font-serif text-2xl font-black transition-colors',
                hasVideo
                  ? 'text-white drop-shadow-[0_1px_10px_rgba(28,27,31,0.9)] group-hover:text-smaya-gold'
                  : 'text-smaya-charcoal group-hover:text-smaya-plum',
              )}
            >
              {card.title}
            </h3>
            <p
              className={cn(
                'text-sm leading-relaxed',
                hasVideo
                  ? 'text-white/80 drop-shadow-[0_1px_8px_rgba(28,27,31,0.85)]'
                  : 'text-smaya-charcoal/60',
              )}
            >
              {card.description}
            </p>
          </div>

          <span className="relative mt-7 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-smaya-gold">
            Explore
            <ArrowRight
              size={15}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </span>

          {/* Ordinal, purely decorative. */}
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute right-5 top-5 font-mono text-[10px] tabular-nums',
              hasVideo ? 'text-white/45' : 'text-smaya-charcoal/15',
            )}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        </Link>
      </TiltCard>
    </motion.div>
  )
}

/* ------------------------------ The grid ----------------------------- */

export function ServicesGrid({ cards = SERVICE_CARDS }: { cards?: readonly CardProps[] }) {
  /*
    Top and bottom padding are set separately below — this was `py-20 sm:py-24
    lg:py-28`, symmetric.

    The section sits directly under the hero's stats bar, a dense dark band with
    its own internal padding. 112px of ivory on top of that, plus the descender
    rule below it, opened a ~220px void before the eyebrow with a hairline
    floating in the middle of it. The bottom keeps the full section rhythm; only
    the top, already cushioned by the band above, gives.
  */
  return (
    <section className="relative z-20 overflow-hidden bg-smaya-ivory px-5 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-12 lg:pb-28 lg:pt-14">
      <ServicesSectionBackdrop />

      <div className="relative mx-auto max-w-7xl">
        <ServicesSectionHeader />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((card, index) => (
            <ServiceCard key={card.id} card={card} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default ServicesGrid
