'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Lightbulb, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react'

import { site } from '@/data/site'
import {
  fadeUp,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItemScale,
  viewportOnce,
} from '@/lib/animations'
import { RevealText } from '@/components/ui/RevealText'
import { SectionDivider } from '@/components/ui/SectionDivider'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SplitText } from '@/components/ui/SplitText'

const values = [
  {
    Icon: Heart,
    title: 'Passion',
    desc: 'We pour our hearts into every project, ensuring every detail reflects love and dedication.',
  },
  {
    Icon: ShieldCheck,
    title: 'Integrity',
    desc: 'Honesty and transparency form the foundation of our relationships with clients and partners.',
  },
  {
    Icon: Lightbulb,
    title: 'Innovation',
    desc: 'We constantly explore new ideas to bring unique, cutting-edge experiences to life.',
  },
  {
    Icon: Sparkles,
    title: 'Excellence',
    desc: 'We strive for perfection in execution, delivering flawlessly every single time.',
  },
]

/**
 * The real founder photograph, supplied by the client — no longer a stock
 * placeholder. Landscape source (1408x768) rendered into a 4:5 portrait frame,
 * so the crop is centred on her; `object-top` would cut her legs off and
 * `object-bottom` would lose the summit behind her.
 */
const FOUNDER_IMAGE = '/images/manasa-raj.jpg'

