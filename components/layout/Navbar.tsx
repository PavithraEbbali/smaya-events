'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, X } from 'lucide-react'

import { navLinks } from '@/data/site'
import { verticalList } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { usePointerFine, useScrolled } from '@/lib/hooks'
import { EASE, EASE_OUT } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { ServicesMegaMenu } from './ServicesMegaMenu'

/**
 * Nav underline — upgraded from a width transition to an SVG path that draws
 * itself in on hover/focus (Section 4, item 14).
 */
function NavUnderline() {
  return (
    <svg
      className="nav-underline pointer-events-none absolute -bottom-0.5 left-1/2 h-[3px] w-8 -translate-x-1/2 overflow-visible"
      viewBox="0 0 100 3"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 1.5 H 98"
        stroke="var(--color-smaya-gold)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const isScrolled = useScrolled(50)
  const pointerFine = usePointerFine()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)

  // Close everything whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
    setMegaOpen(false)
    setMobileServicesOpen(false)
  }, [pathname])

  // Lock body scroll behind the full-screen mobile menu.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMegaOpen(false)
      setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    },
    [],
  )

  const openMega = () => {
    if (!pointerFine) return
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }

  // Small grace period so the pointer can cross the gap into the panel.
  const scheduleCloseMega = () => {
    if (!pointerFine) return
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 140)
  }

  /*
    Light bar, dark links — and still ONE treatment on every route, which is
    the part that must not regress.

    HOVER GOLD IS `smaya-gold-deep` (#887023), NOT #C5A880, AND THAT IS A
    CONTRAST FIX RATHER THAN A PREFERENCE. #C5A880 on this bar measures
    2.15:1; these links are 11px, so they need 4.5:1. #887023 is the token
    this project already added for exactly this case — the @theme comment
    records that the brand gold fails on light grounds at 2.0:1 — and it
    reaches 4.55:1 here. Same gold family, legible.
  */
  const linkTone = 'text-neutral-900 hover:text-smaya-gold-deep'

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <header
        /*
          Hook for the opening sequence. HeroIntro puts data-intro="playing" on
          <html> while the doors are closed, and globals.css hides anything
          marked data-site-header for that span — the nav sat on top of the
          curtain otherwise. Attribute rather than a class so nothing here has
          to know the intro exists.
        */
        data-site-header
        /*
          THE SIGNATURE LIGHT BAR — with ONE treatment on every route, which is
          the invariant that actually matters here.

          History worth keeping: this bar was once transparent-with-dark-text
          until scrolled, and it picked its text colour from a hardcoded list
          of "routes with dark heroes" in data/site.ts. That list held
          `/services/` WITH a trailing slash, so it matched
          `/services/celebrations` but not the `/services` hub — and once that
          hub went obsidian, six of eight links rendered charcoal on near-black
          at 1.19:1. Invisible. The route list was the bug, not the colour: a
          navbar told what is underneath it goes wrong the moment a page
          changes background and nobody updates a list in another file.

          So the bar carries its own ground — now a light one. Which means:

          THE BACKGROUND IS OPAQUE, NOT `/90`. The brief asked for
          `bg-[#F9F9FB]/90`, and on a light page that is identical to this. But
          this site still has dark pages, and at 90% over an obsidian hero the
          bar blends down to rgb(225,225,227) — a different ground, and one
          where the gold hover falls to 4.08:1 and fails. An opaque bar makes
          every contrast figure below a CONSTANT rather than a function of
          whatever page is scrolled underneath. `backdrop-blur-md` is kept for
          the frosted edge where any translucency remains.

          Measured on this ground: links 17.06:1, gold hover 4.55:1, plum
          pills and Book Event 13.34:1.
        */
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#F9F9FB] shadow-sm backdrop-blur-md transition-all duration-500',
          isScrolled ? 'py-3' : 'py-5',
        )}
      >
        {/*
          `max-w-7xl` + explicit `w-full` + `box-border` rather than Tailwind's
          `container`. Same 1280px ceiling in practice, but stated outright: the
          row's padding is guaranteed to come out of its own width rather than
          adding to it, which is the difference between the nav sitting inside
          the viewport and hanging 48px past it.
        */}
        <div className="mx-auto box-border flex h-full w-full max-w-7xl items-center justify-between px-5 sm:px-6">
          {/* The bar is light and the mobile overlay is white, so the dark
              monogram is correct in both states — no branch left to get
              wrong. */}
          <Logo tone="dark" size={34} />

          {/*
            TIGHT AT `lg`, COMFORTABLE FROM `xl`.

            Seven links plus a CTA need 933px with Inter loaded and 961px are
            available at 1024 — 28px of margin, which the webfont is the only
            thing paying for. Measured with the generic fallbacks the browser
            uses when it never arrives: Arial needs 972 (-11) and Verdana 980
            (-19), i.e. the row overflows outright. This project has failed to
            fetch its font from fonts.gstatic.com repeatedly, so that is a live
            failure mode rather than a hypothesis.

            Compressing padding and tracking between 1024 and 1279 buys the
            headroom; from `xl` the original comfortable spacing returns, so
            the common case is unchanged. Widening the gaps instead — the
            obvious reading of "optimize spacing" — would have added roughly
            50px to a row already 19px short.
          */}
          <nav
            className="hidden items-center gap-0.5 lg:flex xl:gap-1"
            aria-label="Primary"
          >
            {navLinks.map((link) => {
              const active = isActive(link.href)

              if (link.hasMegaMenu) {
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={openMega}
                    onMouseLeave={scheduleCloseMega}
                  >
                    <Link
                      href={link.href}
                      prefetch
                      onClick={() => setMegaOpen(false)}
                      onFocus={openMega}
                      aria-expanded={megaOpen}
                      aria-haspopup="true"
                      data-tap
                      className={cn(
                        'group/nav relative flex items-center gap-1 whitespace-nowrap rounded-sm px-2.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-colors duration-300 xl:px-3 xl:tracking-[0.16em]',
                        active
                          ? 'bg-smaya-plum text-white shadow-sm'
                          : linkTone,
                      )}
                    >
                      {link.label}
                      <ChevronDown
                        size={13}
                        aria-hidden
                        className={cn(
                          'transition-transform duration-300',
                          megaOpen && 'rotate-180',
                        )}
                      />
                      {!active && <NavUnderline />}
                    </Link>

                    <AnimatePresence>
                      {megaOpen && (
                        <ServicesMegaMenu
                          onNavigate={() => setMegaOpen(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  data-tap
                  className={cn(
                    'group/nav relative whitespace-nowrap rounded-sm px-2.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-colors duration-300 xl:px-3 xl:tracking-[0.16em]',
                    active ? 'bg-smaya-plum text-white shadow-sm' : linkTone,
                  )}
                >
                  {link.label}
                  {!active && <NavUnderline />}
                </Link>
              )
            })}

            <Link
              href="/contact?type=consultation"
              prefetch
              data-tap
              className="ml-1 whitespace-nowrap rounded-sm bg-smaya-plum px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition-all hover:bg-smaya-gold hover:text-smaya-charcoal xl:ml-2 xl:px-5 xl:tracking-[0.16em]"
            >
              Book Event
            </Link>
          </nav>

          <button
            type="button"
            data-tap
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="relative z-50 -mr-2 flex h-11 w-11 items-center justify-center text-smaya-charcoal lg:hidden"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile menu — full-screen overlay, Services as an inline accordion */}
      {/* ---------------------------------------------------------------- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ type: 'tween', duration: 0.45, ease: EASE }}
            className="fixed inset-0 z-40 flex h-[100dvh] w-full flex-col overflow-y-auto bg-white lg:hidden"
          >
            <nav
              className="flex flex-col gap-1 px-6 pb-16 pt-24"
              aria-label="Mobile"
            >
              {navLinks.map((link, i) => {
                const active = isActive(link.href)

                if (link.hasMegaMenu) {
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.055, ease: EASE_OUT }}
                    >
                      <div className="flex items-stretch">
                        <Link
                          href={link.href}
                          prefetch
                          onClick={() => setMobileOpen(false)}
                          data-tap
                          className={cn(
                            'flex flex-1 items-center rounded-lg px-4 py-3 font-serif text-2xl transition-colors',
                            active
                              ? 'text-smaya-plum'
                              : 'text-smaya-charcoal hover:text-smaya-plum',
                          )}
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          data-tap
                          aria-expanded={mobileServicesOpen}
                          aria-label={
                            mobileServicesOpen
                              ? 'Collapse services'
                              : 'Expand services'
                          }
                          onClick={() => setMobileServicesOpen((v) => !v)}
                          className="flex h-12 w-12 items-center justify-center rounded-lg text-smaya-plum"
                        >
                          <ChevronDown
                            size={22}
                            className={cn(
                              'transition-transform duration-300',
                              mobileServicesOpen && 'rotate-180',
                            )}
                          />
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {mobileServicesOpen && (
                          <motion.div
                            key="accordion"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.34, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <ul className="ml-4 flex flex-col gap-0.5 border-l border-smaya-gold/40 py-2 pl-3">
                              {verticalList.map((vertical, j) => {
                                const Icon = getIcon(vertical.icon)
                                return (
                                  <motion.li
                                    key={vertical.slug}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      delay: 0.05 + j * 0.045,
                                      ease: EASE_OUT,
                                    }}
                                  >
                                    <Link
                                      href={`/services/${vertical.slug}`}
                                      onClick={() => setMobileOpen(false)}
                                      data-tap
                                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base text-smaya-charcoal/80 transition-colors hover:text-smaya-plum"
                                    >
                                      <Icon
                                        size={17}
                                        aria-hidden
                                        className={
                                          vertical.accent === 'coral'
                                            ? 'text-smaya-coral'
                                            : 'text-smaya-plum'
                                        }
                                      />
                                      {vertical.name}
                                    </Link>
                                  </motion.li>
                                )
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.055, ease: EASE_OUT }}
                  >
                    <Link
                      href={link.href}
                      prefetch
                      onClick={() => setMobileOpen(false)}
                      data-tap
                      className={cn(
                        'flex items-center rounded-lg px-4 py-3 font-serif text-2xl transition-colors',
                        active
                          ? 'text-smaya-plum'
                          : 'text-smaya-charcoal hover:text-smaya-plum',
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.12 + navLinks.length * 0.055,
                  ease: EASE_OUT,
                }}
                className="mt-8 px-4"
              >
                <Link
                  href="/contact?type=consultation"
                  prefetch
                  onClick={() => setMobileOpen(false)}
                  data-tap
                  className="flex w-full items-center justify-center rounded bg-smaya-plum px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-smaya-gold hover:text-smaya-charcoal"
                >
                  Book Event
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
