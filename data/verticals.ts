import type { CelebrationIconName } from '@/components/icons/CelebrationIcons'
import type { ConfettiTheme } from '@/lib/confetti'
import type { IconName } from '@/lib/icons'

export type VerticalSlug =
  | 'celebrations'
  | 'corporate'
  | 'fitness'
  | 'adventure'
  | 'entertainment'
  | 'community'
  | 'workshops'

/** Which accent the vertical leans on — see the colour usage rules. */
export type Accent = 'plum' | 'coral'

export type VerticalService = {
  icon: IconName
  title: string
  desc: string
  /**
   * Bespoke line-art glyph. Falls back to the lucide `icon` when absent, so
   * verticals without custom artwork are unaffected.
   */
  artIcon?: CelebrationIconName
  /**
   * Longer, more evocative copy for the editorial card layout. `desc` stays the
   * short form used by compact surfaces.
   */
  longDesc?: string
  /**
   * Opts this card into the tap-to-reveal treatment: the artwork fills the
   * card, and the title and copy stay hidden until the reader opens it.
   *
   * A field on the data rather than a `title === 'Weddings'` check in the
   * component — the grid renders seven of these from the same array, and a
   * hardcoded string would break silently the moment the copy is retitled.
   */
  reveal?: ServiceReveal
}

/**
 * Per-card configuration for the tap-to-reveal cards.
 *
 * EVERY VARIABLE HERE IS A NUMBER, NEVER A TAILWIND CLASS. Tailwind's scanner
 * is static: it reads source files for literal class strings and has no idea
 * what a value in this file resolves to. `w-[${n}%]` built at runtime is simply
 * never emitted, and the rule silently does not exist. So the component turns
 * these into inline styles and keeps every class literal.
 */
export type ServiceRevealArt = {
  src: string
  /** width / height of the source file. */
  aspect: number
  /** Share of the CARD's width this occupies, 0-100. */
  widthPct: number
  /**
   * Round and outline the box.
   *
   * For art that sits on a ground matching the card's, the edges are invisible
   * and this should stay off. For art with its own contrasting ground — the
   * Sangeeth night-stage pieces are near-black against a cream card — the
   * rectangle reads as a pasted screenshot unless it is deliberately framed.
   */
  framed?: boolean
}

export type ServiceReveal = {
  /** Centred artwork, shown before the click. */
  art: string
  /** width / height of `art`. */
  artAspect: number
  /**
   * Which axis the centred artwork fills. A landscape piece is bound by the
   * card's width; a portrait one by its height, and using the wrong axis either
   * overflows the card or leaves it stranded in the middle of it.
   */
  artFit: 'width' | 'height'
  /**
   * Decorative band across the top edge.
   *
   * `full` renders it at its OWN aspect ratio across the card's full width, so
   * nothing is cropped — the card then reserves that height with a top padding
   * derived from the same number. Without it the art is cropped into a fixed
   * ~96px strip, which is fine for a horizontal garland but slices the vertical
   * drapes off anything arch-shaped.
   */
  decorTop?: { src: string; aspect: number; full?: boolean }
  cornerLeft?: ServiceRevealArt
  cornerRight?: ServiceRevealArt
  /**
   * What survives at the top of the opened card.
   *
   * `full`    — icon chip AND ordinal, with `art` flying into the chip as a
   *             thumbnail rather than fading out.
   * `ordinal` — the ordinal alone, pinned to the top-right corner above the
   *             decoration. No chip, so the artwork still fades out.
   * unset     — neither; the card opens with no header at all.
   */
  header?: 'full' | 'ordinal'
  /** Per-card confetti palette and particle shapes. */
  confetti?: ConfettiTheme
  /**
   * The opened card's background, sampled from the artwork's own ground.
   *
   * None of these assets has an alpha channel, so any mismatch between the
   * card and the art shows as a hard rectangle edge. Defaults to the cream the
   * first five cards were drawn on; Seemantha's are on pure white.
   */
  ground?: string
  /**
   * The unopened card's wash, and the coloured glow beneath it.
   *
   * CSS STRINGS, NOT TAILWIND CLASSES. Tailwind's scanner never sees a value
   * that lives in this file, so `bg-gradient-to-br from-amber-200 ...` written
   * here would simply never be emitted. The hexes below are the same Tailwind
   * palette steps, resolved.
   *
   * `glow` is the card's own shadow colour, so each one radiates in its own
   * hue rather than everything sharing a neutral drop shadow.
   */
  gradient?: string
  glow?: string
}

export type VerticalColumn = {
  eyebrow: string
  title: string
  items: VerticalService[]
}

export type FeatureBand = {
  eyebrow: string
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
}

