'use client'

import dynamic from 'next/dynamic'

import { SplitText } from './SplitText'

const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false })

type Props = {
  eyebrow?: string
  title: string
  accent?: string
}

/**
 * The plum → charcoal gradient hero shared by the Events and Blog pages
 * (the original pages used the identical block).
 */
export function PageHero({ eyebrow, title, accent }: Props) {
  return (
    <section className="relative flex min-h-[46vh] items-center justify-center overflow-hidden bg-smaya-charcoal px-5 pb-14 pt-32 sm:min-h-[50vh] sm:px-6">
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-gradient-to-br from-smaya-plum via-smaya-plum-deep to-smaya-charcoal"
      />
      <ParticleField density={3} opacity={0.4} className="z-[1]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center text-smaya-ivory">
        {eyebrow && (
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-smaya-gold sm:text-sm">
            {eyebrow}
          </span>
        )}
        <SplitText
          as="h1"
          mode="load"
          delay={0.12}
          className="font-serif text-[2.2rem] leading-[1.08] sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {title}
          {accent && (
            <>
              {' '}
              <span className="italic font-light text-smaya-gold">
                {accent}
              </span>
            </>
          )}
        </SplitText>
      </div>
    </section>
  )
}
