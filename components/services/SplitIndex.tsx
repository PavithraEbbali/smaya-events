'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import type { ServiceCategory } from '@/data/services'
import type { Vertical, VerticalSlug } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { usePrefersReducedMotion } from '@/lib/hooks'

/* -------------------------------------------------------------------------- *
 * Chapter identity
 *
 * Keyed by category title to stay aligned with data/services.ts — an index
 * would silently pair the wrong accent and photograph with the wrong chapter
 * the moment anyone reorders that array.
 *
 * Artwork is local rather than remote: next/image proxies remote files at
 * request time, and this project has had heroes time out and 500 a route.
 * Paths are kebab-case — spaces need percent-encoding, and a capitalised path
 * resolves on Windows but 404s on the Linux host that serves production.
 * -------------------------------------------------------------------------- */

type Chapter = { badge: string; accent: string; art: string; tagline: string }

const CHAPTERS: Record<string, Chapter> = {
  'Weddings & Celebrations': {
    badge: '01',
    accent: '#C5A880',
    art: '/image_3.png',
    tagline: 'Every ritual, held with the same care as the vows.',
  },
  'Corporate Events': {
    badge: '02',
    accent: '#C5A880',
    art: '/corporate-conferences-realistic.jpg',
    tagline: 'Rooms that make the announcement land.',
  },
  'Fitness & Wellness': {
    badge: '03',
    accent: '#9D8CBF',
    art: '/images/yoga-foundations.jpg',
    tagline: 'Movement as an occasion, not an obligation.',
  },
  'Adventure & Outdoors': {
    badge: '04',
    accent: '#C5A880',
    art: '/expedition-camping.jpg',
    tagline: 'Far from the city, nothing left to chance.',
  },
  'Production & Entertainment': {
    badge: '05',
    accent: '#9D8CBF',
    art: '/performance-dj.jpg',
    tagline: 'The machinery behind the moment nobody notices.',
  },
}

/** The brief's reading order — Corporate second rather than fourth. */
const ORDER = [
  'Weddings & Celebrations',
  'Corporate Events',
  'Fitness & Wellness',
  'Adventure & Outdoors',
  'Production & Entertainment',
]

/* -------------------------------------------------------------------------- *
 * Page
 * -------------------------------------------------------------------------- */

type Props = {
  categories: ServiceCategory[]
  verticals: Record<VerticalSlug, Vertical>
}

