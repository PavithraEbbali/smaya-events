'use client'

import Link from 'next/link'
import { motion, type Transition } from 'framer-motion'
import { ArrowLeft, Sparkles, Users } from 'lucide-react'

import type { Vertical } from '@/data/verticals'
import { viewportOnce } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { VerticalCtaLink } from './VerticalCtaLink'

/* -------------------------------------------------------------------------- *
 * Palette
 *
 * GOLD IS A LIGHT COLOUR, and that governs every decision in this file.
 * #C5A880 measures 7.90:1 on #1E0F35 and 5.90:1 on #3A225F — excellent as TEXT
 * on the deep purple grounds below. On the one LIGHT section (workshops) the
 * same value collapses to 2.21:1, so gold text there uses `smaya-gold-deep`
 * (#887023, 4.67:1) and the pale gold is confined to rules and borders.
 *
 * Gold BUTTONS always carry charcoal labels — the shared `default` button
 * variant already does this, because white on gold is about 1.9:1.
 * -------------------------------------------------------------------------- */

const GOLD = '#C5A880'
const PLUM = '#3A225F'
const PLUM_DEEP = '#1E0F35'

const SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 }

/* -------------------------------------------------------------------------- *
 * Shared pieces
 * -------------------------------------------------------------------------- */

/** The gold-foil action. Charcoal label, shimmer sweep, generous target. */
function GoldAction({
  vertical,
  className,
}: {
  vertical: Vertical
  className?: string
}) {
  return (
    <VerticalCtaLink
      href={vertical.cta.href}
      label={vertical.cta.label}
      vertical={vertical.slug}
      surface="footer-band"
      className={cn(
        'w-full px-10 text-xs font-black uppercase tracking-[0.2em] shadow-xl sm:w-auto sm:px-14',
        className,
      )}
    />
  )
}

function AllServices({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link
      href="/services"
      data-tap
      className={cn(
        'group inline-flex min-h-11 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2',
        /* charcoal/70, not /60. At /60 this measured 4.47:1 on the cream
           ground — close enough to look fine and still under AA. /70 is
           6.20:1. It is 11px text, so it gets no large-text exemption. */
        tone === 'light'
          ? 'text-smaya-charcoal/70 hover:text-smaya-gold-deep focus-visible:ring-offset-[#FDFCFB]'
          : 'text-white/65 hover:text-[#C5A880] focus-visible:ring-offset-[#1E0F35]',
      )}
    >
      <ArrowLeft
        size={14}
        aria-hidden
        className="transition-transform duration-300 group-hover:-translate-x-1"
      />
      All Services
    </Link>
  )
}

