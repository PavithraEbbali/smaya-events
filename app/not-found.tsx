import Link from 'next/link'

import { verticalList } from '@/data/verticals'
import { ButtonLink } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-smaya-ivory px-5 py-32 text-center sm:px-6">
      <span className="mb-6 block text-xs font-black uppercase tracking-[0.25em] text-smaya-plum">
        404
      </span>
      <h1 className="mb-6 max-w-2xl font-serif text-4xl font-black leading-[1.05] text-smaya-charcoal sm:text-5xl md:text-6xl">
        This Page Isn&rsquo;t On{' '}
        <span className="italic font-light text-smaya-gold">The Guest List</span>
      </h1>
      <p className="mb-10 max-w-md font-light text-smaya-charcoal/65">
        The page you were looking for has moved or never existed. Here&rsquo;s
        where to go next.
      </p>

      <ButtonLink
        href="/"
        size="lg"
        className="rounded-sm px-10 text-xs font-black uppercase tracking-[0.2em]"
      >
        Back Home
      </ButtonLink>

      <nav
        aria-label="Services"
        className="mt-12 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-2"
      >
        {verticalList.map((vertical) => (
          <Link
            key={vertical.slug}
            href={`/services/${vertical.slug}`}
            className="py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-smaya-charcoal/45 transition-colors hover:text-smaya-gold"
          >
            {vertical.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
