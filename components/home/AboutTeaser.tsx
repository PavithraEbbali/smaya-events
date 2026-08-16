'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { slideInLeft, slideInRight, viewportOnce } from '@/lib/animations'
import { RevealText } from '@/components/ui/RevealText'

export function AboutTeaser() {
  return (
    <section className="bg-white px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <span className="mb-6 block text-xs font-black uppercase tracking-[0.25em] text-smaya-plum">
            Our Story
          </span>
          <h2 className="mb-8 font-serif text-3xl font-black leading-[1.05] tracking-tight text-smaya-charcoal sm:text-4xl md:text-5xl">
            We Are Not Just Event Managers.
            <br />
            <span className="italic font-light text-smaya-gold">
              We Are Creators of Feeling.
            </span>
          </h2>

          <RevealText className="space-y-6 text-base font-medium leading-relaxed text-smaya-charcoal/70 sm:text-lg">
            <p>
              Founded on the belief that life&rsquo;s most profound moments are
              those designed with meticulous intention, Smaya Events has evolved
              into a powerhouse of experiential design.
            </p>
            <p>
              From luxury matrimony and grand corporate summits to the sheer
              energy of massive Aqua Zumba festivals and the serenity of outdoor
              trekking camps, we orchestrate energy, emotion, and flawless
              execution.
            </p>
          </RevealText>

          <Link
            href="/about"
            data-tap
            className="group mt-10 inline-flex items-center gap-2 border-b-2 border-smaya-plum pb-1 text-xs font-black uppercase tracking-[0.2em] text-smaya-plum transition-colors hover:border-smaya-gold hover:text-smaya-gold"
          >
            Read Our Story
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </motion.div>

        <motion.div
          variants={slideInRight}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative"
        >
          <div className="relative aspect-4/5 w-full overflow-hidden rounded-sm shadow-2xl sm:aspect-3/4 lg:aspect-4/5">
            {/* TODO: replace with Google Flow-generated or client-supplied asset */}
            <Image
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200"
              alt="A Smaya Events celebration setup"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="mt-6 rounded-sm border-2 border-smaya-gold bg-white/90 p-7 shadow-2xl backdrop-blur-md sm:absolute sm:-bottom-8 sm:-left-8 sm:mt-0 sm:p-9">
            <div className="mb-2 font-serif text-4xl font-black text-smaya-plum sm:text-5xl">
              10+
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-smaya-charcoal">
              Years Creating
              <br />
              Memories
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
