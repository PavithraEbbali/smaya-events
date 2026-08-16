'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import type { ServiceCategory } from '@/data/services'
import type { Vertical, VerticalSlug } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { getLenis } from '@/lib/lenis-instance'
import { usePrefersReducedMotion } from '@/lib/hooks'

/* -------------------------------------------------------------------------- *
 * Layout constants
 *
 * The site header is `position: fixed` at 77px, so it does not occupy layout
 * and anything sticky has to be told to clear it explicitly. Measured rather
 * than assumed — a wrong value here hides the top of every chapter behind the
 * navigation, and only on the jump, which is easy to miss.
 * -------------------------------------------------------------------------- */

const NAV_H = 77
/** Breathing room between the pill bar and the chapter heading it lands on. */
const JUMP_GAP = 28

/* -------------------------------------------------------------------------- *
 * Per-chapter identity
 *
 * Keyed by category title to stay aligned with data/services.ts — an index
 * would silently pair the wrong anchor and photograph with the wrong chapter
 * the moment anyone reorders that array.
 *
 * All local files, all kebab-case: a filename with spaces needs
 * percent-encoding in a URL, and a capitalised path resolves on Windows
 * (case-insensitive) but 404s on the Linux host that serves production.
 * -------------------------------------------------------------------------- */

type Chapter = { id: string; short: string; art: string }

const CHAPTERS: Record<string, Chapter> = {
  'Weddings & Celebrations': {
    id: 'weddings',
    short: 'Weddings',
    art: '/sangeeth-initial-16x9.png',
  },
  'Corporate Events': {
    id: 'corporate',
    short: 'Corporate',
    art: '/corporate-conferences-realistic.jpg',
  },
  'Fitness & Wellness': {
    id: 'fitness',
    short: 'Fitness',
    art: '/images/zumba-training.jpg',
  },
  'Adventure & Outdoors': {
    id: 'adventure',
    short: 'Adventure',
    art: '/expedition-treks.jpg',
  },
  'Production & Entertainment': {
    id: 'production',
    short: 'Production',
    art: '/performance-concert.jpg',
  },
}

/**
 * The brief's reading order — Corporate second rather than fourth.
 * `data/services.ts` keeps its own order for the rest of the site, so the
 * sequence is expressed here instead of reshuffling shared data.
 */
const ORDER = [
  'Weddings & Celebrations',
  'Corporate Events',
  'Fitness & Wellness',
  'Adventure & Outdoors',
  'Production & Entertainment',
]

const GOLD = '#C5A880'

/* -------------------------------------------------------------------------- *
 * Page
 * -------------------------------------------------------------------------- */

type Props = {
  categories: ServiceCategory[]
  verticals: Record<VerticalSlug, Vertical>
}

