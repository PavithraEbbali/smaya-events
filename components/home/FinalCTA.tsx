'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { fadeUp, viewportOnce } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { ButtonLink } from '@/components/ui/Button'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { SplitText } from '@/components/ui/SplitText'

const GOLD = '#C5A880'

/**
 * "The Grand Finale Concierge Banner" — the last thing on the home page.
 *
 * WHY THE GRADIENT NO LONGER ENDS IN GOLD. It used to run
 * plum → plum-light → smaya-gold, which meant the bottom-right corner was a
 * near-#D4AF37 field with white body copy sitting on it: about 2.0:1, the
 * worst contrast on the page, and precisely on the closing sentence. The ramp
 * now stays in the purple family end to end and the gold arrives as LIGHT —
 * ambient blooms behind the type — which is where a light colour belongs.
 */
export function FinalCTA() {
  const reduced = usePrefersReducedMotion()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3A225F] via-[#4A2E7A] to-[#1E0F35] px-5 py-24 text-center text-white sm:px-6 sm:py-32">
      {/* Ambient gold. Three offset blooms rather than one centred wash, so the
          banner has a direction of light instead of a vignette. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            `radial-gradient(ellipse 55% 50% at 15% 10%, ${GOLD}33, transparent 70%)`,
            `radial-gradient(ellipse 50% 45% at 85% 90%, ${GOLD}2B, transparent 70%)`,
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,255,255,0.10), transparent 68%)',
          ].join(','),
        }}
      />

      {/* Gold-foil frame, inset from the edge so it reads as a mounted plate. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 rounded-[2rem] border sm:inset-8"
        style={{ borderColor: `${GOLD}2E` }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="mb-7 inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em]"
          style={{ borderColor: `${GOLD}59`, color: GOLD }}
        >
          <Sparkles size={13} aria-hidden />
          The Concierge
        </motion.span>

        <SplitText
          as="h2"
          mode="scrub"
          className="mb-8 font-serif text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
        >
          Let&rsquo;s Create Something{' '}
          <span className="italic font-light" style={{ color: GOLD }}>
            Extraordinary
          </span>
        </SplitText>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto mb-12 max-w-xl text-base font-light leading-relaxed text-white/80 sm:text-lg"
        >
          Reach out to our team to start planning your dream event, corporate
          retreat, or fitness party.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="flex justify-center"
        >
          <MagneticButton className="w-full sm:w-auto">
            <ButtonLink
              href="/contact?type=consultation"
              size="lg"
              className="w-full rounded-full px-10 text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_36px_rgba(197,168,128,0.42)] sm:w-auto sm:px-14"
            >
              Book a Free Consultation
            </ButtonLink>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  )
}