export function AboutContent() {
  return (
    <div className="bg-smaya-ivory text-smaya-charcoal">
      {/* ============================ STORY ============================== */}
      <div className="px-5 pb-8 pt-32 sm:px-6 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-24 grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:mb-32"
          >
            <div>
              <span className="mb-6 block text-xs font-black uppercase tracking-[0.2em] text-smaya-plum">
                Our Story
              </span>
              <SplitText
                as="h1"
                mode="load"
                delay={0.1}
                className="mb-8 font-serif text-4xl font-black leading-[1] sm:text-5xl lg:text-7xl"
              >
                Creating <br />{' '}
                <span className="italic font-light text-smaya-gold">
                  The Legacy
                </span>
              </SplitText>

              <RevealText className="space-y-6 text-base font-medium leading-relaxed text-smaya-charcoal/70 sm:text-lg">
                <p>
                  Founded on the belief that life&rsquo;s most profound moments
                  are those designed with meticulous intention, Smaya Events has
                  evolved into a powerhouse of experiential design. We are not
                  just event managers; we are creators of feeling.
                </p>
                <p>
                  From luxury matrimony and grand corporate summits to the sheer
                  energy of massive Aqua Zumba festivals and the serenity of
                  outdoor trekking camps, we orchestrate energy, emotion, and
                  flawless execution. We marry traditional elegance with
                  high-octane celebration to create experiences that defy
                  expectation.
                </p>
              </RevealText>
            </div>

            <div className="relative">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-sm shadow-2xl md:h-[600px] md:aspect-auto">
                {/* TODO: replace with Google Flow-generated or client-supplied asset */}
                <Image
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200"
                  alt="Beautiful event setup"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="mt-6 rounded-sm border-2 border-smaya-gold bg-white/90 p-8 shadow-2xl backdrop-blur-md md:absolute md:-bottom-8 md:-left-8 md:mt-0 md:p-10">
                <div className="mb-2 font-serif text-4xl font-black text-smaya-plum md:text-5xl">
                  10+
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-smaya-charcoal">
                  Years Creating <br /> Memories
                </div>
              </div>
            </div>
          </motion.div>

          {/* ------------------------ Founder quote ------------------------ */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="mx-auto my-24 max-w-4xl px-2 text-center lg:my-32"
          >
            <span className="mb-8 block text-smaya-gold">
              <svg
                className="mx-auto h-10 w-10 opacity-50 sm:h-12 sm:w-12"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </span>

            <RevealText
              as="blockquote"
              stagger={150}
              className="mb-10 font-serif text-2xl italic leading-relaxed text-smaya-charcoal sm:text-3xl md:text-4xl lg:text-5xl"
            >
              <span>
                &ldquo;True luxury doesn&rsquo;t announce itself. It is felt in
                the seamlessness of the experience,
              </span>
              <span>
                the energy of the crowd, and the invisible perfection of every
                detail.&rdquo;
              </span>
            </RevealText>

            <p className="text-sm font-bold uppercase tracking-[0.2em] text-smaya-plum">
              {site.founder}, Founder
            </p>
          </motion.div>

          {/* -------------------------- Leadership ------------------------- */}
          <div>
            <div className="mb-14 flex flex-col items-center space-y-4 text-center sm:mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-smaya-gold">
                The Visionary
              </span>
              <h2 className="font-serif text-3xl text-smaya-charcoal sm:text-4xl md:text-5xl">
                Leadership
              </h2>
            </div>

            <div className="flex justify-center">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                className="group w-full max-w-md"
              >
                <div className="relative mb-8 aspect-4/5 overflow-hidden shadow-xl">
                  <Image
                    src={FOUNDER_IMAGE}
                    alt={`${site.founder}, founder of ${site.name}, on a snow-covered summit`}
                    fill
                    sizes="(max-width: 768px) 100vw, 28rem"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 font-serif text-2xl text-smaya-charcoal transition-colors group-hover:text-smaya-plum sm:text-3xl">
                    {site.founder}
                  </h3>
                  <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-smaya-gold">
                    Founder
                  </p>
                  <p className="px-2 font-light leading-relaxed text-smaya-charcoal/65 sm:px-4">
                    A dynamic fitness entrepreneur, choreographer, and
                    experiential curator. Whether she&rsquo;s exploring mountain
                    summits, leading high-energy fitness festivals, or designing
                    luxury celebrations, Manasa brings an infectious, vibrant
                    energy to everything she does.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Bridges the "story" half into the "vision & values" half. */}
      <SectionDivider className="py-16 sm:py-20" />

      {/* ======================= VISION & MISSION ======================== */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-smaya-gold/20 text-smaya-gold">
              <Target size={32} aria-hidden />
            </div>
            <h2 className="mb-6 font-serif text-3xl text-smaya-charcoal sm:text-4xl">
              Our Vision
            </h2>
            <p className="text-base font-light leading-relaxed text-smaya-charcoal/65 sm:text-lg">
              To become India&rsquo;s leading experience company creating
              unforgettable luxury celebrations, high-octane fitness events,
              breathtaking adventure experiences, and deep community
              connections. We envision a world where every milestone is a
              masterpiece of emotion and flawless execution.
            </p>
          </motion.div>

          <motion.div
            variants={slideInRight}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-smaya-plum/10 text-smaya-plum">
              <TrendingUp size={32} aria-hidden />
            </div>
            <h2 className="mb-6 font-serif text-3xl text-smaya-charcoal sm:text-4xl">
              Our Mission
            </h2>
            <p className="text-base font-light leading-relaxed text-smaya-charcoal/65 sm:text-lg">
              To design meaningful, high-energy, and memorable experiences that
              bring people together. Whether through intimate weddings, massive
              wellness festivals, or corporate summits, our mission is to craft
              moments that elevate the human spirit and foster lifelong
              memories.
            </p>
          </motion.div>
        </div>
      </section>

      {/* =========================== CORE VALUES ========================== */}
      <section className="bg-white px-5 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The Foundation"
            title="Our Core"
            accent="Values"
            className="mb-14 sm:mb-16"
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8"
          >
            {values.map(({ Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={staggerItemScale}
                className="group rounded-xl border border-gray-100 bg-smaya-ivory p-8 text-center shadow-md transition-transform duration-300 hover:-translate-y-2"
              >
                <Icon
                  size={36}
                  aria-hidden
                  className="mx-auto mb-6 text-smaya-gold transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                />
                <h3 className="mb-4 font-serif text-xl text-smaya-charcoal sm:text-2xl">
                  {title}
                </h3>
                <p className="font-light leading-relaxed text-smaya-charcoal/65">
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================= IMPACT ============================= */}
    </div>
  )
}
