export type UpcomingEvent = {
  title: string
  date: string
  /** ISO form for <time datetime> and structured data. */
  isoDate: string
  location: string
  type: string
  img: string
  desc: string
}

/*
 * LOCAL ASSETS, NOT UNSPLASH. next/image proxies a remote file at request time,
 * so a slow origin yields a BLANK CARD rather than a slow one — measured on the
 * gallery, where the same origin left 8 of 10 images pending after three
 * seconds and the proxy aborted at four. Matched to each event by subject.
 *
 * Kebab-case throughout: spaces need percent-encoding, and a capitalised path
 * resolves on Windows but 404s on the Linux host that serves production.
 */
export const upcomingEvents: UpcomingEvent[] = [
  {
    title: 'Aqua Zumba Festival',
    date: 'Aug 15, 2026',
    isoDate: '2026-08-15',
    location: 'Grand Pool Club, City Center',
    type: 'Fitness',
    img: '/images/zumba-training.jpg',
    desc: 'Join 500+ participants for an electrifying evening of water workouts and live DJ music.',
  },
  {
    title: 'Weekend Sunrise Trek',
    date: 'Sep 02, 2026',
    isoDate: '2026-09-02',
    location: 'Nandi Hills Base Camp',
    type: 'Adventure',
    img: '/expedition-treks.jpg',
    desc: 'A guided morning hike culminating in a breathtaking sunrise view and community breakfast.',
  },
  {
    title: 'Fitness Carnival Night',
    date: 'Sep 20, 2026',
    isoDate: '2026-09-20',
    location: 'Open Air Arena',
    type: 'Wellness & Entertainment',
    img: '/performance-parties.jpg',
    desc: 'A glowing night of dance, yoga, and HIIT under the stars with healthy food stalls.',
  },
  {
    title: 'Corporate Wellness Camp',
    date: 'Oct 10, 2026',
    isoDate: '2026-10-10',
    location: 'Serenity Retreat Woods',
    type: 'Corporate Retreat',
    img: '/images/corporate-focus-retreats.jpg',
    desc: 'An exclusive invite-only retreat for corporate teams focusing on mental health and bonding.',
  },
]
