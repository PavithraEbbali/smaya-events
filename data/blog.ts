export type BlogPost = {
  slug: string
  title: string
  category: string
  date: string
  /** ISO form for <time datetime> and structured data. */
  isoDate: string
  img: string
  excerpt: string
}

/*
 * LOCAL ASSETS, NOT UNSPLASH. next/image proxies a remote file at request time,
 * so a slow origin yields a BLANK CARD rather than a slow one — measured on the
 * gallery, where the same origin left 8 of 10 images pending after three
 * seconds and a direct probe of the proxy aborted at four.
 *
 * Kebab-case throughout: spaces need percent-encoding, and a capitalised path
 * resolves on Windows but 404s on the Linux host that serves production.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: '10-essentials-for-planning-a-luxury-wedding',
    title: '10 Essentials for Planning a Luxury Wedding',
    category: 'Weddings',
    date: 'May 12, 2026',
    isoDate: '2026-05-12',
    img: '/image_3.png',
    excerpt:
      'Discover the critical elements that elevate a standard wedding into a deeply personal, luxurious experience...',
  },
  {
    slug: 'why-aqua-zumba-is-the-ultimate-summer-workout',
    title: 'Why Aqua Zumba is the Ultimate Summer Workout',
    category: 'Fitness',
    date: 'Jun 04, 2026',
    isoDate: '2026-06-04',
    img: '/images/zumba-training.jpg',
    excerpt:
      'Combining the joy of dance with the resistance of water, Aqua Zumba is taking the fitness world by storm...',
  },
  {
    slug: 'how-to-build-high-performing-teams-outdoors',
    title: 'How to Build High-Performing Teams Outdoors',
    category: 'Corporate',
    date: 'Jun 18, 2026',
    isoDate: '2026-06-18',
    img: '/images/corporate-focus-retreats.jpg',
    excerpt:
      'Nature provides the best backdrop for developing leadership and camaraderie within corporate structures...',
  },
  {
    slug: 'the-rise-of-womens-wellness-retreats',
    title: "The Rise of Women's Wellness Retreats",
    category: 'Wellness',
    date: 'Jul 01, 2026',
    isoDate: '2026-07-01',
    img: '/images/wellness-retreats.jpg',
    excerpt:
      'Why more women are seeking out immersive weekend escapes to disconnect, recharge, and find balance...',
  },
  {
    slug: 'night-trekking-a-beginners-guide',
    title: "Night Trekking: A Beginner's Guide",
    category: 'Adventure',
    date: 'Jul 15, 2026',
    isoDate: '2026-07-15',
    img: '/expedition-treks.jpg',
    excerpt:
      'Everything you need to know before you lace up your boots and brave the trails under the moonlight...',
  },
  {
    slug: 'creating-the-perfect-corporate-gala-timeline',
    title: 'Creating the Perfect Corporate Gala Timeline',
    category: 'Corporate',
    date: 'Aug 02, 2026',
    isoDate: '2026-08-02',
    img: '/corporate-award-nights-realistic.jpg',
    excerpt:
      'Mastering the flow of a large-scale corporate event is an art form. Here are our top tips for a seamless night...',
  },
]
