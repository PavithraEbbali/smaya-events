'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'

import { testimonialsPreview } from '@/data/testimonials'
import { staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'
import { SectionHeading } from '@/components/ui/SectionHeading'

export function TestimonialsPreview() {
  return (
    <section className="bg-white px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Client Love"
          title="Stories of"
          accent="Joy"
          className="mb-14"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonialsPreview.map((review) => (
            <motion.figure
              key={review.author}
              variants={staggerItem}
              className="group relative flex flex-col rounded-2xl border border-black/5 bg-smaya-ivory p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-smaya-gold hover:shadow-xl"
            >
              <div className="mb-6 flex gap-1 text-smaya-gold-star">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" aria-hidden />
                ))}
                <span className="sr-only">Rated 5 out of 5</span>
              </div>

              <blockquote className="mb-8 flex-grow font-serif text-lg italic leading-relaxed text-smaya-charcoal/80">
                &ldquo;{review.text}&rdquo;
              </blockquote>

              <figcaption>
                <div className="text-sm font-bold uppercase tracking-[0.1em] text-smaya-plum">
                  {review.author}
                </div>
                <div className="mt-1.5 text-xs uppercase tracking-[0.2em] text-smaya-charcoal/45">
                  {review.role}
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            href="/testimonials"
            data-tap
            className="group inline-flex items-center gap-2 border-b-2 border-smaya-plum pb-1 text-xs font-black uppercase tracking-[0.2em] text-smaya-plum transition-colors hover:border-smaya-gold hover:text-smaya-gold"
          >
            Read All Testimonials
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