export type Vertical = {
  slug: VerticalSlug
  /** Short label for nav / cards. */
  name: string
  /** Menu + card one-liner. */
  tagline: string
  icon: IconName
  accent: Accent
  /** Split so the second half can carry the gold italic treatment. */
  heroTitle: { lead: string; accent: string }
  heroImage: string
  heroImageAlt: string
  /**
   * Optional looping hero footage. When present it replaces the still image
   * as the backdrop; the still remains the poster/fallback, so a vertical
   * without footage is unaffected.
   */
  heroVideo?: {
    /** Desktop source. */
    mp4: string
    /** Lighter cut served to small viewports and data-saver connections. */
    mobileMp4?: string
    /** Shown until the first frame is decodable, and under reduced motion. */
    poster: string
  }
  metaTitle: string
  metaDescription: string
  /** Standard "hero + grid + CTA" body. */
  grid?: {
    eyebrow: string
    title: string
    columns: 3 | 4
    /**
     * `carousel` swaps the grid for a centre-focused slider.
     *
     * Opt-in per vertical because ServiceCardGrid is shared by six of them —
     * Celebrations is the one whose seven cards leave an orphan in a 3-column
     * grid and whose reveal state is busy enough that showing several at once
     * is noise. `columns` is still read by the grid branch.
     *
     * `stack` is Corporate's scroll-driven deck, where each card pins and the
     * next gathers on top of it. Its six cards each carry their own bespoke
     * interaction, so unlike the other two layouts it also swaps the card.
     *
     * `diorama` is Adventure's cursor-tracked 3D parallax windows, `editorial`
     * is Fitness' cinematic showcase, `gallery` is Entertainment's
     * framed art wall, and `burst` is Community's centre-burst circles.
     * All four likewise bring their own card.
     */
    layout?:
      | 'grid'
      | 'carousel'
      | 'stack'
      | 'diorama'
      | 'editorial'
      | 'gallery'
      | 'burst'
    /**
     * Renders the layout WITHOUT the template's white panel, section head,
     * max-width or rounded overlap.
     *
     * For sections that own their own ground edge-to-edge. The component then
     * has to supply its own header, because the template no longer draws one.
     */
    fullBleed?: boolean
    services: VerticalService[]
  }
  /** Workshops renders two side-by-side lists instead of one grid. */
  columns?: [VerticalColumn, VerticalColumn]
  /**
   * Swaps the two-column list for a bespoke treatment that owns its own
   * section — no white panel, no max-width on the ground, no template head.
   *
   * The mirror of `grid.fullBleed`, but a separate flag because `columns` is a
   * fixed-length tuple with nowhere to hang one.
   */
  columnsLayout?: 'atelier'

  /** Corporate's numbered "why it matters" band. */
  benefits?: { title: string; desc: string }[]
  /** Fitness' Signature Series. */
  signature?: { title: string; items: string[] }
  /** Adventure's "Smaya Tribe" band. */
  band?: FeatureBand
  cta: {
    title: string
    body?: string
    label: string
    href: string
    /** `dark` = charcoal band, `plum` = plum band, `light` = ivory band. */
    tone: 'dark' | 'plum' | 'light'
  }
}

