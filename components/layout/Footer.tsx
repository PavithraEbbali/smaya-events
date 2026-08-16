import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'

import { site, whatsappHref } from '@/data/site'
import { verticalList } from '@/data/verticals'
import { Logo } from './Logo'

const quickLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/services', label: 'Services' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/contact', label: 'Contact' },
]

const socials = [
  { href: site.instagram, label: 'Instagram', Icon: Instagram },
  { href: site.instagram, label: 'Facebook', Icon: Facebook },
  { href: site.instagram, label: 'LinkedIn', Icon: Linkedin },
]

export function Footer() {
  return (
    <footer className="bg-smaya-charcoal px-5 pb-10 pt-20 text-white sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <div className="mb-16 grid w-full grid-cols-1 gap-12 text-left md:grid-cols-3">
          <div className="flex flex-col items-start">
            <Logo tone="light" size={44} className="mb-6" />
            <p className="mb-8 max-w-sm font-light text-gray-300">
              Creating moments and crafting memories through exquisite planning,
              design, and execution. The ultimate destination for luxury event
              management.
            </p>
            <div className="flex gap-4">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  data-tap
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-smaya-gold hover:bg-smaya-gold hover:text-smaya-charcoal"
                >
                  <Icon size={18} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-center">
            <div>
              <h4 className="mb-6 font-serif text-xl uppercase tracking-[0.2em] text-smaya-gold">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      data-tap
                      className="flex items-center py-1 text-gray-300 transition-colors hover:text-smaya-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start">
            <h4 className="mb-6 font-serif text-xl uppercase tracking-[0.2em] text-smaya-gold">
              Contact
            </h4>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-center gap-4">
                <Phone size={18} className="shrink-0 text-smaya-gold" aria-hidden />
                <a
                  href={`tel:${site.phone.replace(/\s/g, '')}`}
                  data-tap
                  className="transition-colors hover:text-smaya-gold"
                >
                  {site.phone}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Mail size={18} className="shrink-0 text-smaya-gold" aria-hidden />
                <a
                  href={`mailto:${site.email}`}
                  data-tap
                  className="break-all transition-colors hover:text-smaya-gold"
                >
                  {site.email}
                </a>
              </li>
              <li className="flex items-start gap-4">
                <MapPin
                  size={18}
                  className="mt-1 shrink-0 text-smaya-gold"
                  aria-hidden
                />
                <span>
                  Bangalore, IN
                  <br />
                  Available Worldwide
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* All seven verticals stay one click away from every page. */}
        <nav
          aria-label="Services"
          className="mb-10 flex w-full flex-wrap justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-8"
        >
          {verticalList.map((vertical) => (
            <Link
              key={vertical.slug}
              href={`/services/${vertical.slug}`}
              className="py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-smaya-gold"
            >
              {vertical.name}
            </Link>
          ))}
        </nav>

        <div className="flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="font-sans text-xs uppercase tracking-widest text-gray-500">
            &copy; {new Date().getFullYear()} {site.name}. All Rights Reserved.
          </p>
          <p className="text-xs italic tracking-wide text-smaya-gold">
            &ldquo;{site.tagline}&rdquo;
          </p>
        </div>
      </div>

      {/* Non-visual: gives the WhatsApp FAB a crawlable, no-JS equivalent. */}
      <a href={whatsappHref} className="sr-only">
        Chat with {site.name} on WhatsApp
      </a>
    </footer>
  )
}
