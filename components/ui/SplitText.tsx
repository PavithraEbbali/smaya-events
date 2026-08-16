'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { loadSplitText } from '@/lib/gsap'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/**
 * Constrained deliberately, not `ElementType`.
 *
 * @react-three/fiber augments React's JSX.IntrinsicElements with every three.js
 * object, so a broad `ElementType` resolves to an enormous union and TypeScript
 * collapses the props to `never`. Listing the tags this component is actually
 * used with keeps it polymorphic without tripping over that.
 */
type TextTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span'

type Props = {
  children: ReactNode
  className?: string
  as?: TextTag
  /** `scrub` ties progress to scroll position; `enter` plays once on entry. */
  mode?: 'scrub' | 'enter' | 'load'
  /** Split granularity handed to GSAP SplitText. */
  split?: 'lines' | 'words' | 'chars' | 'lines,words' | 'lines,chars'
  delay?: number
  stagger?: number
  /**
   * `lift` — lines rise out of their mask (the section-heading default).
   * `assemble` — characters swing up and rotate into place from below the
   * baseline, so the headline visibly constructs itself rather than fading in.
   */
  variant?: 'lift' | 'assemble'
}

/**
 * GSAP SplitText headline reveal. In `scrub` mode the assembly is tied to the
 * scrollbar (Section 4, item 2) rather than firing once on entry.
 *
 * Renders the real text on the server, so it is present for crawlers and shows
 * unstyled-but-correct if JS never runs.
 */
export function SplitText({
  children,
  className,
  as: Tag = 'h2',
  mode = 'enter',
  split = 'lines',
  delay = 0,
  stagger = 0.08,
  variant = 'lift',
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    loadSplitText().then(({ gsap, ScrollTrigger, SplitText: Split }) => {
      if (cancelled || !ref.current) return

      const instance = new Split(el, {
        type: split,
        linesClass: 'split-line',
        // Keeps each line clipped inside its own overflow-hidden wrapper.
        mask: split.includes('lines') ? 'lines' : undefined,
        autoSplit: true,
      })

      const targets = split.includes('chars')
        ? instance.chars
        : split.includes('words')
          ? instance.words
          : instance.lines

      const ctx = gsap.context(() => {
        const assembling = variant === 'assemble'

        // `assemble` swings each glyph up around its own baseline; `lift`
        // slides whole lines out from behind their mask.
        const from = assembling
          ? { yPercent: 130, rotateX: -85, opacity: 0, scaleY: 1.25 }
          : { yPercent: 110, opacity: 0 }

        const to = {
          yPercent: 0,
          opacity: 1,
          ...(assembling ? { rotateX: 0, scaleY: 1 } : null),
          duration: mode === 'scrub' ? 1 : assembling ? 1.25 : 1.1,
          ease: assembling ? 'expo.out' : 'power4.out',
          stagger: assembling ? { each: stagger, from: 'start' as const } : stagger,
          delay: mode === 'load' ? delay : 0,
        }

        if (assembling) {
          gsap.set(el, { perspective: 700 })
          gsap.set(targets, { transformOrigin: '50% 100% -20px' })
        }

        if (mode === 'scrub') {
          gsap.fromTo(targets, from, {
            ...to,
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              end: 'top 42%',
              scrub: true,
            },
          })
        } else if (mode === 'enter') {
          gsap.fromTo(targets, from, {
            ...to,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          })
        } else {
          gsap.fromTo(targets, from, to)
        }
      }, el)

      ScrollTrigger.refresh()

      cleanup = () => {
        ctx.revert()
        instance.revert()
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [reduced, mode, split, delay, stagger, variant])

  return (
    // The tag is chosen at runtime, so the ref's concrete element type cannot
    // be known statically. GSAP only ever needs a generic HTMLElement here.
    <Tag ref={ref as React.Ref<never>} className={cn(className)}>
      {children}
    </Tag>
  )
}
