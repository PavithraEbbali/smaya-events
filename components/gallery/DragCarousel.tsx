'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import type { PortfolioItem } from '@/data/portfolio'
import { EASE_OUT } from '@/lib/animations'
import { usePointerFine, usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'

type Props = {
  items: readonly PortfolioItem[]
  className?: string
}

/**
 * Edge-to-edge drag carousel.
 *
 * Built on a native `overflow-x` scroller rather than a transform track, which
 * matters more than it looks:
 *   - touch keeps real momentum, rubber-banding and scroll-chaining for free
 *   - keyboard users get arrow-key scrolling and normal focus scrolling
 *   - the scrollbar position stays honest, so scroll-snap works
 * Desktop click-and-drag is layered on top by translating pointer movement into
 * scrollLeft — the one thing the native scroller does not give you.
 */
export function DragCarousel({ items, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pointerFine = usePointerFine()
  const reduced = usePrefersReducedMotion()

  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const drag = useRef({ startX: 0, startScroll: 0, moved: 0 })

  const updateProgress = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateProgress()
    el.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      el.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [updateProgress])

  // Desktop click-and-drag. Never attached on touch — it would fight the
  // native scroller it is built on.
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerFine) return
    const el = trackRef.current
    if (!el) return
    drag.current = {
      startX: event.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
    }
    setDragging(true)
    el.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const el = trackRef.current
    if (!el) return
    const dx = event.clientX - drag.current.startX
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx))
    el.scrollLeft = drag.current.startScroll - dx
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragging(false)
    trackRef.current?.releasePointerCapture(event.pointerId)
  }

  // A drag that moved more than a few px should not also fire the link.
  const suppressClickAfterDrag = (event: React.MouseEvent) => {
    if (drag.current.moved > 6) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={suppressClickAfterDrag}
        className={cn(
          'no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 sm:gap-6',
          // Edge-to-edge: the rail bleeds past the page gutter on both sides.
          'px-5 sm:px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2))]',
          pointerFine && 'cursor-grab select-none',
          dragging && 'cursor-grabbing',
        )}
      >
        {items.map((item, i) => (
          <motion.figure
            key={item.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_OUT }}
            className="group relative shrink-0 snap-start"
          >
            <div
              className={cn(
                'relative overflow-hidden rounded-sm bg-smaya-charcoal/5',
                // Deliberately uneven widths so the rail has editorial rhythm.
                i % 3 === 0
                  ? 'h-[58vh] max-h-[560px] w-[86vw] sm:w-[58vw] lg:w-[46rem]'
                  : 'h-[46vh] max-h-[440px] w-[74vw] sm:w-[40vw] lg:w-[30rem]',
              )}
            >
              <Image
                src={item.img}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 86vw, (max-width: 1024px) 58vw, 46rem"
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-smaya-charcoal/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>

            <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-smaya-charcoal/12 pt-3">
              <h3 className="font-serif text-lg leading-tight transition-colors duration-500 group-hover:text-smaya-plum sm:text-2xl">
                {item.title}
              </h3>
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-smaya-gold-deep">
                {item.category}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      {/* Progress rail — also the affordance that tells you it drags. */}
      <div className="mx-5 mt-8 flex items-center gap-5 sm:mx-6">
        <span className="relative h-px flex-1 bg-smaya-charcoal/15">
          <motion.span
            className="absolute inset-y-0 left-0 block bg-smaya-gold-deep"
            style={{ width: `${Math.max(6, progress * 100)}%` }}
            transition={{ ease: EASE_OUT }}
          />
        </span>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.25em] text-smaya-charcoal/45">
          {pointerFine ? 'Drag' : 'Swipe'}
        </span>
      </div>
    </div>
  )
}
