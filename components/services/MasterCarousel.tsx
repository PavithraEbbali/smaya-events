'use client'

import { useCallback, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import type { ServiceCategory } from '@/data/services'
import type { Vertical, VerticalSlug } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { usePrefersReducedMotion, useWideViewport } from '@/lib/hooks'

/* -------------------------------------------------------------------------- *
 * Stage artwork
 *
 * Keyed by category title to stay aligned with data/services.ts — an index
 * would silently pair the wrong photograph with the wrong stage the moment
 * anyone reorders that array.
 *
 * All local files, all kebab-case: a filename with spaces needs
 * percent-encoding in a URL, and a capitalised path resolves on Windows
 * (case-insensitive) but 404s on the Linux host that serves production. Both
 * are silent locally, which is the worst place for them to hide.
 * -------------------------------------------------------------------------- */

const STAGE_ART: Record<string, string> = {
  'Weddings & Celebrations': '/sangeeth-initial-16x9.png',
  'Fitness & Wellness': '/images/zumba-training.jpg',
  'Adventure & Outdoors': '/expedition-treks.jpg',
  'Corporate Events': '/corporate-conferences-realistic.jpg',
  'Production & Entertainment': '/performance-concert.jpg',
}

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

const GOLD = '#D4AF37'

/** Weighty, but it still has to feel responsive to a click. */
const SPRING: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }

/** The backdrop dissolve. Slower than the cards — it is scenery, not content. */
const DISSOLVE: Transition = { duration: 0.9, ease: [0.22, 1, 0.36, 1] }

/**
 * The fan. Cards arrive from the right, slightly rotated and offset, and
 * settle into the grid — `custom` carries the direction so a backwards move
 * fans in from the other side rather than always sweeping one way.
 */
const CARD_FAN: Variants = {
  hidden: (dir: number) => ({ opacity: 0, x: 46 * dir, y: 18, rotate: 2.5 * dir }),
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: { ...SPRING, delay: 0.05 + i * 0.055 },
  }),
  exit: { opacity: 0, transition: { duration: 0.22 } },
}

/* -------------------------------------------------------------------------- *
 * Component
 * -------------------------------------------------------------------------- */

type Props = {
  categories: ServiceCategory[]
  verticals: Record<VerticalSlug, Vertical>
}