export function ChapterFeed({ categories, verticals }: Props) {
  const reduced = usePrefersReducedMotion()
  const barRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState(CHAPTERS[ORDER[0]].id)

  /* Ordered for this page without mutating the shared array. */
  const ordered = ORDER.map((title) => categories.find((c) => c.title === title)).filter(
    (c): c is ServiceCategory => Boolean(c),
  )

  /*
    WHICH CHAPTER IS THE READER IN?

    The observer's top margin excludes the strip already covered by the header
    and the pill bar, so a chapter only counts as current once it clears the
    furniture — without it the chapter above stays "active" while its heading
    sits hidden behind the bar. The bottom margin keeps exactly one chapter
    eligible at a time rather than every section that happens to be on screen.
  */
  useEffect(() => {
    const barH = barRef.current?.offsetHeight ?? 0
    const sections = ORDER.map((t) => document.getElementById(CHAPTERS[t].id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (!sections.length || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: `-${NAV_H + barH}px 0px -55% 0px`, threshold: 0 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  /*
    Smooth scroll HANDS OFF TO LENIS where it exists.

    Lenis reasserts scroll position every frame, so a native
    `scrollTo({behavior:'smooth'})` gets overwritten mid-flight and the jump
    stutters or stops short. The offset clears the fixed header plus the pill
    bar, which is why the bar is measured rather than guessed.
  */
  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const barH = barRef.current?.offsetHeight ?? 0
    const target = el.getBoundingClientRect().top + window.scrollY - NAV_H - barH - JUMP_GAP
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(target, { duration: 1.1 })
    else window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* -------------------------------- Hero ---------------------------- */}
      <header className="mx-auto max-w-7xl px-5 pb-12 pt-32 sm:px-6 sm:pb-16 sm:pt-36">
        <span className="flex items-center gap-3">
          <span aria-hidden className="h-px w-8" style={{ backgroundColor: `${GOLD}88` }} />
          {/* `pr` matches the tracking — wide letter-spacing leaves a trailing
              gap that otherwise pushes the label off its rule. */}
          <span
            className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em]"
            style={{ color: GOLD }}
          >
            Our Expertise
          </span>
        </span>

        <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.5rem] lg:text-[4.25rem]">
          Comprehensive{' '}
          <span style={{ color: GOLD }}>Experiences</span>
        </h1>

        <p className="mt-6 max-w-2xl text-[0.9375rem] leading-[1.75] text-white/70 sm:text-base">
          From the grandest luxury weddings to empowering fitness festivals and
          scenic adventure camps, our expertise spans the full spectrum of live
          experiences.
        </p>
      </header>

      {/* --------------------------- Sticky pill bar ---------------------- */}
      {/*
        `top` is the header's measured height, so the bar parks directly beneath
        it. z-40 keeps it above the chapters but below the header's z-50, so the
        two never fight over the same strip of screen.

        NOTHING IN THIS ELEMENT'S ANCESTRY MAY SET `overflow: hidden` — an
        ancestor that does becomes the scroll container sticky resolves against,
        and the bar silently stops sticking. The chapters below each clip their
        own artwork, which is safe precisely because they are siblings of this
        bar rather than its parents.
      */}
      <div
        ref={barRef}
        data-pillbar
        className="sticky z-40 border-y border-white/10 bg-[#050505]/85 backdrop-blur-xl"
        style={{ top: NAV_H }}
      >
        <nav
          aria-label="Jump to service category"
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ordered.map((category, i) => {
            const chapter = CHAPTERS[category.title]
            const current = chapter.id === activeId
            return (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                data-pill={chapter.id}
                data-current={current}
                aria-current={current ? 'true' : undefined}
                onClick={(event) => {
                  /* Only take over the plain left-click. Modified clicks and
                     middle-clicks keep their normal browser behaviour, so the
                     anchor still works as an anchor. */
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
                  event.preventDefault()
                  jumpTo(chapter.id)
                }}
                className="group inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                style={{
                  borderColor: current ? `${GOLD}88` : 'rgba(255,255,255,0.12)',
                  backgroundColor: current ? 'rgba(197,168,128,0.12)' : 'transparent',
                }}
              >
                <span
                  className="font-mono text-[10px] font-bold tracking-[0.18em]"
                  style={{ color: current ? GOLD : 'rgba(255,255,255,0.5)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="whitespace-nowrap text-[0.8125rem] font-bold tracking-[-0.01em]"
                  style={{ color: current ? '#FFFFFF' : 'rgba(255,255,255,0.78)' }}
                >
                  {chapter.short}
                </span>
              </a>
            )
          })}
        </nav>
      </div>

      {/* ------------------------------ Chapters -------------------------- */}
      {ordered.map((category, index) => (
        <ChapterSection
          key={category.title}
          category={category}
          index={index}
          verticals={verticals}
          reduced={reduced}
          priority={index === 0}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One chapter
 * -------------------------------------------------------------------------- */

function ChapterSection({
  category,
  index,
  verticals,
  reduced,
  priority,
}: {
  category: ServiceCategory
  index: number
  verticals: Record<VerticalSlug, Vertical>
  reduced: boolean
  priority: boolean
}) {
  const chapter = CHAPTERS[category.title]
  const Icon = getIcon(category.icon)

  return (
    <section
      id={chapter.id}
      data-chapter={chapter.id}
      /* `scroll-mt` covers arrivals this component does not control — a pasted
         URL with a hash, or the browser restoring one — which would otherwise
         land with the heading tucked under the header and the pill bar. */
      className="relative scroll-mt-40 overflow-hidden border-b border-white/[0.06] px-5 py-16 sm:px-6 sm:py-20 lg:py-24"
    >
      {/* --------------------------- Ambient art -------------------------- */}
      {/*
        Texture, not subject: heavily blurred, held at low opacity and faded out
        before it reaches the copy. The gradient beneath guarantees the floor,
        so legibility never depends on which photograph is behind the words.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0" data-ambient={chapter.art}>
        <Image
          src={chapter.art}
          alt=""
          fill
          sizes="100vw"
          priority={priority}
          className="object-cover opacity-[0.16] blur-[3px]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,5,5,0.86) 0%, rgba(5,5,5,0.93) 42%, rgba(5,5,5,0.97) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 46% at ${
              index % 2 === 0 ? '12%' : '88%'
            } 8%, rgba(197,168,128,0.10) 0%, transparent 64%)`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* ---------------------------- Heading --------------------------- */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        >
          {/* `flex-wrap` + `min-w-0`: the number, rule and title share a row on
              a wide screen and wrap cleanly on a narrow one instead of forcing
              the rule to squash or the title to overflow. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span
              className="font-mono text-[11px] font-bold tracking-[0.28em]"
              style={{ color: GOLD }}
              data-chapter-number
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden className="h-px w-10 shrink-0" style={{ backgroundColor: `${GOLD}55` }} />
            <Icon size={17} aria-hidden className="shrink-0" style={{ color: GOLD }} />
          </div>

          <h2 className="mt-4 max-w-3xl text-balance font-serif text-[1.875rem] font-bold leading-[1.06] tracking-[-0.03em] text-white sm:text-[2.5rem] lg:text-[3rem]">
            {category.title}
          </h2>

          <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.7] text-white/70">
            {category.description}
          </p>

          {/* Through-links keep every vertical page reachable from this hub —
              including the two that have no chapter of their own. */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {category.relatedSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/services/${slug}`}
                data-through-link
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/85 outline-none transition-colors hover:border-[#C5A880] hover:text-[#C5A880] focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
              >
                {verticals[slug].name}
                <ArrowRight
                  size={13}
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* --------------------------- Bento grid -------------------------- */}
        <motion.ul
          initial={reduced ? undefined : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {category.services.map((service) => (
            <motion.li
              key={service.title}
              data-service={service.title}
              variants={
                reduced
                  ? undefined
                  : {
                      hidden: { opacity: 0, y: 22 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { type: 'spring', stiffness: 240, damping: 26 },
                      },
                    }
              }
              /* `h-full` makes every card fill its grid row, so a three-line
                 description does not leave its neighbour short. */
              whileHover={reduced ? undefined : { y: -4 }}
              className="group h-full rounded-2xl border border-white/10 bg-[#121115]/80 p-5 backdrop-blur-xl transition-colors hover:border-[#C5A880]/45 sm:p-6"
              style={{ boxShadow: '0 24px 48px -32px rgba(0,0,0,0.95)' }}
            >
              <span className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full transition-shadow"
                  style={{ backgroundColor: GOLD, boxShadow: `0 0 10px ${GOLD}` }}
                />
                {/*
                  `min-w-0` is what actually prevents the overflow.

                  A flex child defaults to `min-width: auto`, which refuses to
                  shrink below its longest unbreakable word — so a long service
                  name pushes the card wider than its grid column instead of
                  wrapping. This is the fix for that, and `break-words` handles
                  the pathological single-word case.
                */}
                <span className="min-w-0 flex-1">
                  <h3 className="break-words font-serif text-[1.0625rem] font-bold leading-snug tracking-[-0.01em] text-white sm:text-[1.125rem]">
                    {service.title}
                  </h3>
                  {/* `break-words` here too, not just on the heading. Stress
                      testing showed the protected title survived a 102-char
                      unbreakable token while the unprotected description
                      clipped on a long URL — the guard has to cover every text
                      node in the card, not the one that looked most at risk. */}
                  <p className="mt-2 break-words text-[0.8125rem] leading-[1.6] text-white/70">
                    {service.desc}
                  </p>
                </span>
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