/** Eyebrow + serif title + optional body, shared spine for every layout. */
function CtaHeading({
  eyebrow,
  title,
  body,
  tone = 'dark',
  className,
}: {
  eyebrow?: string
  title: string
  body?: string
  tone?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {eyebrow && (
        <span
          className={cn(
            'mb-5 text-[11px] font-black uppercase tracking-[0.3em]',
            tone === 'light' ? 'text-smaya-gold-deep' : 'text-[#C5A880]',
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-5xl',
          tone === 'light' ? 'text-[#3A225F]' : 'text-white',
        )}
      >
        {title}
      </h2>
      {body && (
        <p
          className={cn(
            'mt-6 max-w-xl text-base font-light leading-relaxed sm:text-lg',
            tone === 'light' ? 'text-smaya-charcoal/70' : 'text-white/75',
          )}
        >
          {body}
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Dispatcher
 * -------------------------------------------------------------------------- */

export function VerticalCta({ vertical }: { vertical: Vertical }) {
  const reduced = usePrefersReducedMotion()

  switch (vertical.slug) {
    case 'corporate':
      return <BoardroomGrid vertical={vertical} reduced={reduced} />
    case 'fitness':
      return <EnergyPulse vertical={vertical} reduced={reduced} />
    case 'adventure':
      return <WildernessLookbook vertical={vertical} reduced={reduced} />
    case 'entertainment':
      return <StageSpotlight vertical={vertical} reduced={reduced} />
    case 'community':
      return <ConnectionMatrix vertical={vertical} reduced={reduced} />
    case 'workshops':
      return <ZenSanctuary vertical={vertical} reduced={reduced} />
    case 'celebrations':
      return <CelebrationArch vertical={vertical} reduced={reduced} />
    default:
      return <CelebrationArch vertical={vertical} reduced={reduced} />
  }
}

type SectionProps = { vertical: Vertical; reduced: boolean }

/* -------------------------------------------------------------------------- *
 * 1. Corporate — "The Executive Boardroom Grid"
 *
 * Absorbs `benefits`, which used to sit in its own ivory section directly above
 * a flat charcoal footer. Three numbered points and a call to action are one
 * argument, not two, so they now share a ground.
 * -------------------------------------------------------------------------- */

function BoardroomGrid({ vertical, reduced }: SectionProps) {
  const points = vertical.benefits ?? []

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3A225F] to-[#1E0F35] px-5 py-20 sm:px-6 sm:py-28">
      {/* Gold frame, inset — architecture rather than a border on the section,
          which would read as a hairline against the page edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 rounded-[2rem] border sm:inset-8"
        style={{ borderColor: `${GOLD}26` }}
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={SPRING}
        >
          <CtaHeading
            eyebrow="Why It Matters"
            title={vertical.cta.title}
            body={vertical.cta.body}
            className="mx-auto max-w-2xl items-center text-center"
          />
        </motion.div>

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
          {points.map((point, i) => (
            <motion.li
              key={point.title}
              initial={reduced ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ ...SPRING, delay: i * 0.09 }}
              whileHover={reduced ? undefined : { y: -6 }}
              /* `min-w-0`: a grid child defaults to `min-width:auto` and will
                 not shrink below its longest word. */
              className="min-w-0"
            >
              <div
                className="flex h-full flex-col rounded-2xl border p-7 backdrop-blur-xl transition-colors duration-500 sm:p-8"
                style={{
                  borderColor: `${GOLD}33`,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <span
                  className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full border font-mono text-sm font-bold"
                  style={{ borderColor: `${GOLD}59`, color: GOLD }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mb-3 break-words font-serif text-xl text-white sm:text-2xl">
                  {point.title}
                </h3>
                <p className="break-words text-sm font-light leading-relaxed text-white/70">
                  {point.desc}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-center gap-8">
          <GoldAction vertical={vertical} />
          <AllServices />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * 2. Fitness — "The Dynamic Energy Pulse"
 *
 * Absorbs `signature`. The three series were white blocks on a plum-to-coral
 * wash; they are now glass over a mesh, with the pulse on hover.
 * -------------------------------------------------------------------------- */

function EnergyPulse({ vertical, reduced }: SectionProps) {
  const items = vertical.signature?.items ?? []

  return (
    <section className="relative overflow-hidden bg-[#1E0F35] px-5 py-20 sm:px-6 sm:py-28">
      {/* Mesh blurs. Three soft ellipses, no blur filter — a real `blur-3xl` on
          a box this size is an expensive raster on mobile, and a wide radial
          gradient is visually identical here. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            `radial-gradient(ellipse 55% 45% at 12% 8%, ${GOLD}2E, transparent 70%)`,
            `radial-gradient(ellipse 50% 50% at 88% 20%, #5B348066, transparent 70%)`,
            `radial-gradient(ellipse 70% 45% at 50% 105%, ${GOLD}24, transparent 70%)`,
          ].join(','),
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={SPRING}
        >
          <CtaHeading
            eyebrow={vertical.signature?.title ?? 'Signature Series'}
            title={vertical.cta.title}
            body={vertical.cta.body}
            className="mx-auto max-w-2xl items-center text-center"
          />
        </motion.div>

        <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {items.map((item, i) => (
            <motion.li
              key={item}
              initial={reduced ? false : { opacity: 0, y: 28, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={viewportOnce}
              transition={{ ...SPRING, delay: i * 0.09 }}
              whileHover={reduced ? undefined : { y: -8 }}
              className={cn(
                'group min-w-0',
                /* Three items in a 2-col tablet grid leaves a stray; centring
                   the last one keeps the row deliberate. */
                items.length === 3 && i === 2 && 'sm:col-span-2 lg:col-span-1',
              )}
            >
              <div
                className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border p-9 text-center backdrop-blur-xl transition-all duration-500 sm:p-10"
                style={{
                  borderColor: `${GOLD}38`,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
              >
                {/* The pulse: a gold bloom that scales up from the centre on
                    hover. Behind the label, never over it. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 scale-75 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, ${GOLD}33, transparent 68%)`,
                  }}
                />
                <Sparkles
                  aria-hidden
                  size={22}
                  className="relative mb-4 transition-transform duration-500 group-hover:scale-110"
                  style={{ color: GOLD }}
                />
                <h3 className="relative break-words font-serif text-xl text-white sm:text-2xl">
                  {item}
                </h3>
              </div>
            </motion.li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-center gap-8">
          <GoldAction vertical={vertical} />
          <AllServices />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * 3. Adventure — "The Wilderness Lookbook Spotlight"
 *
 * Absorbs `band` ("The Smaya Tribe"). Two actions survive the merge: the
 * band's "See Upcoming Treks" leads, and the vertical's own contact CTA stays
 * as the quieter second option rather than being dropped.
 * -------------------------------------------------------------------------- */

function WildernessLookbook({ vertical, reduced }: SectionProps) {
  const band = vertical.band

  return (
    <section className="relative overflow-hidden bg-[#0B0910] px-5 py-20 sm:px-6 sm:py-28">
      {/* Forest-purple undertone under everything else. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 80% 60% at 50% 0%, #2A1B3D, transparent 72%)',
            `radial-gradient(ellipse 60% 50% at 15% 100%, #1B2E2466, transparent 70%)`,
          ].join(','),
        }}
      />

      {/*
        Topographic contour lines, drawn as nested rounded paths.
        `preserveAspectRatio="none"` lets the shape stretch to any viewport
        without a media query, and it sits at low opacity so it reads as terrain
        rather than as a chart.
      */}
      <svg
        aria-hidden
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: 0.16 }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M-50 ${300 - i * 34} C 180 ${232 - i * 30}, 330 ${336 - i * 30}, 560 ${268 - i * 32} S 980 ${190 - i * 28}, 1250 ${248 - i * 30}`}
            fill="none"
            stroke={GOLD}
            strokeWidth={i % 2 === 0 ? 1.1 : 0.6}
          />
        ))}
      </svg>

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={SPRING}
          className="flex flex-col items-center"
        >
          <CtaHeading
            eyebrow={band?.eyebrow ?? 'Community'}
            title={band?.title ?? vertical.cta.title}
            body={band?.body ?? vertical.cta.body}
            className="items-center"
          />

          <div className="mt-12 flex w-full flex-col items-center gap-6 sm:w-auto">
            {band && (
              <ButtonLink
                href={band.ctaHref}
                variant="outline"
                size="lg"
                wrapperClassName="w-full sm:w-auto"
                className="w-full px-10 text-xs font-black uppercase tracking-[0.2em] sm:w-auto sm:px-14"
              >
                {band.ctaLabel}
              </ButtonLink>
            )}

            <VerticalCtaLink
              href={vertical.cta.href}
              label={vertical.cta.label}
              vertical={vertical.slug}
              surface="footer-band"
              className="w-full border border-white/20 bg-transparent px-10 text-xs font-bold uppercase tracking-[0.2em] text-white/85 shadow-none hover:border-[#C5A880] hover:text-[#C5A880] sm:w-auto sm:px-14"
            />
          </div>

          <div className="mt-10">
            <AllServices />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * 4. Entertainment — "The Stage Spotlight & Backstage Pass"
 * -------------------------------------------------------------------------- */

function StageSpotlight({ vertical, reduced }: SectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-tr from-[#3A225F] via-[#4A2E7A] to-[#1E0F35] px-5 py-20 sm:px-6 sm:py-28">
      {/*
        Stage rig: three beams from above, skewed outward, plus a hot spot on
        the floor. Beams are conic-free — a linear gradient inside a rotated,
        clipped box is cheaper and behaves identically at these opacities.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[
          { left: '18%', rotate: -16 },
          { left: '50%', rotate: 0 },
          { left: '82%', rotate: 16 },
        ].map((beam, i) => (
          <span
            key={i}
            className="absolute top-[-18%] h-[130%] w-[26%] origin-top"
            style={{
              left: beam.left,
              transform: `translateX(-50%) rotate(${beam.rotate}deg)`,
              backgroundImage: `linear-gradient(to bottom, ${GOLD}33, transparent 72%)`,
              clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)',
            }}
          />
        ))}
        <span
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 46%, ${GOLD}2B, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={SPRING}
          className="flex flex-col items-center"
        >
          <CtaHeading
            eyebrow="Backstage Pass"
            title={vertical.cta.title}
            body={vertical.cta.body}
            className="items-center"
          />
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ ...SPRING, delay: 0.12 }}
          className="mt-12 w-full sm:w-auto"
        >
          {/* Pill, and glowing — the shadow is gold rather than black so the
              button reads as a lit object on a lit stage. */}
          <GoldAction
            vertical={vertical}
            className="rounded-full shadow-[0_0_34px_rgba(197,168,128,0.45)]"
          />
        </motion.div>

        <div className="mt-10">
          <AllServices />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * 5. Community — "The Circle of Connection Floating Matrix"
 *
 * The node labels come from the vertical's own service titles, so the matrix
 * says something true about what Smaya runs rather than inventing values copy.
 * -------------------------------------------------------------------------- */

function ConnectionMatrix({ vertical, reduced }: SectionProps) {
  const nodes = (vertical.grid?.services ?? []).slice(0, 6).map((s) => s.title)

  return (
    <section className="relative overflow-hidden bg-[#3A225F] px-5 py-20 sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            /* 0x66 (40%), not 0x80 (50%). The gold eyebrow sits directly on
               the top of this bloom: at 50% the blended ground is rgb(75,43,112)
               and the 11px eyebrow reads 4.94:1 — passing, but with nothing
               spare. At 40% the ground is rgb(71,41,108) and it reads 5.16:1. */
            `radial-gradient(ellipse 60% 50% at 50% 0%, #5B348066, transparent 70%)`,
            `radial-gradient(ellipse 70% 50% at 50% 100%, ${GOLD}1F, transparent 70%)`,
          ].join(','),
        }}
      />

      {/* The thread. One wide ellipse behind the pills reads as the circle that
          connects them, without needing to position nodes on an actual arc —
          which cannot survive a reflow to one column. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[360px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border lg:block"
        style={{ borderColor: `${GOLD}30` }}
      />

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={SPRING}
        >
          <CtaHeading
            eyebrow="Circle of Connection"
            title={vertical.cta.title}
            body={vertical.cta.body}
            className="mx-auto max-w-2xl items-center text-center"
          />
        </motion.div>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {nodes.map((node, i) => (
            <motion.li
              key={node}
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewportOnce}
              transition={{ ...SPRING, delay: i * 0.07 }}
              whileHover={reduced ? undefined : { y: -4 }}
            >
              <span
                className="inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-xs font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md transition-colors duration-500 hover:text-white"
                style={{
                  borderColor: `${GOLD}4D`,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <Users size={13} aria-hidden style={{ color: GOLD }} />
                {node}
              </span>
            </motion.li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-center gap-8">
          <GoldAction vertical={vertical} />
          <AllServices />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * 6. Workshops — "The Zen Sanctuary Split Frame"
 *
 * The only light section here, and therefore the only one where the pale brand
 * gold cannot be used for text — see the palette note at the top.
 * -------------------------------------------------------------------------- */

function ZenSanctuary({ vertical, reduced }: SectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#FDFCFB] px-5 py-20 sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 0%, ${GOLD}1A, transparent 70%)`,
        }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={SPRING}
        className="relative mx-auto max-w-3xl"
      >
        {/* Architectural frame: a thin rule on each side and a hairline box,
            which is the whole visual idea — stillness, held by structure. */}
        <div
          className="relative flex flex-col items-center border px-6 py-14 text-center sm:px-12 sm:py-20"
          style={{ borderColor: `${GOLD}4D` }}
        >
          {/* Corner ticks — four short rules that make the frame read as
              deliberate joinery rather than a plain outline. */}
          {[
            'left-0 top-0 border-l-2 border-t-2',
            'right-0 top-0 border-r-2 border-t-2',
            'left-0 bottom-0 border-b-2 border-l-2',
            'right-0 bottom-0 border-b-2 border-r-2',
          ].map((pos) => (
            <span
              key={pos}
              aria-hidden
              className={cn('absolute h-6 w-6', pos)}
              style={{ borderColor: GOLD }}
            />
          ))}

          <CtaHeading
            eyebrow="Sanctuary"
            title={vertical.cta.title}
            body={vertical.cta.body}
            tone="light"
            className="items-center"
          />

          <p className="mt-6 max-w-md font-serif text-lg italic text-smaya-gold-deep">
            Space to learn, room to breathe.
          </p>

          <div className="mt-12 w-full sm:w-auto">
            <GoldAction vertical={vertical} />
          </div>

          <div className="mt-10">
            <AllServices tone="light" />
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* -------------------------------------------------------------------------- *
 * 7. Celebrations — "The Royal Celebration Arch"
 * -------------------------------------------------------------------------- */

function CelebrationArch({ vertical, reduced }: SectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#3A225F] to-[#1E0F35] px-5 py-20 sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 55% 45% at 50% 12%, ${GOLD}26, transparent 70%)`,
        }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={SPRING}
        className="relative mx-auto max-w-3xl"
      >
        {/*
          THE ARCH. `rounded-t-full` on a tall box gives a true semicircular
          crown whose radius is half the width — so the arch scales with the
          viewport instead of being a fixed curve that flattens on mobile. The
          padding-top has to clear that crown, hence the generous pt.
        */}
        <div
          /*
            pt-28 on mobile, not pt-24. `rounded-t-full` clamps to a dome whose
            radius is HALF THE WIDTH — 167.5px at a 335px card — and text keeps
            its full rectangular measure regardless of the curve. At 96px down
            the dome is 304px across against a 287px text column: 8px a side.
            At 112px it is 316px across, so the clearance roughly doubles.
          */
          className="relative flex flex-col items-center rounded-t-full border px-6 pb-14 pt-28 text-center sm:px-14 sm:pb-16 sm:pt-32"
          style={{
            borderColor: `${GOLD}4D`,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Inner gold-foil line, following the same arch. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-t-full border sm:inset-5"
            style={{ borderColor: `${GOLD}26` }}
          />

          <div className="relative flex flex-col items-center">
            <CtaHeading title={vertical.cta.title} className="items-center" />

            {vertical.cta.body && (
              <p className="mt-6 max-w-md font-serif text-lg italic sm:text-xl" style={{ color: GOLD }}>
                {vertical.cta.body}
              </p>
            )}

            <div className="mt-12 w-full sm:w-auto">
              <GoldAction vertical={vertical} className="rounded-full" />
            </div>

            <div className="mt-10">
              <AllServices />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export { PLUM, PLUM_DEEP }
