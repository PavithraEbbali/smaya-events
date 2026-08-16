'use client'

import { useCallback, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, type Transition } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'

import type { ServiceCategory } from '@/data/services'
import type { Vertical, VerticalSlug } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { usePrefersReducedMotion } from '@/lib/hooks'

/* -------------------------------------------------------------------------- *
 * Motion
 * -------------------------------------------------------------------------- */

/** The brief's spring, used for the vault opening and everything that follows it. */
const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 30 }

/** Ambient lighting change. Slower than the vault — it is atmosphere, not content. */
const AMBIENT: Transition = { duration: 1.1, ease: [0.22, 1, 0.36, 1] }

/* -------------------------------------------------------------------------- *
 * Vault identity
 *
 * Keyed by category title to stay aligned with data/services.ts — an index
 * would silently pair the wrong foil and photograph with the wrong vault the
 * moment anyone reorders that array.
 *
 * The foils run gold to violet across the five, which is the "metallic
 * gold/purple" of the brief read as a spectrum rather than two flat choices.
 * Every value here is measured against the card ground further down.
 *
 * ARTWORK IS LOCAL, NOT UNSPLASH — a deliberate choice.
 *
 * The brief allows either. Remote hero images in this project have produced
 * `upstream image response timed out` and 500s on service routes, because
 * next/image proxies them at request time and a slow origin becomes a failed
 * page rather than a slow one. Local files cannot fail that way, and every
 * vault below is a distinct photograph already shipped with the site.
 *
 * Each is matched to its vault's brief by subject: the mandap scene the
 * celebrations vertical already uses for Weddings, the keynote floor, the yoga
 * pavilion, the camp rather than the trail, and the DJ rig for lasers and
 * haze. THIS MATCHING IS BY FILENAME AND EXISTING USAGE, NOT BY LOOKING —
 * worth a glance to confirm the mood reads as intended.
 *
 * All paths kebab-case: a filename with spaces needs percent-encoding in a
 * URL, and a capitalised path resolves on Windows (case-insensitive) but 404s
 * on the Linux host that serves production.
 * -------------------------------------------------------------------------- */

type Vault = { id: string; foil: string; glow: string; art: string }

const VAULTS: Record<string, Vault> = {
  'Weddings & Celebrations': {
    id: 'weddings',
    foil: '#D4AF37',
    glow: 'rgba(212,175,55,0.16)',
    art: '/image_3.png',                    /* royal mandap — celebrations' own Weddings artwork */
  },
  'Corporate Events': {
    id: 'corporate',
    foil: '#C5A880',
    glow: 'rgba(197,168,128,0.15)',
    art: '/corporate-conferences-realistic.jpg',
  },
  'Fitness & Wellness': {
    id: 'fitness',
    foil: '#C0A6C8',
    glow: 'rgba(192,166,200,0.15)',
    art: '/images/yoga-foundations.jpg', /* yoga pavilion, not the studio class */
  },
  'Adventure & Outdoors': {
    id: 'adventure',
    foil: '#AC9BD0',
    glow: 'rgba(172,155,208,0.15)',
    art: '/expedition-camping.jpg',       /* the camp itself, not the trail to it */
  },
  'Production & Entertainment': {
    id: 'production',
    foil: '#9D8CBF',
    glow: 'rgba(157,140,191,0.16)',
    art: '/performance-dj.jpg',            /* the rig with lasers and haze */
  },
}

/**
 * The brief's reading order — Corporate second rather than fourth.
 * `data/services.ts` keeps its own order for the rest of the site, so the
 * sequence lives here instead of reshuffling shared data.
 */
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

