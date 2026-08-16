'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { EASE_OUT, fadeUp, viewportOnce } from '@/lib/animations'
import { alpha } from '@/lib/theme'
import { ButtonLink } from '@/components/ui/Button'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { SplitText } from '@/components/ui/SplitText'
import { StrokeText } from '@/components/ui/StrokeText'

/**
 * A hairline dropping into the eyebrow, closed by a small gold lozenge.
 *
 * Replaces a chain of seven tiny outline icons joined by gold rules. That chain
 * was a third copy of the same list — the seven cards sit directly below it and
 * the hero already carries a numbered index of the same practices — and at 17px
 * it tangled visibly with the oversized etched word behind it, reading as noise
 * rather than as an index. One quiet vertical mark announces the section
 * without competing with anything, and it is the only vertical rule on the
 * page, so it does not echo the drawn rule in StatementBand either.
 */
function DescenderRule() {
  return (
    <div aria-hidden className="mb-4 flex flex-col items-center sm:mb-6">
      {/* Shortened from h-12/sm:h-16 and mb-7/sm:mb-9. At full length the rule
          was 64px of hairline plus 36px of margin hanging in an already-empty
          band under the stats bar — it read as the void rather than as a mark
          announcing the section. */}
      <motion.span
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.85, ease: EASE_OUT }}
        className="block h-8 w-px origin-top bg-gradient-to-b from-smaya-gold/0 via-smaya-gold/45 to-smaya-gold sm:h-10"
      />
      <motion.span
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={viewportOnce}
        transition={{ delay: 0.7, duration: 0.45, ease: EASE_OUT }}
        className="mt-1 block h-1.5 w-1.5 rotate-45 bg-smaya-gold"
      />
    </div>
  )
}

export function ServicesSectionHeader() {
  return (
    <header className="relative mx-auto mb-14 flex max-w-3xl flex-col items-center text-center sm:mb-16 lg:mb-20">
      <DescenderRule />

      <motion.span
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mb-5 text-[11px] font-black uppercase tracking-[0.3em] text-smaya-plum"
      >
        Smaya&rsquo;s Signature Services
      </motion.span>

      {/*
        The etch is centred on the HEADLINE, not floated at the top of the
        header. Previously it sat at -top-4, which put a band of 12vw outlined
        capitals straight through the hairline ornament — two fine-line drawings
        overlapping at similar weights, which just read as a mess. Behind solid
        black display type it does what it is for: adds depth without ever being
        mistaken for content.
      */}
      <div className="relative w-full py-2 sm:py-4">
        <StrokeText
          phrase="Celebrate."
          repeat={4}
          // Sized DOWN from the default. At 12vw the band is 126px tall against
          // a 61px headline, so it spilled onto the eyebrow above and the
          // paragraph below. It should sit inside the headline, not around it.
          sizeClassName="text-[13vw] sm:text-[10vw] lg:text-[8vw]"
          className="top-1/2 -translate-y-1/2"
        />

        <SplitText
          as="h2"
          mode="enter"
          split="lines,chars"
          variant="assemble"
          stagger={0.02}
          className="relative font-serif text-[2.25rem] font-black leading-[1.02] tracking-[-0.025em] text-smaya-charcoal sm:text-5xl lg:text-6xl"
        >
          Elevate Every{' '}
          {/* gold-deep, not gold: bright gold measures 2.0:1 on ivory and fails
              even the large-text bar. See globals.css for the full note. */}
          <span className="italic font-light text-smaya-gold-deep">Emotion</span>
        </SplitText>
      </div>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-6 max-w-xl text-base font-light leading-[1.75] text-smaya-charcoal/70 sm:mt-7 sm:text-lg"
      >
        Experience the Smaya standard of excellence in every celebration, from
        intimate gatherings to grand affairs.
      </motion.p>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-9 w-full sm:mt-10 sm:w-auto"
      >
        <MagneticButton className="w-full sm:w-auto">
          <ButtonLink
            href="/services"
            size="lg"
            className="group w-full gap-3 rounded-none px-10 text-xs font-black uppercase tracking-[0.2em] shadow-lg sm:w-auto sm:px-12"
          >
            Discover Our Services
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1.5"
            />
          </ButtonLink>
        </MagneticButton>
      </motion.div>
    </header>
  )
}

/**
 * Layered, low-contrast ground for the section. Sits behind the header and the
 * card grid so the block reads as a considered surface rather than flat ivory,
 * without ever competing with the copy.
 */
export function ServicesSectionBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Warm plum bloom, top-centre. */}
      <div
        className="absolute -top-1/4 left-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{
          background: `radial-gradient(circle, ${alpha('plum', 1)} 0%, ${alpha('plum', 0)} 65%)`,
        }}
      />
      {/* Gold counterweight, lower right. */}
      <div
        className="absolute -right-[15%] bottom-0 h-[45vmax] w-[45vmax] rounded-full opacity-[0.09] blur-3xl"
        style={{
          background: `radial-gradient(circle, ${alpha('gold', 1)} 0%, ${alpha('gold', 0)} 62%)`,
        }}
      />
      {/* Hairline column grid — structure, at the threshold of visibility. */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, ${alpha('charcoal', 1)} 1px, transparent 1px)`,
          backgroundSize: '16.666% 100%',
        }}
      />
    </div>
  )
}
