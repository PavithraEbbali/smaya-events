import type { IconName } from '@/lib/icons'
import type { VerticalSlug } from './verticals'

export type ServiceCategory = {
  title: string
  icon: IconName
  description: string
  /** Verticals this category feeds into — rendered as through-links. */
  relatedSlugs: VerticalSlug[]
  services: { title: string; desc: string }[]
}

/**
 * The five grouped categories from the original Services page. This is the hub
 * view — the detail lives in `data/verticals.ts`, which each group links into.
 */
export const serviceCategories: ServiceCategory[] = [
  {
    title: 'Weddings & Celebrations',
    icon: 'Heart',
    description:
      'Luxurious planning and execution for your most cherished moments.',
    relatedSlugs: ['celebrations'],
    services: [
      {
        title: 'Weddings',
        desc: 'Curated matrimonial experiences from concept to flawless day-of operations.',
      },
      {
        title: 'Sangeeth Choreography',
        desc: 'Breathtaking dance routines choreographed by Manasa Raj to light up the stage.',
      },
      {
        title: 'Engagements',
        desc: 'Intimate and meticulously planned ceremonies to mark your new beginning.',
      },
      {
        title: 'Haldi & Mehendi',
        desc: 'Vibrant, colorful, and culturally rich setups for pre-wedding rituals.',
      },
      {
        title: 'Birthday Parties',
        desc: 'Custom-themed celebrations tailored for all ages and milestones.',
      },
      {
        title: 'Baby Showers & Seemantha',
        desc: 'Beautifully planned welcoming ceremonies handled with absolute care.',
      },
    ],
  },
  {
    title: 'Fitness & Wellness',
    icon: 'Activity',
    description:
      'High-energy events and restorative retreats led by our fitness experts.',
    relatedSlugs: ['fitness', 'workshops'],
    services: [
      {
        title: 'Aqua Zumba Events',
        desc: 'Massive, high-energy pool workouts mixing music, movement, and joy.',
      },
      {
        title: 'Fitness Festivals',
        desc: 'Large-scale wellness festivals featuring curated workouts and health vendors.',
      },
      {
        title: 'Dance Fitness Parties',
        desc: 'Nightclub-style fitness events where you burn calories on the dance floor.',
      },
      {
        title: 'Wellness Retreats',
        desc: 'Immersive getaways focusing on mindfulness, yoga, and inner peace.',
      },
    ],
  },
  {
    title: 'Adventure & Outdoors',
    icon: 'Compass',
    description:
      'Carefully curated expeditions for thrill-seekers and nature lovers.',
    relatedSlugs: ['adventure'],
    services: [
      {
        title: 'Trekking Experiences',
        desc: 'Guided outdoor expeditions through breathtaking landscapes.',
      },
      {
        title: 'Adventure Camps',
        desc: 'Overnight camping experiences with curated group activities and bonfires.',
      },
      {
        title: 'Team Outings',
        desc: 'Action-packed offsite days to build camaraderie and recharge.',
      },
    ],
  },
  {
    title: 'Corporate Events',
    icon: 'Users',
    description: 'Professional, impactful, and seamless business experiences.',
    relatedSlugs: ['corporate'],
    services: [
      {
        title: 'Corporate Summits & Galas',
        desc: 'End-to-end management for professional conferences and award nights.',
      },
      {
        title: 'Product Launches',
        desc: 'High-impact unveilings designed to grab attention and capture media.',
      },
      {
        title: 'Corporate Team Outings',
        desc: 'Custom retreats balancing professional development with fun.',
      },
    ],
  },
  {
    title: 'Production & Entertainment',
    icon: 'Mic',
    description: 'The technical and creative backbone of a spectacular event.',
    relatedSlugs: ['entertainment', 'community'],
    services: [
      {
        title: 'Artist Management',
        desc: 'Booking and handling elite talent, bands, DJs, and live performers.',
      },
      {
        title: 'Entertainment Events',
        desc: 'Producing public concerts, theater shows, and community festivals.',
      },
      {
        title: 'Photography & Videography',
        desc: 'Capturing priceless moments in cinematic high-fidelity formats.',
      },
      {
        title: 'Decor & Venue Management',
        desc: 'Transformative spatial design employing bespoke lighting and florals.',
      },
    ],
  },
]
