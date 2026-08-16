import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Instagram, Mail, MapPin, Phone } from 'lucide-react'

import { site, whatsappHref } from '@/data/site'
import { ContactForm } from '@/components/contact/ContactForm'

const description =
  'Whether planning a luxury wedding or a corporate summit, our team is ready to bring your vision to life. Book a free consultation with Smaya Events.'

export const metadata: Metadata = {
  title: 'Contact',
  description,
  alternates: { canonical: '/contact' },
  openGraph: {
    title: `Contact | ${site.name}`,
    description,
    url: '/contact',
  },
}

function FormFallback() {
  return (
    <div
      aria-hidden
      /* Matches the real card's shape and ground, so the swap when the form
         chunk lands is a change of contents rather than of colour. */
      className="min-h-[560px] animate-pulse rounded-3xl border border-black/5 bg-white shadow-xl"
    />
  )
}

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-[#FDFCFB] px-5 pb-20 pt-32 text-smaya-charcoal sm:px-6 sm:pb-24 sm:pt-36">
      {/* Info sidebar first in the DOM, so it stacks above the form on mobile. */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-32">
          {/*
            THE GOLD IS `smaya-gold-deep` (#887023), NOT #C5A880/#DFC298.

            On this cream ground the brand's pale golds measure 2.21:1 and
            1.85:1 — below even the 3:1 large-text floor, so the accent word
            this layout is built around would have been the least readable
            thing on the page. #887023 is the token the project already added
            for gold text on light grounds (see the @theme comment) and reads
            4.67:1 here, still unmistakably gold.
          */}
          <span className="mb-6 block text-xs font-bold uppercase tracking-[0.2em] text-smaya-gold-deep">
            Inquiries
          </span>
          <h1 className="mb-8 font-serif text-4xl leading-tight text-smaya-plum-deep sm:text-5xl lg:text-6xl">
            Let&rsquo;s Plan Your <br />{' '}
            <span className="font-serif font-light italic text-smaya-gold-deep">
              Dream Event
            </span>
          </h1>
          <p className="mb-12 max-w-md text-base leading-relaxed text-neutral-600 sm:text-lg">
            Whether planning a luxury wedding or a corporate summit, our team is
            ready to bring your vision to life.
          </p>

          <ul className="space-y-6 text-base text-neutral-700 sm:text-lg">
            <li className="flex items-center gap-4">
              <Mail className="shrink-0 text-smaya-plum" aria-hidden />
              <a
                href={`mailto:${site.email}`}
                data-tap
                className="break-all font-medium transition-colors hover:text-smaya-plum"
              >
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-4">
              <Phone className="shrink-0 text-smaya-plum" aria-hidden />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-tap
                className="font-medium transition-colors hover:text-smaya-plum"
              >
                {site.phone} (WhatsApp)
              </a>
            </li>
            <li className="flex items-center gap-4">
              <Instagram className="shrink-0 text-smaya-plum" aria-hidden />
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                data-tap
                className="font-medium transition-colors hover:text-smaya-plum"
              >
                {site.instagramHandle}
              </a>
            </li>
            <li className="flex items-start gap-4">
              <MapPin className="mt-1 shrink-0 text-smaya-plum" aria-hidden />
              <div>
                <p className="font-medium text-smaya-charcoal">Headquarters</p>
                <p className="text-base text-neutral-600">
                  Bengaluru, India
                  <br />
                  Available for Events Worldwide
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* useSearchParams needs a Suspense boundary to stay statically rendered. */}
        <Suspense fallback={<FormFallback />}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  )
}