export const verticals: Record<VerticalSlug, Vertical> = {
  celebrations: {
    slug: 'celebrations',
    name: 'Celebrations',
    tagline: 'Weddings, sangeeths and every milestone in between.',
    icon: 'Heart',
    accent: 'plum',
    heroTitle: {
      lead: 'Celebrate Life’s',
      accent: 'Most Beautiful Moments',
    },
    // TODO: replace with Google Flow-generated or client-supplied asset
    heroImage:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2000',
    heroImageAlt: 'Wedding Celebration',
    heroVideo: {
      mp4: '/videos/celebrations-hero.mp4',
      mobileMp4: '/videos/celebrations-hero-mobile.mp4',
      poster: '/videos/celebrations-hero-poster.jpg',
    },
    metaTitle: 'Celebrations & Weddings',
    metaDescription:
      'Curated weddings, engagements, sangeeths, haldi & mehendi, birthdays, baby showers and seemantha ceremonies by Smaya Events.',
    grid: {
      eyebrow: 'Our Services',
      title: 'Tailored For You',
      columns: 3,
      layout: 'carousel',
      services: [
        {
          icon: 'Heart',
          artIcon: 'rings',
          title: 'Weddings',
          desc: 'Curated matrimonial experiences from concept to flawless day-of operations.',
          longDesc:
            'From the first mood board to the last farewell, one team holds the venue, the décor, the timeline and the family. You arrive as a guest at your own wedding.',
          reveal: {
            art: '/image_3.png',
            /* Marigold and rose — amber-200 / rose-200 / orange-300. */
            gradient:
              'linear-gradient(135deg, #FDE68A 0%, #FECDD3 52%, #FDBA74 100%)',
            glow: 'rgba(251,191,36,0.34)',
            artAspect: 960 / 524,
            artFit: 'width',
            /*
              `full` like the other six. This was the last structural
              difference in the set — the garland alone rendered as a cropped
              ~96px strip while every other card showed its decoration at full
              width and natural ratio, which is why Weddings read as a different
              template.
            */
            decorTop: {
              src: '/garland-top.png',
              /* 513, not 537: the asset carried 4.5% of empty ground above the
                 garland, which rendered as a bare strip between the card's top
                 edge and the flowers. Trimmed at the file. */
              aspect: 1200 / 513,
              full: true,
            },
            cornerLeft: {
              src: '/groom-family-bl.png',
              aspect: 459 / 640,
              widthPct: 31,
            },
            cornerRight: {
              src: '/bride-family-br.png',
              aspect: 526 / 640,
              widthPct: 33,
            },
          },
        },
        {
          icon: 'Star',
          artIcon: 'engagement',
          title: 'Engagements',
          desc: 'Intimate and meticulously planned ceremonies to mark your new beginning.',
          longDesc:
            'Smaller rooms, higher stakes. Engagements designed to feel unhurried and personal, where every detail sits close enough for your guests to actually notice it.',
          reveal: {
            /*
              The owner replaced this file in place with a landscape 16:9
              version — the brief called it `engagement-silhouette_2.png` in
              `public/assets/`, but no such path exists. Same filename, new
              picture, and now bound by WIDTH rather than height.
            */
            art: '/engagement-silhouette.png',
            /* Pastel florals, pushed to saturation — pink-200 / fuchsia-200 /
               violet-300, matching its drapes. */
            gradient:
              'linear-gradient(135deg, #FBCFE8 0%, #F5D0FE 50%, #C4B5FD 100%)',
            glow: 'rgba(192,132,252,0.32)',
            artAspect: 1100 / 614,
            artFit: 'width',
            /*
              `full`: this decoration is a floral ARCH whose drapes run down
              both sides, so cropping it into a fixed strip cut them off. It now
              renders at its own ratio across the full card width and the card
              reserves that height above the copy.
            */
            decorTop: {
              src: '/engagement-decor-top.png',
              /* 409, not 447 — 8.5% of empty ground trimmed off the top. */
              aspect: 1200 / 409,
              full: true,
            },
            cornerRight: {
              src: '/engagement-family-br.png',
              aspect: 816 / 640,
              widthPct: 45,
            },
            /*
              No header. The thumbnail and the ordinal are both gone, which also
              means the artwork has nothing to fly into — it simply fades out.
              Matches the Weddings card, so the two no longer disagree within
              one row.
            */
          },
        },
        {
          icon: 'Music',
          artIcon: 'sangeeth',
          title: 'Sangeeth',
          desc: 'Breathtaking dance routines to light up the stage and unite families.',
          longDesc:
            'Choreographed by Manasa Raj around who can genuinely dance and who cannot. Both sides of the family rehearse, and both sides look extraordinary on the night.',
          reveal: {
            art: '/sangeeth-initial-16x9.png',
            /* Disco — fuchsia-200 / purple-300 / indigo-300. */
            gradient:
              'linear-gradient(135deg, #F5D0FE 0%, #D8B4FE 50%, #A5B4FC 100%)',
            glow: 'rgba(168,85,247,0.34)',
            artAspect: 1100 / 614,
            artFit: 'width',
            /*
              `full` so the drapes and the string lights survive. Cropping this
              into a fixed strip would cut the swags off at both sides, which is
              the fault the owner already caught on the Weddings garland.
            */
            decorTop: {
              src: '/sangeeth-decor-top.png',
              aspect: 1200 / 597,
              full: true,
            },
            /*
              28 and 32 rather than the brief's 30/30. The two crops are
              different shapes — 1.098 for the family, 1.254 for the couple — so
              EQUAL WIDTHS would have rendered the family 14% taller than the
              couple. Sizing them in proportion to their aspects puts both at
              25.5% of the card width in height, so the two groups read at one
              scale and stand on the same floor.

              `framed`: these are night-stage scenes, near-black against a cream
              card. Without a rounded outline each reads as a pasted screenshot.
            */
            cornerLeft: {
              src: '/sangeeth-family-bl.png',
              aspect: 615 / 560,
              widthPct: 28,
              framed: true,
            },
            cornerRight: {
              src: '/sangeeth-couple-br.png',
              aspect: 702 / 560,
              widthPct: 32,
              framed: true,
            },
            /* Both corners are occupied, so the copy sits BETWEEN them. */
          },
        },
        {
          icon: 'Flower2',
          artIcon: 'haldi',
          title: 'Haldi & Mehendi',
          desc: 'Vibrant, colorful, and culturally rich setups for pre-wedding rituals.',
          longDesc:
            'Marigold, raw silk and open courtyards. Daylight functions built to photograph as beautifully as they feel, with the ritual kept exactly as your family keeps it.',
          reveal: {
            art: '/mehendi-initial-16x9.png',
            /* Turmeric — yellow-200 / amber-300 / orange-200. */
            gradient:
              'linear-gradient(135deg, #FEF08A 0%, #FCD34D 50%, #FED7AA 100%)',
            glow: 'rgba(245,158,11,0.36)',
            artAspect: 1100 / 614,
            artFit: 'width',
            /* `full` so the marigold swags, the kalash pots along the top and
               the side drapes all survive; a fixed strip would cut them. */
            decorTop: {
              src: '/haldi-decor-top.png',
              aspect: 1200 / 502,
              full: true,
            },
            /*
              30 and 31.6, not a matching pair, because the crops are different
              shapes — 1.304 and 1.371. Sized in proportion to their aspects
              both land at 23.0% of card width in height, so the pots and the
              celebration stand at one scale on the same floor. Equal WIDTHS
              would have made the pots 5% taller.

              No `framed`: unlike the Sangeeth night scenes these sit on a cream
              ground (#faedcd) all but identical to the card's, so their edges
              disappear on their own and an outline would only invent a box.
            */
            cornerLeft: {
              src: '/haldi-kalash-pots.png',
              aspect: 730 / 560,
              widthPct: 30,
            },
            cornerRight: {
              src: '/haldi-celebration.png',
              aspect: 768 / 560,
              widthPct: 31.6,
            },
            /* Both corners occupied, so the copy sits BETWEEN them. */
          },
        },
        {
          icon: 'Gift',
          artIcon: 'birthday',
          title: 'Birthdays',
          desc: 'Custom-themed celebrations tailored for all ages and milestones.',
          longDesc:
            'A first birthday and a sixtieth deserve the same care and entirely different rooms. The concept is built around the person, never around a package.',
          reveal: {
            /*
              .jpg, and in public/ root. The brief specified
              /assets/birthday-*.png — wrong directory AND wrong extension, and
              either alone would have 404ed every render.
            */
            art: '/birthday-cake-initial-16x9.jpg',
            /* Pastel-pop — pink-200 / sky-200 / amber-200. */
            gradient:
              'linear-gradient(135deg, #FBCFE8 0%, #BAE6FD 50%, #FDE68A 100%)',
            glow: 'rgba(236,72,153,0.30)',
            artAspect: 1024 / 572,
            artFit: 'width',
            decorTop: {
              src: '/birthday-decor-revealed-top.jpg',
              /* 316, not 383. This one carried 17.5% of empty ground above the
                 drapes — by far the worst of the three, and the gap the owner
                 circled. */
              aspect: 1024 / 316,
              full: true,
            },
            /* Only one corner piece, so nothing to match it against — 45% is
               the brief's number, giving 32.2% of card width in height. */
            cornerRight: {
              src: '/birthday-celebration-family.jpg',
              aspect: 799 / 572,
              widthPct: 45,
            },
            confetti: {
              colors: ['#E8437E', '#F5A623', '#7B4BC9', '#31C4B4', '#FFD166'],
              /* The brief asked for chocolate shapes rather than plain
                 confetti; these are rasterised once each by shapeFromText. */
              emoji: ['🍫', '🎂', '🧁'],
            },
          },
        },
        {
          icon: 'Baby',
          artIcon: 'babyShower',
          title: 'Baby Showers',
          desc: 'Beautifully planned welcoming ceremonies handled with absolute care.',
          longDesc:
            'Soft palettes, seated comfort and a pace that suits the mother-to-be. Everything is arranged so she is celebrated without being exhausted by it.',
          reveal: {
            art: '/baby-shower-initial-silhouette-16x9.jpg',
            /* Same pastel-pop trio as Birthdays, with a sky glow rather than a
               pink one so the two sit apart in the carousel. */
            gradient:
              'linear-gradient(135deg, #BAE6FD 0%, #FBCFE8 50%, #FDE68A 100%)',
            glow: 'rgba(56,189,248,0.32)',
            artAspect: 1024 / 572,
            artFit: 'width',
            /*
              The supplied decor is a full-bleed damask PATTERN, not a top band —
              at its native 1.79 it would have reserved 58% of the card width in
              height before a word of copy. Cropped to the bunting and the top of
              the damask arches, which is the part that reads as a header.
            */
            decorTop: {
              src: '/baby-shower-bg-decor-revealed.jpg',
              aspect: 1024 / 257,
              full: true,
            },
            /*
              THE TWO CROPS ARE THE SAME SHAPE — 1.119 and 1.128 — so unlike
              every previous card, the brief's 30/45 split does NOT equalise
              anything: it makes the blessing scene 50% taller than the cradle.
              Kept as specified because the subjects differ in kind (a single
              prop against a three-figure scene, so a hierarchy is defensible),
              but it is a deliberate imbalance, not the parity the other cards
              have. 34/38 would render them the same height.
            */
            cornerLeft: {
              src: '/baby-shower-cradle-bl.jpg',
              aspect: 461 / 412,
              widthPct: 30,
            },
            cornerRight: {
              src: '/baby-shower-celebration-br.jpg',
              aspect: 645 / 572,
              widthPct: 45,
            },
            confetti: {
              colors: ['#A8D8EA', '#F7C5D0', '#FCE38A', '#D4AF37', '#FFFFFF'],
            },
          },
        },
        {
          icon: 'Sprout',
          artIcon: 'seemantha',
          title: 'Seemantha',
          desc: 'Traditional blessing ceremonies respecting customs and family traditions.',
          longDesc:
            'The rituals are led by your elders; we hold everything around them. Traditional observance, staged with the composure of a modern celebration.',
          reveal: {
            art: '/seemantha-initial-16x9.jpg',
            /* Marigold and rose, like Weddings, but glowing orange. */
            gradient:
              'linear-gradient(135deg, #FDBA74 0%, #FECDD3 50%, #FDE68A 100%)',
            glow: 'rgba(251,146,60,0.34)',
            artAspect: 1024 / 572,
            artFit: 'width',
            /* Cropped to the swag, bells and the top of the side drapes; the
               bottom fades out under the mask. */
            decorTop: {
              src: '/seemantha-decor-top.jpg',
              aspect: 1024 / 391,
              full: true,
            },
            /*
              38 and 28 — the INVERSE of the brief's 30/45, and deliberately so.

              The two crops came out opposite shapes: the sweets are wide
              (1.502), the blessing is tall (0.958). Widths do not describe
              size here. At the brief's 30/45 the blessing would render 2.35x
              the sweets' HEIGHT — 183px against 78px at 1280 — and its 47%
              height would have forced a 58% bottom reserve on the card.
              38/28 puts them at 25.3% and 29.2% of card width in height, so the
              blessing still leads by ~15% as the focal point without dwarfing
              the offering.
            */
            cornerLeft: {
              src: '/seemantha-pooja-sweets-bl.jpg',
              aspect: 461 / 307,
              widthPct: 38,
            },
            cornerRight: {
              src: '/seemantha-blessing-br.jpg',
              aspect: 461 / 481,
              widthPct: 28,
            },
            /* These three are drawn on PURE WHITE, not the cream the other five
               use. Sampled #fefefe-#ffffff on all three. */
            ground: '#ffffff',
            confetti: {
              colors: ['#F5A623', '#FFC93C', '#7CB342', '#E8641B', '#FFF3C4'],
            },
          },
        },
      ],
    },
    cta: {
      title: 'Ready to Celebrate?',
      body: 'Let us handle the details while you enjoy your beautiful moments.',
      label: 'Plan Your Celebration',
      href: '/contact',
      tone: 'plum',
    },
  },

  corporate: {
    slug: 'corporate',
    name: 'Corporate',
    tagline: 'Conferences, launches and galas that land.',
    icon: 'Briefcase',
    accent: 'plum',
    heroTitle: {
      lead: 'Professional Events That',
      accent: 'Inspire Teams',
    },
    // TODO: replace with Google Flow-generated or client-supplied asset
    heroImage:
      'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2000',
    heroImageAlt: 'Corporate Event',
    heroVideo: {
      mp4: '/videos/corporate-hero.mp4',
      mobileMp4: '/videos/corporate-hero-mobile.mp4',
      poster: '/videos/corporate-hero-poster.jpg',
    },
    metaTitle: 'Corporate Events',
    metaDescription:
      'Conferences, product launches, team building, annual days, corporate retreats and award nights, managed end to end by Smaya Events.',
    grid: {
      eyebrow: 'Corporate Solutions',
      title: 'Tailored For Business',
      columns: 3,
      layout: 'stack',
      services: [
        {
          icon: 'Presentation',
          title: 'Conferences',
          desc: 'End-to-end management for professional conferences and industry summits.',
        },
        {
          icon: 'Rocket',
          title: 'Product Launch',
          desc: 'High-impact unveilings designed to grab attention and capture media.',
        },
        {
          icon: 'Users',
          title: 'Team Building',
          desc: 'Action-packed offsite days to build camaraderie and recharge your team.',
        },
        {
          icon: 'Briefcase',
          title: 'Annual Day',
          desc: "Grand celebrations to mark your company's milestones and year-end success.",
        },
        {
          icon: 'TrendingUp',
          title: 'Corporate Retreats',
          desc: 'Custom retreats balancing professional development with fun.',
        },
        {
          icon: 'Award',
          title: 'Award Nights',
          desc: 'Glamorous galas to recognize and reward outstanding achievements.',
        },
      ],
    },
    benefits: [
      {
        title: 'Team Engagement',
        desc: 'Boost morale and foster a highly engaged, collaborative company culture.',
      },
      {
        title: 'Productivity Boost',
        desc: 'Re-energize employees through immersive off-site experiences and fun activities.',
      },
      {
        title: 'Brand Impact',
        desc: 'Elevate your corporate image with flawlessly executed events that impress stakeholders.',
      },
    ],
    cta: {
      title: 'Elevate Your Corporate Culture',
      body: 'Connect with our team to start organizing your next impactful corporate gathering.',
      label: 'Plan Your Event',
      href: '/contact',
      tone: 'dark',
    },
  },

  fitness: {
    slug: 'fitness',
    name: 'Fitness & Wellness',
    tagline: 'Aqua Zumba, dance fitness parties and wellness retreats.',
    icon: 'Dumbbell',
    accent: 'coral',
    heroTitle: {
      lead: 'Where Fitness Becomes',
      accent: 'Celebration',
    },
    // TODO: replace with Google Flow-generated or client-supplied asset
    heroImage:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2000',
    heroImageAlt: 'Fitness Party',
    heroVideo: {
      mp4: '/videos/fitness-hero.mp4',
      mobileMp4: '/videos/fitness-hero-mobile.mp4',
      poster: '/videos/fitness-hero-poster.jpg',
    },
    metaTitle: 'Fitness & Wellness Experiences',
    metaDescription:
      'Aqua Zumba, dance fitness parties, fitness carnivals, HIIT bootcamps, yoga, walkathons, color runs and wellness retreats by Smaya Events.',
    grid: {
      eyebrow: 'Wellness Experiences',
      title: 'Move. Sweat. Connect.',
      columns: 4,
      layout: 'editorial',
      services: [
        {
          icon: 'Waves',
          title: 'Aqua Zumba',
          desc: 'Massive, high-energy pool workouts mixing music, movement, and joy.',
        },
        {
          icon: 'Music',
          title: 'Dance Fitness Parties',
          desc: 'Nightclub-style fitness events where you burn calories on the dance floor.',
        },
        {
          icon: 'Flame',
          title: 'Fitness Carnival',
          desc: 'Large-scale wellness festivals featuring curated workouts and health vendors.',
        },
        {
          icon: 'Zap',
          title: 'HIIT Bootcamps',
          desc: 'Intense, community-driven interval training sessions for all fitness levels.',
        },
        {
          icon: 'Sun',
          title: 'Yoga Sessions',
          desc: 'Restorative outdoor and indoor yoga classes for mindfulness and inner peace.',
        },
        {
          icon: 'Activity',
          title: 'Walkathons',
          desc: 'Organized community walks to promote health, wellness, and charity.',
        },
        {
          icon: 'Sparkles',
          title: 'Color Runs',
          desc: 'Fun-filled recreational running events bursting with color and celebration.',
        },
        {
          icon: 'Tent',
          title: 'Wellness Retreats',
          desc: 'Immersive weekend getaways focusing on holistic health, meditation, and fitness.',
        },
      ],
    },
    signature: {
      title: 'Signature Series',
      items: ['Smaya Aqua Blast', 'Glow Fitness Party', 'Women Thrive Day'],
    },
    cta: {
      title: 'Join The Movement',
      body: 'Check out our upcoming events or organize a custom wellness festival for your brand.',
      label: 'Join Next Fitness Event',
      href: '/events',
      tone: 'light',
    },
  },

  adventure: {
    slug: 'adventure',
    name: 'Adventure',
    tagline: 'Treks, camps and journeys into the outdoors.',
    icon: 'Mountain',
    accent: 'coral',
    heroTitle: {
      lead: 'Experience Adventure',
      accent: 'Like Never Before',
    },
    // TODO: replace with Google Flow-generated or client-supplied asset
    heroImage:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2000',
    heroImageAlt: 'Trekking',
    heroVideo: {
      mp4: '/videos/adventure-hero.mp4',
      mobileMp4: '/videos/adventure-hero-mobile.mp4',
      poster: '/videos/adventure-hero-poster.jpg',
    },
    metaTitle: 'Adventure & Outdoors',
    metaDescription:
      'Guided treks, camping, cycling trips, backpacking and nature retreats with the Smaya Tribe.',
    grid: {
      eyebrow: 'Expeditions',
      title: 'Conquer The Outdoors',
      columns: 3,
      layout: 'diorama',
      services: [
        {
          icon: 'Route',
          title: 'Treks',
          desc: 'Guided outdoor expeditions including Sunrise, Night, and Monsoon treks.',
        },
        {
          icon: 'Tent',
          title: 'Camping',
          desc: 'Overnight wilderness experiences with curated group activities and bonfires.',
        },
        {
          icon: 'Bike',
          title: 'Cycling Trips',
          desc: 'Scenic group cycling tours designed to test endurance and showcase nature.',
        },
        {
          icon: 'Compass',
          title: 'Backpacking',
          desc: 'Multi-day travel experiences emphasizing community and exploration.',
        },
        {
          icon: 'Sun',
          title: 'Nature Retreats',
          desc: 'Peaceful escapes into nature to disconnect from the digital world.',
        },
      ],
    },
    band: {
      eyebrow: 'Community',
      title: 'The Smaya Tribe',
      body: 'Join a community of thrill-seekers, nature lovers, and explorers. Our adventures are designed not just to test limits, but to forge lifelong bonds under the open sky.',
      ctaLabel: 'See Upcoming Treks',
      ctaHref: '/events',
    },
    cta: {
      title: 'Plan Your Escape',
      label: 'Contact Us',
      href: '/contact',
      tone: 'light',
    },
  },

  entertainment: {
    slug: 'entertainment',
    name: 'Entertainment',
    tagline: 'DJ nights, live concerts and theme parties.',
    icon: 'Mic',
    accent: 'coral',
    heroTitle: {
      lead: 'Entertainment That',
      accent: 'Moves People',
    },
    // TODO: replace with Google Flow-generated or client-supplied asset
    heroImage:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2000',
    heroImageAlt: 'Concert',
    heroVideo: {
      mp4: '/videos/entertainment-hero.mp4',
      mobileMp4: '/videos/entertainment-hero-mobile.mp4',
      poster: '/videos/entertainment-hero-poster.jpg',
    },
    metaTitle: 'Entertainment & Live Production',
    metaDescription:
      'DJ nights, live concerts, comedy shows, theme parties and talent shows produced by Smaya Events.',
    grid: {
      eyebrow: 'Performances',
      title: 'The Main Stage',
      columns: 3,
      layout: 'gallery',
      fullBleed: true,
      services: [
        {
          icon: 'Music',
          title: 'DJ Nights',
          desc: 'Electrifying DJ performances featuring state-of-the-art sound and lighting.',
        },
        {
          icon: 'Mic',
          title: 'Live Concerts',
          desc: 'Producing public and private concerts with elite bands and performers.',
        },
        {
          icon: 'Smile',
          title: 'Comedy Shows',
          desc: 'Curating hilarious stand-up events with renowned comedians.',
        },
        {
          icon: 'PartyPopper',
          title: 'Theme Parties',
          desc: 'Immersive parties with elaborate decor, concepts, and dress codes.',
        },
        {
          icon: 'Star',
          title: 'Talent Shows',
          desc: 'Giving platforms to rising stars through well-organized talent events.',
        },
      ],
    },
    cta: {
      title: 'Book Elite Talent',
      body: 'From finding the right performers to handling technical production, we make magic happen.',
      label: 'Plan Your Show',
      href: '/contact',
      tone: 'plum',
    },
  },

  community: {
    slug: 'community',
    name: 'Community',
    tagline: 'Apartment events, meetups and city-wide festivals.',
    icon: 'UsersRound',
    accent: 'coral',
    heroTitle: {
      lead: 'Building Stronger Communities',
      accent: 'Through Experiences',
    },
    // TODO: replace with Google Flow-generated or client-supplied asset
    heroImage:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2000',
    heroImageAlt: 'Community Event',
    heroVideo: {
      mp4: '/videos/community-hero.mp4',
      mobileMp4: '/videos/community-hero-mobile.mp4',
      poster: '/videos/community-hero-poster.jpg',
    },
    metaTitle: 'Community Experiences',
    metaDescription:
      'Apartment events, women meetups, pet meetups, family days and festivals that bring neighbourhoods together.',
    grid: {
      eyebrow: 'Togetherness',
      title: 'Gather & Connect',
      columns: 3,
      layout: 'burst',
      services: [
        {
          icon: 'Building2',
          title: 'Apartment Events',
          desc: 'Building neighborly bonds through well-organized society festivals and sports days.',
        },
        {
          icon: 'Users',
          title: 'Women Meetups',
          desc: 'Empowering gathering spaces for networking, health, and mutual support.',
        },
        {
          icon: 'PawPrint',
          title: 'Pet Meetups',
          desc: 'Fun-filled days designed for furry friends and their passionate owners.',
        },
        {
          icon: 'PartyPopper',
          title: 'Family Days',
          desc: 'Wholesome carnival-style events with games and activities for all generations.',
        },
        {
          icon: 'Calendar',
          title: 'Festivals',
          desc: 'Large-scale cultural and seasonal celebrations bringing the city together.',
        },
      ],
    },
    cta: {
      title: 'Bring Your People Together',
      body: 'Let’s plan an event that strengthens your community bonds.',
      label: 'Start Planning',
      href: '/contact',
      tone: 'dark',
    },
  },

  workshops: {
    slug: 'workshops',
    columnsLayout: 'atelier',
    name: 'Workshops & Retreats',
    tagline: 'Masterclasses, training and deep-dive retreats.',
    icon: 'Lightbulb',
    accent: 'plum',
    heroTitle: {
      lead: 'Learn, Grow,',
      accent: 'Experience',
    },
    // TODO: replace with Google Flow-generated or client-supplied asset
    heroImage:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000',
    heroImageAlt: 'Workshop Event',
    heroVideo: {
      mp4: '/videos/workshops-hero.mp4',
      mobileMp4: '/videos/workshops-hero-mobile.mp4',
      poster: '/videos/workshops-hero-poster.jpg',
    },
    metaTitle: 'Workshops & Retreats',
    metaDescription:
      'Dance masterclasses, Zumba training, yoga foundations and public speaking workshops, plus wellness, corporate focus and meditation retreats.',
    columns: [
      {
        eyebrow: 'Skill Building',
        title: 'Workshops',
        items: [
          {
            icon: 'Sparkles',
            title: 'Dance Masterclasses',
            desc: 'Learn new styles and choreography from industry experts.',
            longDesc:
              'Learn new styles and choreography from industry experts in a high-energy studio environment.',
          },
          {
            icon: 'Activity',
            title: 'Zumba Training',
            desc: 'High-intensity sessions to perfect your form and endurance.',
            longDesc:
              'High-intensity fitness sessions designed to perfect form, rhythm, and cardiovascular endurance.',
          },
          {
            icon: 'Flower2',
            title: 'Yoga Foundations',
            desc: 'Deepen your practice with focused postural workshops.',
            longDesc:
              'Deepen your practice and build core alignment with focused postural workshops in nature.',
          },
          {
            icon: 'Megaphone',
            title: 'Public Speaking',
            desc: 'Build confidence and stage presence in a supportive environment.',
            longDesc:
              'Build unshakeable confidence, vocal presence, and stage command in a supportive setting.',
          },
        ],
      },
      {
        eyebrow: 'Deep Dive',
        title: 'Retreats',
        items: [
          {
            icon: 'Flower2',
            title: 'Wellness Retreats',
            desc: 'Multi-day escapes focused on detoxing, nutrition, and mindfulness.',
            longDesc:
              'Multi-day immersive escapes focused on total body detox, bespoke nutrition, and mindfulness.',
          },
          {
            icon: 'Target',
            title: 'Corporate Focus Retreats',
            desc: 'Strategic planning sessions mixed with team bonding in nature.',
            longDesc:
              'Strategic executive planning sessions harmonized with deep team bonding in scenic natural estates.',
          },
          {
            icon: 'Brain',
            title: 'Meditation Camps',
            desc: 'Silent retreats designed to quiet the mind and restore inner peace.',
            longDesc:
              'Silent guided retreats structured to quiet the mental clutter and restore deep inner peace.',
          },
        ],
      },
    ],
    cta: {
      title: 'Ready to Transform?',
      label: 'Inquire Now',
      href: '/contact',
      tone: 'light',
    },
  },
}

/** Stable display order — nav, mega-menu, services hub and the home grid. */
export const verticalOrder: VerticalSlug[] = [
  'celebrations',
  'corporate',
  'fitness',
  'adventure',
  'entertainment',
  'community',
  'workshops',
]

export const verticalList: Vertical[] = verticalOrder.map((s) => verticals[s])

export function getVertical(slug: string): Vertical | undefined {
  return verticals[slug as VerticalSlug]
}