export function CategoryVaults({ categories, verticals }: Props) {
  const reduced = usePrefersReducedMotion()
  const baseId = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const ordered = ORDER.map((t) => categories.find((c) => c.title === t)).filter(
    (c): c is ServiceCategory => Boolean(c),
  )

  /*
    EXACTLY ONE VAULT IS OPEN, ALWAYS.

    A vault that can also close would let the reader reach a state where the
    page is five closed bars and nothing else — no services, and no active
    vault for the ambient lighting to key off. Clicking the open vault
    therefore keeps it open rather than collapsing it, which is the accordion
    behaving like a selection rather than five independent toggles.
  */
  const [open, setOpen] = useState(0)
  const active = ordered[open]
  const vault = VAULTS[active.title]

  /* Up/Down move between vault headers, Home/End jump to the ends — the
     accordion keyboard contract. Left/Right and the rest are left alone. */
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
    buttons.current[clamped]?.focus()
  }

  const select = useCallback((index: number) => setOpen(index), [])

  return (
    <div className="relative min-h-screen bg-[#050505]">
      {/* --------------------------- Ambient layer ------------------------ */}
      {/*
        `fixed`, so the lighting stays put while the vaults scroll through it.
        No ancestor here sets a transform, which would otherwise turn this into
        a merely-absolute layer bound to that ancestor's box.

        Cross-fade with NO `mode="wait"`: `wait` is a SEQUENCE, so the outgoing
        accent would have to finish leaving before the incoming one mounted and
        the page would flash bare between vaults.
      */}
      <div aria-hidden className="pointer-events-none fixed inset-0" data-ambient={vault.id}>
        <AnimatePresence initial={false}>
          <motion.div
            key={vault.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={AMBIENT}
          >
            <Image
              src={vault.art}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-[0.18] blur-[4px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 58% 44% at 14% 10%, ${vault.glow} 0%, transparent 64%), radial-gradient(ellipse 52% 40% at 88% 82%, ${vault.glow} 0%, transparent 62%)`,
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/*
          THE BRIEF'S GRADIENT, and it is safe here only because the artwork
          sits at 18% opacity.

          `to-transparent` means the top of the viewport gets no scrim at all,
          which would normally be exactly where a headline goes blind. At 18%
          even a pure-white photograph lands the ground around rgb(50,50,50),
          so white type still clears 12:1 there — measured, not assumed. Raise
          the image opacity and this stops being true, so the two numbers are a
          pair, not independent knobs.
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      </div>

      {/* -------------------------------- Hero ---------------------------- */}
      <header className="relative mx-auto max-w-6xl px-5 pb-10 pt-32 sm:px-6 sm:pb-14 sm:pt-36">
        <span className="flex items-center gap-3">
          <span aria-hidden className="h-px w-8" style={{ backgroundColor: `${vault.foil}88` }} />
          {/* `pr` matches the tracking — wide letter-spacing leaves a trailing
              gap that otherwise pushes the label off its rule. */}
          <span
            className="pr-[0.34em] font-mono text-[10px] font-bold uppercase tracking-[0.34em] transition-colors duration-700"
            style={{ color: vault.foil }}
          >
            Our Expertise
          </span>
        </span>

        <h1 className="mt-4 max-w-3xl text-balance font-serif text-[2.5rem] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.25rem] lg:text-[4rem]">
          The Category Vaults
        </h1>

        <p className="mt-5 max-w-xl text-[0.9375rem] leading-[1.75] text-white/70">
          Five divisions, each opening onto the work it holds. Select a vault to
          bring its services into focus.
        </p>
      </header>

      {/* ------------------------------- Vaults --------------------------- */}
      {/*
        ONE IMPLEMENTATION AT EVERY WIDTH, adapting inside itself.

        The brief describes a desktop matrix and a mobile stack, and building
        those as two layouts is precisely what lets one of them rot: the mobile
        path only gets exercised when someone remembers to look. A single
        accordion whose interior grid reflows from one column to three is the
        same design at every size, so a phone cannot receive a layout that a
        desktop never tested.
      */}
      <ul className="relative mx-auto flex max-w-6xl flex-col gap-4 px-5 pb-24 sm:px-6 sm:pb-28">
        {ordered.map((category, index) => (
          <VaultRow
            key={category.title}
            category={category}
            index={index}
            isOpen={index === open}
            baseId={baseId}
            verticals={verticals}
            reduced={reduced}
            onSelect={() => select(index)}
            onKeyDown={(e) => onKeyDown(e, index)}
            registerRef={(el) => {
              buttons.current[index] = el
            }}
          />
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * One vault
 * -------------------------------------------------------------------------- */

function VaultRow({
  category,
  index,
  isOpen,
  baseId,
  verticals,
  reduced,
  onSelect,
  onKeyDown,
  registerRef,
}: {
  category: ServiceCategory
  index: number
  isOpen: boolean
  baseId: string
  verticals: Record<VerticalSlug, Vertical>
  reduced: boolean
  onSelect: () => void
  onKeyDown: (event: React.KeyboardEvent) => void
  registerRef: (el: HTMLButtonElement | null) => void
}) {
  const vault = VAULTS[category.title]
  const Icon = getIcon(category.icon)
  const headerId = `${baseId}-vault-${index}`
  const panelId = `${baseId}-panel-${index}`

  return (
    <li
      data-vault={vault.id}
      data-open={isOpen}
      className="overflow-hidden rounded-3xl border transition-colors duration-500"
      style={{
        borderColor: isOpen ? `${vault.foil}66` : 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(9,9,12,0.62)',
        backdropFilter: 'blur(18px)',
        boxShadow: isOpen
          ? `0 30px 70px -40px rgba(0,0,0,0.98), inset 0 1px 0 ${vault.foil}33`
          : '0 20px 50px -40px rgba(0,0,0,0.9)',
      }}
    >
      {/* ------------------------------ Header ---------------------------- */}
      <h2>
        <button
          ref={registerRef}
          type="button"
          id={headerId}
          aria-expanded={isOpen}
          /* Only while the panel exists. A closed vault unmounts its panel, and
             an `aria-controls` pointing at a missing id is a broken reference —
             worse than none, since `aria-expanded` already tells the reader
             there is nothing open to jump to. */
          aria-controls={isOpen ? panelId : undefined}
          onClick={onSelect}
          onKeyDown={onKeyDown}
          data-vault-button={vault.id}
          className="flex w-full items-center gap-4 px-5 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset sm:gap-6 sm:px-7 sm:py-6"
          style={{ ['--tw-ring-color' as string]: vault.foil }}
        >
          <span
            aria-hidden
            className="shrink-0 font-mono text-[1.5rem] font-bold leading-none tracking-[-0.02em] transition-colors duration-500 sm:text-[2rem]"
            /*
              The closed state is recessive, NOT invisible. At 0.28 alpha this
              numeral measured 2.36:1 — under even the 3:1 allowance for large
              text, and it carries the vault's identity. 0.46 clears AA at
              4.5:1 while the open state still reads at roughly twice that, so
              the hierarchy survives without the dim state becoming unreadable.
            */
            style={{ color: isOpen ? vault.foil : 'rgba(255,255,255,0.46)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/*
            `min-w-0` is what actually prevents the overflow.

            A flex child defaults to `min-width: auto` and refuses to shrink
            below its longest unbreakable word, so a long division name pushes
            the header wider than the card instead of wrapping. This is the fix
            for that; `break-words` covers the pathological single-word case.
          */}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2.5">
              <Icon
                size={15}
                aria-hidden
                className="shrink-0 transition-colors duration-500"
                style={{ color: isOpen ? vault.foil : 'rgba(255,255,255,0.4)' }}
              />
              <span
                className="pr-[0.22em] font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/45"
              >
                {category.services.length} services
              </span>
            </span>
            <span className="mt-1.5 block break-words font-serif text-[1.25rem] font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-[1.625rem]">
              {category.title}
            </span>
          </span>

          <motion.span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: isOpen ? `${vault.foil}88` : 'rgba(255,255,255,0.16)' }}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={SPRING}
          >
            <ChevronDown
              size={16}
              style={{ color: isOpen ? vault.foil : 'rgba(255,255,255,0.6)' }}
            />
          </motion.span>
        </button>
      </h2>

      {/* ------------------------------- Panel ---------------------------- */}
      {/*
        HEIGHT IS ANIMATED DIRECTLY — the one deliberate departure from the
        brief, which asks for the `layout` prop.

        Framer performs layout animations by scaling, and a scaled box squashes
        its own text for the duration of the transition unless every child
        counter-animates. On an accordion whose entire payload is type, that
        distortion lands on the exact thing the reader is watching arrive.
        Animating `height: 'auto'` (which framer measures) with the brief's
        exact spring gives the same motion with nothing to distort.
      */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            data-panel={vault.id}
            initial={reduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 sm:px-7 sm:pb-7">
              <div
                aria-hidden
                className="mb-5 h-px w-full"
                style={{
                  background: `linear-gradient(90deg, ${vault.foil}55, transparent)`,
                }}
              />

              <p className="mb-6 max-w-xl break-words text-[0.875rem] leading-[1.7] text-white/70">
                {category.description}
              </p>

              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service, i) => (
                  <motion.li
                    key={service.title}
                    data-service={service.title}
                    initial={reduced ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: reduced ? 0 : 0.04 + i * 0.045 }}
                    whileHover={reduced ? undefined : { y: -4 }}
                    /* `h-full` makes every card fill its grid row, so a
                       three-line description does not leave its neighbour
                       short. */
                    className="group h-full rounded-2xl border border-white/10 bg-[#121115]/90 p-4 backdrop-blur-xl transition-colors sm:p-5"
                    style={{ boxShadow: '0 20px 44px -34px rgba(0,0,0,0.95)' }}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        aria-hidden
                        data-badge
                        className="mt-px shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold leading-[1.5]"
                        style={{
                          borderColor: `${vault.foil}55`,
                          color: vault.foil,
                          backgroundColor: 'rgba(5,5,5,0.5)',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <h3 className="break-words font-serif text-[1rem] font-bold leading-snug tracking-[-0.01em] text-white sm:text-[1.0625rem]">
                          {service.title}
                        </h3>
                        {/* `break-words` on the body too, not just the
                            heading — a guard that covers only the text that
                            looked most at risk is not a guard. */}
                        <p className="mt-1.5 break-words text-[0.78125rem] leading-[1.6] text-white/70">
                          {service.desc}
                        </p>
                      </span>
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* Through-links keep every vertical page reachable from this
                  hub — including the two with no vault of their own. */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {category.relatedSlugs.map((slug) => (
                  <Link
                    key={slug}
                    href={`/services/${slug}`}
                    data-through-link
                    className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/85 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                    style={{ ['--tw-ring-color' as string]: vault.foil }}
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
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </li>
  )
}
