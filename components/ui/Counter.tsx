'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

import { usePrefersReducedMotion } from '@/lib/hooks'

type Props = {
  end: number
  duration?: number
  suffix?: string
}

/** Eased count-up that fires once the number scrolls into view. */
export function Counter({ end, duration = 2, suffix = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    if (reduced) {
      setCount(end)
      return
    }

    let startTime: number | undefined
    let frame: number

    const update = (timestamp: number) => {
      startTime ??= timestamp
      const percentage = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const easeOut = 1 - Math.pow(1 - percentage, 3)
      setCount(Math.floor(easeOut * end))
      if (percentage < 1) frame = requestAnimationFrame(update)
    }

    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [isInView, end, duration, reduced])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}
