import type { Metadata } from 'next'

import { site } from '@/data/site'
import { upcomingEvents } from '@/data/events'
import { EventsList } from '@/components/events/EventsList'
import { PageHero } from '@/components/ui/PageHero'

const description =
  'Aqua Zumba Festival, Weekend Sunrise Trek, Fitness Carnival Night and Corporate Wellness Camp — the Smaya Events calendar.'

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description,
  alternates: { canonical: '/events' },
  openGraph: {
    title: `Upcoming Events | ${site.name}`,
    description,
    url: '/events',
  },
}

const eventsJsonLd = {
  '@context': 'https://schema.org',
  '@graph': upcomingEvents.map((event) => ({
    '@type': 'Event',
    name: event.title,
    startDate: event.isoDate,
    description: event.desc,
    /*
      ABSOLUTE, because the images became local paths.
      Structured data is consumed off-site, where `/images/foo.jpg` resolves
      against the crawler's own host and points at nothing. This was previously
      a full Unsplash URL and so happened to be correct by accident.
    */
    image: `${site.url}${event.img}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    },
    organizer: { '@type': 'Organization', name: site.name, url: site.url },
  })),
}

export default function EventsPage() {
  return (
    /*
      The page shell carried `bg-smaya-ivory` — that was the "white background",
      not something leaking through from behind. The hero was already dark, so
      the ivory only showed below it, which is exactly where the event list sits.
    */
    <div className="surface-obsidian relative flex w-full flex-col font-sans text-white">
      {/*
        Measured: the shell plus the footer cover the document exactly, so no
        ivory is reachable by scrolling. This closes the one case that leaves —
        rubber-band overscroll on iOS, which paints the BODY colour above the
        hero regardless of what the shell covers. Same guard the gallery
        carries, so the two dark pages behave identically.
      */}
      <div aria-hidden className="surface-obsidian fixed inset-0 -z-10" data-floor />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
      />
      <PageHero eyebrow="Calendar" title="Upcoming Events" />
      <EventsList events={upcomingEvents} />
    </div>
  )
}