export function SplitIndex({ categories, verticals }: Props) {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  const items = useRef<(HTMLButtonElement | null)[]>([])

  const ordered = ORDER.map((t) => categories.find((c) => c.title === t)).filter(
    (c): c is ServiceCategory => Boolean(c),
  )

  /* Up/Down move through the index, Home/End jump to the ends. Selection
     follows focus, which is what makes the showcase track a keyboard user. */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const map: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: ordered.length - 1,
    }
    const next = map[event.key]
    if (next === undefined) return
    event.preventDefault()
    const clamped = ((next % ordered.length) + ordered.length) % ordered.length
    setActive(clamped)
    items.current[clamped]?.focus()
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 sm:pb-28 sm:pt-36">
      {/* -------------------------------- Hero ---------------------------- */}
      <header className="mx-auto mb-12 max-w-7xl px-5 sm:mb-16 sm:px-6">
        <span className="flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[#C5A880]/60" />
          {/* `pr` matches the tracking — wide letter-spacing leaves a trailing
              gap that otherwise pushes the label off its rule. */}
          <span className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em] text-[#C5A880]">
            Index of Services
          </span>
        </span>

        <h1 className="mt-4 max-w-3xl text-balance font-serif text-[2.5rem] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.25rem] lg:text-[4rem]">
          Five divisions, one standard.
        </h1>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-12">
        {/* ---------------------------- Left index ----------------------- */}
        {/*
          Desktop only — on a phone the chapters below ARE the index, so a
          second list would just be the same five headings twice. `display:
          none` also takes it out of the accessibility tree, so nothing is
          announced twice either.
        */}
        <nav
          aria-label="Service divisions"
          data-index
          className="hidden lg:sticky lg:top-28 lg:col-span-4 lg:block"
        >
          <ul className="flex flex-col">
            {ordered.map((category, i) => {
              const chapter = CHAPTERS[category.title]
              const current = i === active
              return (
                <li key={category.title}>
                  <button
                    ref={(el) => {
                      items.current[i] = el
                    }}
                    type="button"
                    data-index-item={chapter.badge}
                    data-current={current}
                    aria-current={current ? 'true' : undefined}
                    /* Selection follows hover, focus AND click — the showcase
                       should track however the reader is driving it. */
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className="group flex w-full items-baseline gap-3 border-b border-white/[0.08] py-5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ['--tw-ring-color' as string]: chapter.accent }}
                  >
                    <span
                      aria-hidden
                      className="shrink-0 font-mono text-[11px] font-bold tracking-[0.2em] transition-colors duration-300"
                      /*
                        0.50, not 0.45. The idle numeral is 11px mono, so it
                        needs 4.5:1 — and 0.45 measured 4.42, missing by the
                        width of a rounding error. 0.50 gives 5.30 and the
                        active state still reads brighter, so the hierarchy is
                        intact.
                      */
                      style={{ color: current ? chapter.accent : 'rgba(255,255,255,0.50)' }}
                    >
                      {chapter.badge}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 font-mono text-[11px] transition-colors duration-300"
                      style={{ color: current ? `${chapter.accent}99` : 'rgba(255,255,255,0.25)' }}
                    >
                      //
                    </span>
                    {/* `min-w-0` + `break-words`: a flex child defaults to
                        `min-width:auto` and refuses to shrink below its longest
                        word, which is how a long division name widens the
                        column instead of wrapping inside it. */}
                    <span
                      className="min-w-0 flex-1 break-words font-serif text-[1.125rem] font-bold leading-tight tracking-[-0.02em] transition-colors duration-300 xl:text-[1.25rem]"
                      style={{ color: current ? '#FFFFFF' : 'rgba(255,255,255,0.62)' }}
                    >
                      {category.title}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* --------------------------- Right showcase --------------------- */}
        {/*
          THE CONTENT IS RENDERED ONCE AND PRESENTED TWICE.

          The brief describes a desktop split-screen and a mobile chapter
          stack, which is normally built as two blocks of markup — and then the
          two drift, because only one of them gets looked at. Here each chapter
          exists exactly once: below `lg` they flow as a vertical stack, and at
          `lg` they become absolutely stacked layers that cross-fade in place.
          Same DOM, same content, no duplication to fall out of sync.

          The switch is pure CSS, so the very first paint is already correct on
          both — a media-query hook would resolve one frame late and flash five
          chapters at once on a desktop.
        */}
        <div className="relative flex flex-col gap-8 sm:gap-10 lg:col-span-8 lg:block lg:min-h-[80vh]">
          {ordered.map((category, i) => (
            <ChapterPanel
              key={category.title}
              category={category}
              chapter={CHAPTERS[category.title]}
              isActive={i === active}
              verticals={verticals}
              reduced={reduced}
              priority={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One chapter
 * -------------------------------------------------------------------------- */

function ChapterPanel({
  category,
  chapter,
  isActive,
  verticals,
  reduced,
  priority,
}: {
  category: ServiceCategory
  chapter: Chapter
  isActive: boolean
  verticals: Record<VerticalSlug, Vertical>
  reduced: boolean
  priority: boolean
}) {
  const Icon = getIcon(category.icon)

  return (
    <section
      data-chapter={chapter.badge}
      data-active={isActive}
      aria-label={category.title}
      /*
        `lg:invisible` IS DOING THE WORK OF `inert`.

        `visibility: hidden` removes an element from the tab order and the
        accessibility tree, which is exactly what an inactive layer needs —
        without it a keyboard user tabs into four invisible chapters stacked
        underneath the visible one. Opacity alone would not do this; opacity 0
        content is still focusable and still announced.

        It also transitions cleanly alongside opacity, so the layer fades out
        and only then stops existing for input.
      */
      /*
        The transition is scoped to `lg` along with everything it animates.
        Left unscoped it also applied on a phone, where these panels are always
        visible and there is nothing to fade — harmless in place, but it made a
        resize across the breakpoint run a 700ms fade on all five at once.
      */
      className="relative min-h-[420px] overflow-hidden rounded-3xl border border-white/10 sm:min-h-[460px] lg:absolute lg:inset-0 lg:invisible lg:min-h-0 lg:opacity-0 lg:transition-[opacity,visibility] lg:duration-700 lg:data-[active=true]:visible lg:data-[active=true]:opacity-100"
    >
      {/* ------------------------------ Artwork ---------------------------- */}
      <Image
        src={chapter.art}
        alt=""
        fill
        sizes="(min-width: 1024px) 800px, 92vw"
        priority={priority}
        className="object-cover"
        /* Decorative: the heading carries the meaning, so `alt` stays empty
           rather than reading the division twice to a screen reader. */
      />

      {/*
        THE LEGIBILITY FLOOR, and why it is two layers.

        A photograph's local brightness is unknowable, so contrast has to be
        guaranteed by what sits above it rather than hoped for. The flat wash
        sets a worst case for the whole panel; the gradient then buys extra
        darkness exactly where the copy sits.
      */}
      <div aria-hidden className="absolute inset-0 bg-[#050505]/62" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"
      />

      {/* ------------------------------ Content ---------------------------- */}
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 lg:p-10">
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            data-badge
            className="font-mono text-[11px] font-bold tracking-[0.24em]"
            style={{ color: chapter.accent }}
          >
            {chapter.badge}
          </span>
          <span aria-hidden className="h-px w-8" style={{ backgroundColor: `${chapter.accent}66` }} />
          <Icon size={16} aria-hidden className="shrink-0" style={{ color: chapter.accent }} />
        </span>

        <h2 className="mt-3 break-words font-serif text-[1.75rem] font-bold leading-[1.06] tracking-[-0.03em] text-white sm:text-[2.25rem]">
          {category.title}
        </h2>

        <p className="mt-3 max-w-md break-words font-serif text-[1rem] italic leading-[1.5] text-white/80 sm:text-[1.125rem]">
          {chapter.tagline}
        </p>

        {/* --------------------------- Sub-services ----------------------- */}
        <motion.ul
          initial={reduced ? false : 'hidden'}
          animate={isActive || reduced ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {category.services.map((service) => (
            <motion.li
              key={service.title}
              data-service={service.title}
              variants={
                reduced
                  ? undefined
                  : {
                      hidden: { opacity: 0, y: 10 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { type: 'spring', stiffness: 300, damping: 30 },
                      },
                    }
              }
              className="rounded-xl border border-white/10 bg-[#0B0A0D]/75 px-3.5 py-2.5 backdrop-blur-sm"
            >
              <span className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: chapter.accent }}
                />
                {/* `min-w-0` again — same flex-shrink trap as the index. */}
                <span className="min-w-0 flex-1 break-words text-[0.8125rem] font-medium leading-[1.45] text-white/90">
                  {service.title}
                </span>
              </span>
            </motion.li>
          ))}
        </motion.ul>

        {/* Through-links keep every vertical page reachable from this hub —
            including the two with no chapter of their own. */}
        <div className="mt-5 flex flex-wrap gap-2">
          {category.relatedSlugs.map((slug) => (
            <Link
              key={slug}
              href={`/services/${slug}`}
              data-through-link
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
              style={{
                borderColor: `${chapter.accent}66`,
                color: chapter.accent,
                ['--tw-ring-color' as string]: chapter.accent,
              }}
            >
              {verticals[slug].name}
              <ArrowRight size={11} aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
