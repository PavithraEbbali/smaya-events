export type PortfolioCategory =
  | 'Weddings'
  | 'Corporate'
  | 'Fitness'
  | 'Trek'
  | 'Community'
  | 'Entertainment'

export type PortfolioItem = {
  id: number
  title: string
  category: PortfolioCategory
  img: string
  /** Masonry footprint on md+ — single column below that. */
  span: string
}

/*
 * LOCAL ASSETS, NOT UNSPLASH — these were remote URLs and they did not load.
 *
 * next/image proxies a remote file at request time, so a slow origin produces a
 * BLANK CARD rather than a slow one. Measured on /gallery before the change: 8
 * of 10 images still pending after three seconds, and a direct probe of the
 * proxy aborted at four. This same list feeds the home page preview, so both
 * surfaces were showing empty boxes.
 *
 * Every path below is local and kebab-case: a filename with spaces needs
 * percent-encoding in a URL, and a capitalised path resolves on Windows
 * (case-insensitive) but 404s on the Linux host that serves production.
 */
export const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: 'Royal Udaipur Vows',
    category: 'Weddings',
    img: '/image_3.png',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    id: 2,
    title: 'Sunset Valley Trek',
    category: 'Trek',
    img: '/expedition-treks.jpg',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 3,
    title: 'Annual Sales Gala',
    category: 'Corporate',
    img: '/corporate-award-nights-realistic.jpg',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 4,
    title: 'Neon Dance Fitness',
    category: 'Fitness',
    img: '/images/zumba-training.jpg',
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    id: 5,
    title: 'Massive Pool Party',
    category: 'Fitness',
    img: '/performance-parties.jpg',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    id: 6,
    title: 'City Block Party',
    category: 'Community',
    img: '/community-festivals.jpg',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 7,
    title: 'Live Summer Concert',
    category: 'Entertainment',
    img: '/performance-concert.jpg',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 8,
    title: 'Beachfront Haldi',
    category: 'Weddings',
    img: '/haldi-celebration.png',
    span: 'md:col-span-1 md:row-span-1',
  },
]

export const portfolioCategories = [
  'All',
  'Weddings',
  'Corporate',
  'Fitness',
  'Trek',
  'Community',
  'Entertainment',
] as const

/** The five-item teaser used on the Home page. */
export const portfolioPreview = portfolioItems.slice(0, 5)
