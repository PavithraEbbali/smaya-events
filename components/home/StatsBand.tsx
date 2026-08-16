'use client'

import { motion } from 'framer-motion'

import { stats } from '@/data/site'
import { staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'
import { Counter } from '@/components/ui/Counter'
import { cn } from '@/lib/utils'

/**
 * The impact numbers from the original Vision page. Shared by Home and About.
 *
 * THE GROUND IS A FLAT COLOUR AND NOTHING SITS ON IT.
 *
 * This band used to carry three stacked layers behind the figures: a WebGL
 * accretion disc (`BlackHoleScene`, intensity 0.85 at 70% opacity), a
 * `ParticleField` <canvas> drawn across the full width, and a radial-gradient
 * ellipse scrim whose only job was to claw back legibility from the other two.
 * Together they read as a giant blurred smear behind the numbers. All three are
 * gone; the ground is `#0d0216` and the text sits directly on it.
 *
 * DO NOT reintroduce a background layer here — no canvas, no radial gradient,
 * no blur, no mix-blend, no `before:`/`after:` pseudo-elements. If this band
 * ever needs atmosphere again it should come from the section above or below
 * it, not from something painted underneath these figures.
 *
 * The `particles` and `blackHole` props are gone with the layers they gated.
 * Neither call site (app/page.tsx, components/about/AboutContent.tsx) ever
 * passed them.
 */
export function StatsBand({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'relative z-10 w-full border-t border-white/10 bg-[#0d0216] px-5 py-24 text-white sm:px-6 sm:py-28',
        className,
      )}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-12 text-center lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <div className="mb-3 font-serif text-4xl font-black text-smaya-gold sm:text-5xl md:text-6xl">
              <Counter end={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 sm:text-xs">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
