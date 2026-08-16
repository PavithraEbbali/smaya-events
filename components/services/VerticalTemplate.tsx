'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import type { Vertical } from '@/data/verticals'
import {
  EASE_OUT,
  staggerContainer,
  staggerItem,
  staggerItemScale,
  slideInLeft,
  slideInRight,
  viewportOnce,
} from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { HeroVideo } from '@/components/ui/HeroVideo'
import { IconBadge } from '@/components/ui/IconBadge'
import { ServiceCardGrid } from './ServiceCardGrid'
import { VerticalCta } from './VerticalCta'
import { WorkshopAtelier } from '@/components/services/WorkshopAtelier'
import { SplitText } from '@/components/ui/SplitText'

const ParticleField = dynamic(() => import('@/components/ui/ParticleField'), {
  ssr: false,
})

/**
 * One template for all seven verticals. Each keeps its full original content —
 * the only thing that varies structurally is which optional blocks
 * (`benefits`, `signature`, `band`, two-column `columns`) the vertical defines.
 *
 * Accent leans coral for the "energy" verticals and plum for the luxury ones,
 * per the colour usage rules.
 */
export function VerticalTemplate({ vertical }: { vertical: Vertical }) {
  const coral = vertical.accent === 'coral'
  const accent = coral ? 'coral' : 'plum'
  const hasVideo = Boolean(vertical.heroVideo)

  const heroRef = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()

  // Backdrop lags the copy on scroll, which is what creates the depth.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '14%'])
  const heroCopyY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '40%'])
  const heroCopyOpacity = useTransform(
    scrollYProgress,
    [0, 0.7],
    [1, reduced ? 1 : 0],
  )

  const heroGradient = coral
    ? 'from-smaya-charcoal/40 via-smaya-plum/50 to-smaya-coral/35'
    : 'from-smaya-charcoal/40 via-smaya-plum/55 to-smaya-plum-deep/60'

  return (
    <div className="flex w-full flex-col bg-smaya-ivory font-sans text-smaya-charcoal">
      {/* ------------------------------- Hero ------------------------------- */}
      <section
        ref={heroRef}
        className={cn(
          /*
            pb MUST exceed the negative margin the next section uses to overlap
            this one (-mt-14 / sm:-mt-20 = 56px / 80px). It was pb-16 = 64px,
            i.e. SMALLER than the desktop overlap, so the foot of the hero copy
            was underneath the white panel by construction. On a 720px-tall
            viewport the tagline cleared it by 5px; anything shorter buried it.
          */
          'relative flex items-center justify-center overflow-hidden bg-smaya-charcoal px-5 pb-24 pt-32 sm:px-6 sm:pb-28',
          // Footage earns a taller stage than a still does.
          hasVideo
            ? 'min-h-[76svh] sm:min-h-[82svh]'
            : 'min-h-[58vh] sm:min-h-[60vh]',
        )}
      >
        {/*
          Parallax: the backdrop is 118% tall and drifts ~14% while the copy
          drifts ~40%, so the footage lags the text and the two separate. The
          oversize is what keeps the bottom edge from lifting into view.
        */}
        <motion.div style={{ y: heroBgY }} className="absolute inset-0 z-0 h-[118%]">
          {hasVideo ? (
            <HeroVideo
              mp4={vertical.heroVideo!.mp4}
              mobileMp4={vertical.heroVideo!.mobileMp4}
              poster={vertical.heroVideo!.poster}
              priority
            />
          ) : (
            /* TODO: replace with Google Flow-generated or client-supplied asset */
            <Image
              src={vertical.heroImage}
              alt={vertical.heroImageAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-60"
            />
          )}

          {/*
            Scrim. The footage is bright and high-key — sunlit whites, pale
            pinks, lawn green — so the still's opacity-60 dimming is not enough
            on its own. Video heroes get a heavier, centre-weighted stack so the
            headline keeps AA contrast without flattening the imagery.
          */}
          {hasVideo ? (
            <>
              {/*
                Weighted toward the CENTRE, not the foot.
                The legibility work is done by the radial below, which sits
                exactly under the headline block. The linear pass is kept light
                at the bottom on purpose: the corporate footage carries the
                Smaya logo on the podium banner in its lower third, and the
                previous `to-charcoal/92` stop crushed it to near-black. A dark
                foot buys nothing here either — the next section is a white
                rounded panel, so there is no blend to protect.
              */}
              <div className="absolute inset-0 bg-gradient-to-b from-smaya-charcoal/78 via-smaya-plum-deep/42 to-smaya-charcoal/55" />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 76% 58% at 50% 42%, rgba(28,27,31,0.62) 0%, rgba(28,27,31,0) 76%)',
                }}
              />
            </>
          ) : (
            <>
              <div
                className={cn('absolute inset-0 bg-gradient-to-b', heroGradient)}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-smaya-charcoal/90" />
            </>
          )}
        </motion.div>

        <ParticleField density={3} opacity={0.4} className="z-[1]" />

        <motion.div
          style={{ y: heroCopyY, opacity: heroCopyOpacity }}
          /*
            max-w-5xl, not 4xl. The longest lead ("Building Stronger
            Communities") measures 975px at this size — it broke to a second
            line inside an 896px column while every other vertical sat on two
            lines total. Widening the column fixes the odd one out without
            shrinking the type for the other six. The tagline keeps its own
            narrower max-w-xl, so measure length is unaffected.
          */
          className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center text-smaya-ivory"
        >
          <SplitText
            as="h1"
            mode="load"
            delay={0.15}
            /*
              Sized so the ACCENT stays on one line, which is what actually
              controls the hero's height.

              At the old 6.5rem "Most Beautiful Moments" measured ~1070px inside
              a 896px column, so it broke to a second line and the headline ran
              to three — 306px of type. Every vertical did the same. Dropping to
              4.25rem brings the longest accent to ~700px and the longest lead
              ("Building Stronger Communities") to ~880px, so both fit and the
              headline is two lines at ~133px. That is the 173px the hero was
              short by.
            */
            className="font-serif text-[2.1rem] font-black leading-[0.98] tracking-[-0.02em] drop-shadow-[0_2px_24px_rgba(28,27,31,0.85)] sm:text-[2.6rem] md:text-5xl lg:text-[3.75rem] xl:text-[4.25rem]"
          >
            {vertical.heroTitle.lead}
            <br />
            <span className="italic font-light text-smaya-gold">
              {vertical.heroTitle.accent}
            </span>
          </SplitText>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8, ease: EASE_OUT }}
            className="mt-6 max-w-xl text-sm font-light leading-relaxed text-white/75 drop-shadow-[0_1px_12px_rgba(28,27,31,0.8)] sm:text-base"
          >
            {vertical.tagline}
          </motion.p>

          {/*
            No CTA over the footage. The hero is the title card; the reader has
            not been told anything yet, and a button sitting on the video was
            competing with it. The same action is still on the page — see the
            closing CTA section, which is where it belongs once there is
            something to act on.
          */}
        </motion.div>
      </section>

      {/*
        ------------------------- Services grid (full bleed) -------------------
        A layout can opt out of the white panel entirely. Everything below —
        the centred plate, its max-width, the rounded overlap and the section
        head — is chrome the template imposes, and a section meant to run
        edge-to-edge on its own dark ground cannot escape it from the inside.
        Those layouts render bare and supply their own background and header.
      */}
      {vertical.grid?.fullBleed && (
        <section className="relative z-20 w-full">
          <ServiceCardGrid
            services={vertical.grid.services}
            accent={vertical.accent}
            columns={vertical.grid.columns}
            layout={vertical.grid.layout}
          />
        </section>
      )}

      {/* --------------------------- Services grid -------------------------- */}
      {vertical.grid && !vertical.grid.fullBleed && (
        <section className="relative z-20 mx-auto -mt-14 w-full max-w-7xl rounded-t-3xl bg-white px-5 py-16 shadow-xl sm:-mt-20 sm:px-6 sm:py-24 lg:px-12 lg:py-28">
          {/* Section head: eyebrow, rule and title on one editorial baseline. */}
          <div className="mb-12 sm:mb-16">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <span
                className={cn(
                  'flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em]',
                  coral ? 'text-smaya-coral' : 'text-smaya-plum',
                )}
              >
                <span className="h-px w-8 bg-smaya-gold" />
                {vertical.grid.eyebrow}
                <span className="h-px w-8 bg-smaya-gold" />
              </span>

              <h2 className="mt-6 font-serif text-3xl leading-[1.1] tracking-tight text-smaya-charcoal sm:text-4xl lg:text-5xl">
                {vertical.grid.title}
              </h2>

              <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-smaya-charcoal/55">
                {vertical.tagline}
              </p>
            </div>
          </div>

          <ServiceCardGrid
            services={vertical.grid.services}
            accent={vertical.accent}
            columns={vertical.grid.columns}
            layout={vertical.grid.layout}
          />
        </section>
      )}

      {/* ----------- Two-column layout, bespoke treatment (full bleed) -------- */}
      {vertical.columns && vertical.columnsLayout === 'atelier' && (
        <section className="relative z-20 w-full">
          <WorkshopAtelier columns={vertical.columns} />
        </section>
      )}

      {/* ------------------- Two-column layout (workshops) ------------------- */}
      {vertical.columns && !vertical.columnsLayout && (
        <section className="relative z-20 mx-auto -mt-14 w-full max-w-7xl rounded-t-3xl bg-white px-5 py-16 shadow-xl sm:-mt-20 sm:px-6 sm:py-24">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-16">
            {vertical.columns.map((column, colIndex) => (
              <div key={column.title}>
                <div className="mb-10">
                  <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-smaya-plum">
                    {column.eyebrow}
                  </span>
                  <h2 className="font-serif text-3xl text-smaya-charcoal sm:text-4xl">
                    {column.title}
                  </h2>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={viewportOnce}
                  className="flex flex-col gap-5"
                >
                  {column.items.map((item) => (
                    <motion.div
                      key={item.title}
                      variants={colIndex === 0 ? slideInLeft : slideInRight}
                      className="group flex gap-4 rounded border border-gray-100 p-5 transition-colors hover:border-smaya-gold sm:p-6"
                    >
                      <IconBadge
                        name={item.icon}
                        variant="bare"
                        size={26}
                        className="shrink-0 pt-0.5 text-smaya-plum"
                      />
                      <div>
                        <h3 className="mb-2 font-serif text-lg sm:text-xl">
                          {item.title}
                        </h3>
                        <p className="text-sm font-light text-smaya-charcoal/65 sm:text-base">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/*
        ------------------- "Why it matters" (corporate) --------------------
        `benefits`, `signature` and `band` are now rendered INSIDE their
        vertical's closing CTA (the boardroom grid, the pulse cards and the
        wilderness lookbook respectively) rather than as separate bands stacked
        above it. Three points and the action they argue for are one idea, and
        splitting them across two grounds was what made the old footers read as
        an afterthought.

        The guards below are kept — and deliberately not deleted — so any
        vertical that later defines one of these fields WITHOUT a bespoke CTA
        still renders it. Only the three that were absorbed are excluded.
      */}
      {vertical.benefits && vertical.slug !== 'corporate' && (
        <section className="bg-smaya-ivory px-5 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center sm:mb-16">
              <h2 className="font-serif text-3xl text-smaya-charcoal sm:text-4xl">
                Why Corporate Events Matter
              </h2>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="grid grid-cols-1 gap-10 text-center md:grid-cols-3 md:gap-12"
            >
              {vertical.benefits.map((benefit, i) => (
                <motion.div key={benefit.title} variants={staggerItemScale}>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-smaya-gold text-2xl font-bold text-white">
                    {i + 1}
                  </div>
                  <h3 className="mb-4 font-serif text-xl text-smaya-charcoal sm:text-2xl">
                    {benefit.title}
                  </h3>
                  <p className="font-light leading-relaxed text-smaya-charcoal/65">
                    {benefit.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* -------------------- Signature Series (fitness) -------------------- */}
      {vertical.signature && vertical.slug !== 'fitness' && (
        <section className="relative overflow-hidden bg-gradient-to-br from-smaya-plum via-smaya-plum-light to-smaya-coral px-5 py-16 text-white sm:px-6 sm:py-24">
          <ParticleField density={2} opacity={0.3} />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h2 className="mb-12 font-serif text-3xl sm:text-4xl md:text-5xl">
              {vertical.signature.title}
            </h2>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="flex flex-col justify-center gap-6 md:flex-row md:gap-8"
            >
              {vertical.signature.items.map((event) => (
                <motion.div
                  key={event}
                  variants={staggerItem}
                  className="rounded-xl bg-white px-8 py-7 text-smaya-charcoal shadow-2xl transition-transform duration-300 hover:scale-105 md:px-12 md:py-8"
                >
                  <h3 className="font-serif text-xl sm:text-2xl">{event}</h3>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* --------------------- Feature band (adventure) --------------------- */}
      {vertical.band && vertical.slug !== 'adventure' && (
        <section className="relative overflow-hidden bg-smaya-charcoal px-5 py-16 text-white sm:px-6 sm:py-24">
          <ParticleField density={2} opacity={0.3} />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-smaya-gold">
              {vertical.band.eyebrow}
            </span>
            <SplitText
              as="h2"
              mode="enter"
              className="mb-8 font-serif text-3xl sm:text-4xl md:text-5xl"
            >
              {vertical.band.title}
            </SplitText>
            <p className="mx-auto mb-12 max-w-2xl text-base font-light leading-relaxed text-gray-400 sm:text-lg">
              {vertical.band.body}
            </p>
            <ButtonLink
              href={vertical.band.ctaHref}
              variant="outline"
              size="lg"
              className="text-xs font-bold uppercase tracking-widest"
            >
              {vertical.band.ctaLabel}
            </ButtonLink>
          </div>
        </section>
      )}

      {/*
        -------------------------------- CTA -------------------------------
        Seven bespoke closings, one per vertical — see VerticalCta.

        It carries its own ground in every case, so the SectionDivider that used
        to precede the light variant is gone: a divider between two sections
        that already differ in background is a line drawn on a seam.
      */}
      <VerticalCta vertical={vertical} />
    </div>
  )
}
