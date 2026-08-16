'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { verticalList } from '@/data/verticals'
import { getIcon } from '@/lib/icons'
import { EASE_OUT } from '@/lib/animations'

type Props = {
  onNavigate: () => void
}

/**
 * Desktop mega-menu listing all seven verticals, fed by `data/verticals.ts`.
 * The touch equivalent is the inline accordion inside the mobile menu — this
 * panel is never rendered on a touch viewport.
 */
export function ServicesMegaMenu({ onNavigate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      className="absolute left-1/2 top-full w-[min(56rem,calc(100vw-3rem))] -translate-x-1/2 pt-4"
    >
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl">
        <div className="grid grid-cols-2 gap-1 p-4 lg:grid-cols-3">
          {verticalList.map((vertical) => {
            const Icon = getIcon(vertical.icon)
            return (
              <Link
                key={vertical.slug}
                href={`/services/${vertical.slug}`}
                onClick={onNavigate}
                className="group/item flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-smaya-ivory"
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    vertical.accent === 'coral'
                      ? 'bg-smaya-coral/15 text-smaya-coral group-hover/item:bg-smaya-coral group-hover/item:text-white'
                      : 'bg-smaya-plum/10 text-smaya-plum group-hover/item:bg-smaya-plum group-hover/item:text-white'
                  }`}
                >
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-base font-bold text-smaya-charcoal transition-colors group-hover/item:text-smaya-plum">
                    {vertical.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-smaya-charcoal/55">
                    {vertical.tagline}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>

        <Link
          href="/services"
          onClick={onNavigate}
          className="flex items-center justify-between gap-4 border-t border-black/5 bg-smaya-ivory px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-smaya-plum transition-colors hover:text-smaya-gold"
        >
          View all services
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </motion.div>
  )
}