export function MasterCarousel({ categories, verticals }: Props) {
  const reduced = usePrefersReducedMotion()
  /*
    Only the EXIT duration depends on this, never the layout.

    Below `sm` the grids flow rather than float, so an outgoing grid that
    lingers would sit stacked above the incoming one and shove the page for the
    length of its exit. Retiring it instantly there keeps the swap clean, while
    wide screens — where the grids are absolute and genuinely overlap — keep
    the cross-fade.
  */
  const wide = useWideViewport()
  const baseId = useId()
  const [active, setActive] = useState(0)
  /* +1 forward, -1 back. Only used to point the entry animation the right way,
     so it never needs to survive a re-render as anything but a hint. */
  const [dir, setDir] = useState<1 | -1>(1)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const total = categories.length
  const category = categories[active]
  const Icon = getIcon(category.icon)

  const go = useCallback(
    (next: number, direction: 1 | -1) => {
      setDir(direction)
      setActive(((next % total) + total) % total)
    },
    [total],
  )

  /*
    ROVING TABINDEX, the standard tablist keyboard contract.

    Arrow keys move between stages and Home/End jump to the ends, with focus
    following selection — without this the bottom bar is five separate tab
    stops that a keyboard user must step through one at a time, and the arrow
    keys they would naturally reach for do nothing at all.
  */
  const onTabKeyDown = (event: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: total - 1,
    }
    const next = map[event.key]
    if (next === undefined) return
    event.preventDefault()
    const clamped = ((next % total) + total) % total
    go(clamped, event.key === 'ArrowLeft' || event.key === 'Home' ? -1 : 1)
    tabRefs.current[clamped]?.focus()
  }

  const stageNumber = String(active + 1).padStart(2, '0')

  return (
    <section
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#050505]"
      aria-roledescription="carousel"
      aria-label="Service categories"
    >
      {/* ------------------------- Cinematic backdrop ---------------------- */}
      {/*
        Cross-fade with NO `mode="wait"`. `wait` is a SEQUENCE — the outgoing
        image would have to finish leaving before the incoming one mounts, so
        the stage would flash black between categories. Overlapping is what the
        word cross-fade actually describes.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0" data-backdrop={category.title}>
        <AnimatePresence initial={false}>
          <motion.div
            key={category.title}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: reduced ? 1 : 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={DISSOLVE}
          >
            <Image
              src={STAGE_ART[category.title]}
              alt=""
              fill
              sizes="100vw"
              priority={active === 0}
              /* Blur on the IMAGE, not a `backdrop-filter` on a layer above —
                 that would also blur the copy and the cards sitting on top,
                 which are the things that must stay sharp. */
              className="scale-105 object-cover blur-[7px]"
            />
          </motion.div>
        </AnimatePresence>

        {/*
          THE LEGIBILITY FLOOR, and why it is two layers.

          A photograph's local brightness is unknowable, so contrast has to be
          guaranteed by what sits above it rather than hoped for. The flat wash
          sets a worst case for the whole stage; the left-weighted gradient
          then buys extra darkness exactly where the headline sits.
        */}
        <div className="absolute inset-0 bg-[#050505]/74" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.78) 38%, rgba(5,5,5,0.55) 66%, rgba(5,5,5,0.80) 100%)',
          }}
        />
        {/* Warm key light, top left — the "cinematic lighting" of the brief. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 46% 52% at 14% 18%, rgba(212,175,55,0.13) 0%, transparent 66%)',
          }}
        />
      </div>

      {/* ------------------------------- Stage ----------------------------- */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col px-6 pb-10 pt-28 sm:pt-32">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
          {/* ---------------------------- Left copy ------------------------ */}
          {/*
            THE ARROWS MUST NOT MOVE WHEN THE COPY DOES.

            Titles wrap to different depths and two of the five categories
            carry a second through-link, so a column that simply stacked copy
            above controls moved them by up to 42px per change — measured at
            285-327px — which slides the buttons out from under the pointer
            mid-click. So the column reserves the same height as the card well
            beside it, centres the copy in the space that is left, and pins the
            controls to the bottom. Structural, not a tuned magic number.
          */}
          <div
            role="tabpanel"
            id={`${baseId}-panel-${active}`}
            aria-labelledby={`${baseId}-tab-${active}`}
            data-stage={category.title}
            className="flex min-h-[420px] flex-col lg:min-h-[440px]"
          >
            <div className="flex flex-1 items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={category.title}
                  className="w-full"
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                transition={SPRING}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="font-mono text-[11px] font-bold tracking-[0.3em]"
                    style={{ color: GOLD }}
                    data-counter
                  >
                    {stageNumber}
                    <span className="text-white/40"> / {String(total).padStart(2, '0')}</span>
                  </span>
                  <span aria-hidden className="h-px w-10" style={{ backgroundColor: `${GOLD}66` }} />
                  <Icon size={16} aria-hidden style={{ color: GOLD }} />
                </span>

                <h2 className="mt-5 max-w-xl font-serif text-[2.5rem] font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-[3.25rem] lg:text-[3.75rem]">
                  {category.title}
                </h2>

                <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.7] text-white/75">
                  {category.description}
                </p>

                {/* Through-links to the vertical pages that carry the detail. */}
                <div className="mt-7 flex flex-wrap gap-2.5">
                  {category.relatedSlugs.map((slug) => (
                    <Link
                      key={slug}
                      href={`/services/${slug}`}
                      data-through-link
                      className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/90 outline-none transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
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
              </AnimatePresence>
            </div>

            {/* --------------------------- Arrows ---------------------------- */}
            {/* Outside the AnimatePresence on purpose: the controls stay mounted
                and stationary while the copy above them changes. */}
            <div className="flex items-center gap-3 pt-8">
              <StageArrow
                label="Previous category"
                onClick={() => go(active - 1, -1)}
                data-prev
              >
                <ArrowLeft size={17} aria-hidden />
              </StageArrow>
              <StageArrow label="Next category" onClick={() => go(active + 1, 1)} data-next>
                <ArrowRight size={17} aria-hidden />
              </StageArrow>
            </div>
          </div>

          {/* -------------------------- Sub-services ----------------------- */}
          {/*
            FIXED-HEIGHT WELL, GRIDS ABSOLUTE INSIDE IT.

            Categories carry between three and six services, so a grid that
            occupied layout would resize the stage on every change — and
            cross-fading two of them would briefly stack both. Reserving the
            tallest case and floating each grid inside means the stage cannot
            move, whatever is showing.
          */}
          {/*
            THE WELL IS A WIDE-SCREEN DEVICE, and deliberately absent below
            `sm`. Absolutely positioned children do not expand their parent, so
            on a phone the six celebration cards stood 678px tall inside a
            420px well and spilled over the selector bar beneath. Sizing the
            well for the worst case instead would leave a three-card category
            floating in ~360px of nothing.

            Below `sm` the grid simply flows and the well takes its height from
            it; from `sm` up the grid floats and the well holds the stage
            steady. Expressed in CSS rather than from a media-query hook, so
            the very first paint is already correct on both.
          */}
          <div className="sm:relative sm:min-h-[380px] lg:min-h-[440px]" data-well>
            <AnimatePresence initial={false} custom={dir}>
              <motion.ul
                key={category.title}
                custom={dir}
                initial="hidden"
                animate="show"
                exit="exit"
                variants={{ exit: { opacity: 0, transition: { duration: wide ? 0.22 : 0 } } }}
                className="grid content-center gap-3 sm:absolute sm:inset-0 sm:grid-cols-2 sm:gap-4"
                data-grid={category.title}
              >
                {category.services.map((service, i) => (
                  <motion.li
                    key={service.title}
                    custom={reduced ? 0 : i}
                    variants={reduced ? undefined : CARD_FAN}
                    data-service={service.title}
                    /*
                      DARK frosted glass, not light.

                      Light glass takes its brightness from whatever photograph
                      happens to be behind it, so its contrast changes per
                      category and per pixel. A dark pane sets the floor itself
                      and the accents stay readable over any of the five
                      stages.
                    */
                    className="rounded-2xl border border-white/12 p-4 backdrop-blur-xl sm:p-5"
                    style={{
                      backgroundColor: 'rgba(9,9,12,0.62)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.09), 0 20px 40px -28px rgba(0,0,0,0.95)',
                    }}
                  >
                    <span className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: GOLD, boxShadow: `0 0 10px ${GOLD}` }}
                      />
                      <span className="min-w-0">
                        <h3 className="font-serif text-[1.0625rem] font-bold leading-snug tracking-[-0.01em] text-white sm:text-[1.125rem]">
                          {service.title}
                        </h3>
                        <p className="mt-1.5 text-[0.8125rem] leading-[1.55] text-white/70">
                          {service.desc}
                        </p>
                      </span>
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>

        {/* ------------------------ Category selector ---------------------- */}
        <div
          role="tablist"
          aria-label="Service categories"
          onKeyDown={onTabKeyDown}
          data-tablist
          className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((item, i) => {
            const selected = i === active
            return (
              <button
                key={item.title}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${i}`}
                /* Roving: only the selected tab is in the tab order, so the
                   whole bar is one stop and the arrows move within it. */
                tabIndex={selected ? 0 : -1}
                onClick={() => go(i, i > active ? 1 : -1)}
                data-tab={i}
                data-selected={selected}
                className="group relative shrink-0 rounded-xl px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                style={{
                  backgroundColor: selected ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <span
                  className="block font-mono text-[10px] font-bold tracking-[0.2em]"
                  style={{ color: selected ? GOLD : 'rgba(255,255,255,0.55)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="mt-1 block whitespace-nowrap font-serif text-[0.875rem] font-bold tracking-[-0.01em]"
                  style={{ color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.72)' }}
                >
                  {item.title}
                </span>

                {/* One shared underline that slides between tabs, rather than
                    five that fade in and out independently. */}
                {selected && (
                  <motion.span
                    layoutId="stage-underline"
                    aria-hidden
                    className="absolute inset-x-3 bottom-1 h-px"
                    style={{ backgroundColor: GOLD }}
                    transition={SPRING}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * Arrow control
 * -------------------------------------------------------------------------- */

function StageArrow({
  label,
  onClick,
  children,
  ...rest
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
} & React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/85 outline-none transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
      {...rest}
    >
      {children}
    </button>
  )
}
