'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import type { ServiceCategory } from '@/data/services'
import type { Vertical, VerticalSlug } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import {
  fadeUp,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations'
import { SectionHeading } from '@/components/ui/SectionHeading'

type Props = {
  categories: ServiceCategory[]
  verticals: Record<VerticalSlug, Vertical>
}

/**
 * The hub view: the five grouped categories from the original Services page,
 * each linking through to the vertical pages that carry the detail.
 */
export function ServicesHub({ categories, verticals }: Props) {
  return (
    <div className="min-h-screen bg-smaya-ivory px-5 pb-20 pt-32 text-smaya-charcoal sm:px-6 sm:pb-24 sm:pt-36">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Our Expertise"
          title="Comprehensive"
          accent="Experiences"
          body="From the grandest luxury weddings to empowering fitness festivals and scenic adventure camps, our expertise spans the full spectrum of live experiences."
          as="h1"
          titleClassName="text-4xl sm:text-5xl lg:text-7xl"
          className="mb-16 sm:mb-20"
        />

        <div className="flex flex-col gap-14 sm:gap-20">
          {categories.map((category) => {
            const Icon = getIcon(category.icon)

            return (
              <motion.section
                key={category.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg sm:p-10 lg:p-16"
              >
                <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-12">
                  <div className="lg:w-1/3">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-smaya-gold/15 text-smaya-plum">
                      <Icon size={30} aria-hidden />
                    </div>
                    <h2 className="mb-4 font-serif text-2xl text-smaya-charcoal sm:text-3xl lg:text-4xl">
                      {category.title}
                    </h2>
                    <p className="font-light leading-relaxed text-smaya-charcoal/55">
                      {category.description}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2">
                      {category.relatedSlugs.map((slug) => (
                        <Link
                          key={slug}
                          href={`/services/${slug}`}
                          data-tap
                          className="group inline-flex items-center gap-1.5 rounded-full border border-smaya-plum/20 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-smaya-plum transition-all hover:border-smaya-gold hover:bg-smaya-gold hover:text-smaya-charcoal"
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

                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewportOnce}
                    className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:w-2/3"
                  >
                    {category.services.map((service) => (
                      <motion.div
                        key={service.title}
                        variants={staggerItem}
                        className="rounded-xl border border-gray-50 bg-smaya-ivory p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-smaya-gold hover:shadow-md"
                      >
                        <h3 className="mb-3 font-serif text-lg text-smaya-charcoal sm:text-xl">
                          {service.title}
                        </h3>
                        <p className="text-sm font-light leading-relaxed text-smaya-charcoal/65">
                          {service.desc}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
