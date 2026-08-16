'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, type Variants } from 'framer-motion'

import { celebrationBurst, type ConfettiHandle } from '@/lib/confetti'
import type { Accent, VerticalService } from '@/data/verticals'
import { getCelebrationIcon } from '@/components/icons/CelebrationIcons'
import { getIcon } from '@/lib/icons'
import { staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'
import { useInViewOnce, usePointerFine, usePrefersReducedMotion } from '@/lib/hooks'
import { alpha } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { FeatureCarousel } from '@/components/ui/FeatureCarousel'
import { CorporateStack } from '@/components/services/CorporateStack'
import { ExpeditionDiorama } from '@/components/services/ExpeditionDiorama'
import { WellnessShowcase } from '@/components/services/WellnessShowcase'
import { StageGallery } from '@/components/services/StageGallery'
import { CommunityBurst } from '@/components/services/CommunityBurst'

type Props = {
  services: readonly VerticalService[]
  accent: Accent
  columns: 3 | 4
  layout?: 'grid' | 'carousel' | 'stack' | 'diorama' | 'editorial' | 'gallery' | 'burst'
}

/**
 * Editorial service cards.
 *
 * Not a boxed tile: `gap-px` over a tinted background means the GAPS are the
 * rules, so neighbouring cards never double-border and the block reads as one
 * ruled sheet. Craft reference is 21st.dev — restraint and precise motion —
 * rather than any specific component.
 *
 * Accessibility notes, because they drove real decisions here:
 *  - Cards are informational, NOT links. Each ritual has no page of its own, so
 *    linking all seven at /contact would hand screen-reader users seven
 *    identical, meaningless links. They stay a plain <ul>/<li> with headings.
 *  - Consequently the hover treatment is purely decorative — nothing is
 *    conveyed by hover alone, so there is no keyboard trap or hidden content.
 *  - The ordinal and the icon are decorative duplicates of the adjacent title
 *    and are hidden from assistive tech.
 */
export function ServiceCardGrid({
  services,
  accent,
  columns,
  layout = 'grid',
}: Props) {
  /*
    THE CARD ITSELF IS IDENTICAL IN BOTH LAYOUTS.

    `ServiceCard` renders an <li> and knows nothing about which container it is
    in — the reveal, the confetti and the whole stacking scheme are unchanged.
    Only the wrapper differs, which is why the carousel could be added without
    touching any of the seven cards' behaviour.
  */
  /*
    `stack` is the one layout whose CARD is different too.

    Corporate's six cards each carry a bespoke interaction, so they cannot reuse
    `ServiceCard` the way the carousel does — the whole deck lives in
    CorporateStack. Branching here rather than in VerticalTemplate keeps every
    vertical's section chrome (eyebrow, title, spacing) identical.
  */
  if (layout === 'stack') {
    return <CorporateStack services={services} />
  }

  /* Adventure's 3D parallax diorama windows. Like `stack`, it replaces the
     card as well as the container — a cursor-tracked landscape frame has
     nothing in common with the editorial tile ServiceCard renders. */
  if (layout === 'diorama') {
    return <ExpeditionDiorama services={services} />
  }

  /* Fitness' cinematic editorial showcase. Same rule as the other bespoke
     layouts: it replaces the card as well as the container. */
  if (layout === 'editorial') {
    return <WellnessShowcase services={services} />
  }

  /* Entertainment's framed gallery wall. Same rule as the other bespoke
     layouts: it replaces the card as well as the container. */
  if (layout === 'gallery') {
    return <StageGallery services={services} />
  }

  /* Community's centre-burst circles. Same rule as the other bespoke layouts:
     it replaces the card as well as the container. */
  if (layout === 'burst') {
    return <CommunityBurst services={services} />
  }

  if (layout === 'carousel') {
    return (
      <FeatureCarousel
        label="Celebration services"
        slides={services.map((service, index) => ({
          key: service.title,
          label: service.title,
          /* The card's own artwork doubles as the section's ambient wash. */
          ambient: service.reveal?.art,
          render: (spotlight: boolean) => (
            /*
              A one-item <ul> per slide, not a bare <li>.

              `ServiceCard` is an <li> and an <li> outside a list is invalid and
              loses its list semantics. Wrapping each slide keeps the markup
              valid without the card needing to know. The rounded overflow that
              the grid uses to draw its hairline rules is dropped here: a slide
              is a single card, so there are no gaps to turn into rules, and
              clipping the wrapper would fight the carousel's no-clip rule.
            */
            <ul>
              <ServiceCard
                service={service}
                index={index}
                accent={accent}
                standalone
                spotlight={spotlight}
              />
            </ul>
          ),
        }))}
      />
    )
  }

  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn(
        'grid gap-px overflow-hidden rounded-2xl bg-smaya-charcoal/10',
        // `items-stretch` is the default, and every card is a flex column, so
        // all cards in a row share the tallest height automatically.
        columns === 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {services.map((service, index) => (
        <ServiceCard
          key={service.title}
          service={service}
          index={index}
          accent={accent}
        />
      ))}
    </motion.ul>
  )
}

/**
 * Reveal transition for the title and copy. `y: 20 -> 0` with a fade, delayed
 * per element so they arrive after the silhouette has started moving.
 *
 * These carry an EXPLICIT `animate`, which is not optional: the grid's
 * <motion.ul> propagates its "hidden"/"show" variant names down the whole
 * subtree, so without one these would inherit "show" from the scroll reveal and
 * appear immediately, defeating the interaction.
 */
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

/**
 * <AnimatePresence> when `enabled`, a bare fragment otherwise.
 *
 * Exists so the exit wrapper can be switched off for cards whose artwork flies
 * into the icon chip: an exiting element keeps its `layoutId` until the exit
 * finishes, which would leave two elements claiming the same id mid-flight.
 * Rendering the wrapper conditionally in JSX would remount the subtree on every
 * toggle; a component keeps the tree stable.
 */
function ConditionalPresence({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  if (!enabled) return <>{children}</>
  return <AnimatePresence>{children}</AnimatePresence>
}

/* -------------------------------------------------------------------------- *
 * The master card template.
 *
 * These are the numbers that used to live per-card in data, where they drifted:
 * the copy panel ran 55%, 70% and full-width-with-a-wash across the seven, and
 * the bottom reserve was hand-tuned seven times. Holding them here means a card
 * CANNOT diverge — there is no per-card knob left to set differently.
 *
 * What stays per-card is only what genuinely differs: which files, their aspect
 * ratios, and the relative width of the two corner pieces.
 * -------------------------------------------------------------------------- */

/** Copy panel width, as a share of the card's content box. */
const PANEL_PCT = 85

/* --------------------------- The vertical budget ---------------------------
   EVERY BAND IS A SHARE OF THE CARD'S HEIGHT, and that is what makes a fixed
   height actually hold.

   The old layout reserved space with percentage PADDING, which CSS resolves
   against WIDTH — so the decoration and corner bands were sized by one axis
   while the card was constrained on the other, and the card had to grow to
   640px to fit them. Expressed against height instead, the three bands add to
   a known total and the card cannot be pushed past it.

     32  decoration
     41  copy          (33% -> 73%)
     27  corner art
   Caps below leave 1% of slack above the decoration and 3% under the copy.
--------------------------------------------------------------------------- */
/**
 * How long a card sits in the spotlight before opening itself.
 *
 * The clearing rules are in the effect that reads this — navigating away or
 * opening the card by hand both cancel it.
 */
const AUTO_REVEAL_MS = 2500

/*
  REBALANCED FOR THE SHORTER CARD. At 430px the old 32/39/27 split left the
  copy band at 168px against a panel that measures 183, so the copy would have
  pushed into the corner art. Giving the copy 43% and trimming both reserves
  keeps every band clear at the new height.
*/
const DECOR_MAX_H_PCT = 30
const COPY_TOP_PCT = 31
const COPY_BOTTOM_PCT = 25
/**
 * Corner art height. Width follows from each piece's own aspect ratio, which
 * is what keeps a card's two pieces at identical scale for free.
 *
 * Back to 24 on the shorter card. 26% of 430 is very nearly 26% of 500 in
 * absolute terms, so the pieces keep their previous physical size while the
 * copy gets the percentage points it needs.
 */
const CORNER_H_PCT = 24

const revealAt = (delay: number) => ({
  duration: 0.5,
  delay,
  ease: [0.22, 1, 0.36, 1] as const,
})

function ServiceCard({
  service,
  index,
  accent,
  standalone = false,
  spotlight,
}: {
  service: VerticalService
  index: number
  accent: Accent
  /**
   * The card is its own object rather than a cell in the ruled sheet.
   *
   * In the grid, corners and edges are drawn by the <ul> — `gap-px` over a
   * tinted background turns the gaps into hairline rules and `overflow-hidden`
   * rounds the block. A carousel slide has no neighbours to rule against, so it
   * has to carry its own radius and shadow.
   */
  standalone?: boolean
  /**
   * This card is the one in the spotlight — the centred carousel slide.
   *
   * Undefined in the grid, where every card is equally present and none should
   * open itself.
   */
  spotlight?: boolean
}) {
  const ref = useRef<HTMLLIElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const silhouetteRef = useRef<HTMLButtonElement>(null)
  const burstRef = useRef<ConfettiHandle | null>(null)
  const drawn = useInViewOnce(ref)
  const pointerFine = usePointerFine()
  const reduced = usePrefersReducedMotion()

  const coral = accent === 'coral'
  const ArtIcon = service.artIcon ? getCelebrationIcon(service.artIcon) : null
  const LucideIcon = getIcon(service.icon)

  /* ---------------------------- Reveal state ----------------------------
     One boolean drives everything. A `reveal` config opts a card in; every
     other card in the grid renders exactly as before, with `revealed` pinned
     true so none of the reveal-gated animations ever apply to them. */
  const rv = service.reveal
  const isRevealCard = Boolean(rv)
  const [opened, setOpened] = useState(false)
  const revealed = !isRevealCard || opened
  const shownAt = revealed ? 'show' : 'hidden'

  /*
    Two mutually exclusive exits, chosen by whether the card keeps a header.

    With a header the artwork FLIES into the icon chip via a shared `layoutId`.
    Without one there is no target, so it fades and shrinks under
    <AnimatePresence> instead. The two cannot be combined: an exiting element
    holds its layoutId until the exit finishes, so both copies would claim the
    same id and framer would animate from the wrong one.
  */
  /* Only a FULL header has a chip to fly into. `ordinal` keeps the number and
     nothing else, so the artwork still fades out. */
  const flies = rv?.header === 'full'
  const layoutId = `reveal-art-${service.title}`


  /* The 5px hover lift is disabled on the reveal card. It sits on an ANCESTOR
     of the shared-layout image, and framer measures layout animations against
     the viewport — an ancestor mid-spring while the silhouette is flying to the
     icon slot makes it land off-target. The card has its own richer hover
     treatment, so nothing is lost. */
  const lift = pointerFine && !reduced && !isRevealCard

  const handleReveal = () => {
    if (opened) return
    setOpened(true)

    if (reduced) return
    const el = silhouetteRef.current
    if (!el) return
    /* canvas-confetti works in viewport-normalised coordinates, so the
       silhouette's centre has to be converted out of CSS pixels. */
    const r = el.getBoundingClientRect()
    burstRef.current = celebrationBurst(
      {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      },
      rv?.confetti,
    )
  }

  /* The button that had focus unmounts on reveal, which would drop focus to
     <body> and lose a keyboard user's place. Hand it to the heading that just
     appeared instead. */
  useEffect(() => {
    if (!opened) return
    headingRef.current?.focus({ preventScroll: true })
  }, [opened])

  useEffect(() => () => burstRef.current?.cancel(), [])

  /*
    AUTO-REVEAL AFTER FIVE SECONDS IN THE SPOTLIGHT.

    The timer lives HERE rather than in the carousel because `opened` does. The
    carousel only says which card is centred; the card decides what that means,
    and the three clearing rules then fall out of the dependency list rather
    than needing to be written:

      - navigate away  -> `spotlight` flips false, cleanup clears the timeout
      - open it first  -> `opened` flips true, the effect bails before arming
      - unmount        -> cleanup

    `handleReveal` is read through a ref so re-renders do not restart the
    countdown — depending on the function itself would reset the five seconds on
    every parent render and it might never fire.
  */
  const revealRef = useRef(handleReveal)
  revealRef.current = handleReveal

  useEffect(() => {
    if (!isRevealCard || opened || !spotlight) return
    const t = window.setTimeout(() => revealRef.current(), AUTO_REVEAL_MS)
    return () => window.clearTimeout(t)
  }, [isRevealCard, opened, spotlight])

  return (
    <motion.li
      ref={ref}
      variants={staggerItem}
      whileHover={lift ? { y: -5 } : undefined}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className={cn(
        'group relative flex flex-col p-8 transition-colors duration-500 sm:p-9',
        /* Only the reveal card clips: the corner decorations are anchored to
           the card edges and would otherwise bleed into its neighbours through
           the grid's 1px gaps. Left off the other six so nothing about their
           rendering changes. */
        isRevealCard && 'overflow-hidden',
        standalone &&
          /* No shadow utility here — the glow is per-card and lives in the
             inline style below, which would otherwise fight this class. */
          'overflow-hidden rounded-3xl ring-1 ring-smaya-charcoal/10',
        /*
          ONE LOCKED HEIGHT FOR ALL SEVEN, AND 640 IS A MEASURED NUMBER.

          Left to themselves the cards ran 455-624px at a 416px slide and
          426-614px at 323px — a 169px spread, which is what made the carousel
          lurch as it moved. The height is driven by each card's own reserves
          (a share of WIDTH, so they shrink on a phone) plus however many lines
          its copy wraps to (which grows on a phone), so the two effects partly
          cancel and one value serves every breakpoint.

          640 clears the tallest card, Sangeeth at 624, by 16px. It is NOT
          arbitrary and it is NOT free: anything that lengthens a card's copy or
          deepens its top decoration pushes past it and gets clipped. Re-measure
          before changing either.

          `w-full` rather than a fixed width: every slide in the carousel
          already carries identical width classes, so the width is uniform by
          construction — pinning a second value here would only let the two
          disagree, and the carousel measures the SLIDE to place its neighbours.
        */
        /*
          COMPACT ENOUGH TO SIT IN A VIEWPORT. 640 was tall enough that the card
          ran off a laptop screen once the section's own heading and padding
          were counted. The three bands above are shares of THIS number, so the
          card can no longer be pushed past it by its own contents.
        */
        standalone && 'h-[400px] w-full flex-shrink-0 md:h-[430px]',
        /*
          THE OPENED CARD'S GROUND MATCHES THE ARTWORK'S OWN — see the inline
          style below, which is where the colour actually comes from.

          None of these decorations has an alpha channel, so any mismatch shows
          as a hard rectangle edge around each one. The default cream is
          sampled from the first five cards' assets; Seemantha's are drawn on
          pure white and set `ground` to say so. Not a brand token: it is copied
          from the artwork and has to change when the artwork does.
        */
        !isRevealCard && 'bg-white',
      )}
      /*
        Reserves the bottom band for the corner art, replacing the card's own
        bottom padding.

        AN INLINE STYLE, not a Tailwind class, for two reasons. The value is
        per-card data and Tailwind cannot generate a class it never sees in
        source. And an inline style beats `sm:p-9` outright — an arbitrary
        `pb-[46%]` did not, because a media-query rule is emitted after the base
        utilities at equal specificity, so the padding silently stayed 36px
        above 640px and the figures rode up over the paragraph.

        A PERCENTAGE because the corner art is width-driven too, so the two
        scale together. It must stay >= the tallest corner's widthPct / aspect.
      */
      style={
        rv
          ? {
              /*
                UNOPENED: a warm four-stop wash. OPENED: the flat ground the
                artwork sits on.

                The closed card was plain #ffffff, which read as an empty box
                around a small 16:9 image — a 16:9 picture in a portrait card
                always leaves space above and below it, so that space has to be
                worth looking at rather than blank. The stops run cream ->
                blush -> a hint of the brand plum -> cream, all at very low
                saturation: enough to feel lit, not enough to compete with the
                artwork sitting on it.

                It has to be cleared explicitly on reveal — `backgroundImage`
                paints OVER `backgroundColor`, so leaving it set would tint the
                cream the decorations are matched to and put their edges back.
              */
              ...(revealed
                ? {
                    backgroundColor: rv.ground ?? '#f8f5ee',
                    backgroundImage: 'none',
                  }
                : {
                    backgroundColor: '#fdf9f3',
                    backgroundImage:
                      rv.gradient ??
                      'linear-gradient(135deg, #FDE68A 0%, #FECDD3 52%, #FDBA74 100%)',
                  }),
              /*
                A COLOURED glow, tinted to the card's own palette, over the
                neutral depth shadow. The neutral one stays underneath — colour
                alone reads as a smudge without a dark shadow giving it an edge.
                On reveal the glow drops away: the opened card is a scene with
                its own ground, and a saturated halo around it fought the
                artwork.
              */
              ...(standalone
                ? {
                    boxShadow: revealed
                      ? '0 18px 50px -20px rgba(28,27,31,0.35)'
                      : `0 18px 50px -20px rgba(28,27,31,0.35), 0 14px 44px -6px ${rv.glow ?? 'rgba(251,191,36,0.34)'}`,
                  }
                : null),
            }
          : undefined
      }
    >
      {/* ------------------------ Festive decoration ------------------------
          Only after the card is opened, and only on the reveal card.

          Rendered conditionally rather than kept at opacity 0, so a visitor who
          never opens the card never downloads three extra images.

          `pointer-events-none` throughout — these sit under the copy and must
          never intercept a click or a text selection. */}
      {isRevealCard && revealed && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          /*
            z-20, NOT z-0 — this is the overlap fix.

            The card paints three of its own full-bleed layers after this one in
            DOM order: the charcoal/[0.02] dimension gradient, the hover wash,
            and the top hairline. All three are z-auto, and `z-0` puts this
            block on the SAME stacking level, so DOM order decided the winner
            and the card's washes were painting straight over the garland and
            both families. A positive z lifts the artwork clear of them while
            still sitting under the copy at z-30.
          */
          /* Radius MUST match the card's own. This layer clips the decorations
             to the card's shape, so a smaller radius here would let the corner
             art square off inside the card's rounded corners. */
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-3xl"
        >
          {/*
            Top band. It DISSOLVES rather than stops: both sources are ~2.2-2.7:1
            going into a ~4:1 strip, so cover shows only their upper half and a
            hard bottom edge sliced the garland mid-motif — straight through the
            hanging strands. No strip height lands on a natural gap because the
            strands are continuous, so the bottom is masked to transparency
            instead. The decoration now fades into the card's ground.
          */}
          {rv?.decorTop && (
            <div
              /*
                The box takes the art's own ratio, then `max-h` clamps it to the
                decoration band. Because the clamp only ever makes the box
                SHORTER than its natural ratio, `object-cover` crops it
                vertically — trimming the bottom, which the fade mask is already
                dissolving — and never horizontally, so the side drapes survive.
                A taller box would have cropped inwards and cut them off.
              */
              /*
                `left-0 w-full`, NOT `inset-x-0`.

                With left AND right pinned, `aspect-ratio` treats neither axis
                as definite, so when `max-h` clamped the height the box shrank
                its WIDTH to preserve the ratio — measured, Sangeeth's garland
                came in 58px narrower than the card and pulled away from both
                edges. An explicit `w-full` makes the width definite, so the
                ratio only ever computes the height and the clamp crops
                vertically instead of narrowing the decoration.
              */
              /* The literal here IS the clamp — Tailwind cannot read
                 DECOR_MAX_H_PCT, so the two must be kept in step by hand. */
              className="absolute left-0 top-0 w-full max-h-[30%] [mask-image:linear-gradient(to_bottom,#000_62%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_62%,transparent_100%)]"
              style={{ aspectRatio: rv.decorTop.aspect }}
            >
              <Image
                src={rv.decorTop.src}
                alt=""
                fill
                sizes="(min-width: 640px) 420px, 100vw"
                className="object-cover object-top"
              />
            </div>
          )}

          {/*
            Corner art, SIZED BY PERCENTAGE WIDTH.

            Fixed heights give fixed widths while everything around them is a
            percentage, so the boxes drift as the card narrows — measured, an
            earlier fixed-height pass overlapped the copy by 13px on a ~330px
            `lg` card while clearing comfortably at 389px.

            MATCHING BOX HEIGHTS IS NOT MATCHING THE PEOPLE. On the Weddings
            card both boxes were identical in height and the groom's family
            still read smaller — correctly: measured against a
            background-difference mask the figures filled 90.3% of his frame
            against 96.9% of hers, so his group rendered ~7% shorter and floated
            off the floor. The dead space was baked into the crop, and the asset
            was re-cropped rather than the box inflated. When two of these look
            mismatched, measure the SUBJECT inside each frame before touching
            the box.
          */}
          {rv?.cornerLeft && (
            <div
              className={cn(
                'absolute bottom-0 left-0',
                rv.cornerLeft.framed &&
                  'overflow-hidden rounded-lg ring-1 ring-smaya-charcoal/10',
              )}
              /*
                HEIGHT-DRIVEN, width from the aspect ratio.

                Both pieces get the same height, so they render at one scale
                without anyone tuning a pair of widths — which is what four
                earlier turns spent doing, because equal WIDTHS give unequal
                heights whenever the two crops are different shapes.
              */
              style={{
                height: `${CORNER_H_PCT}%`,
                aspectRatio: rv.cornerLeft.aspect,
              }}
            >
              <Image
                src={rv.cornerLeft.src}
                alt=""
                fill
                sizes="(min-width: 640px) 140px, 110px"
                className={cn(
                  rv.cornerLeft.framed
                    ? /* The box already carries the art's own ratio, so cover
                         fills it exactly and the frame hugs the picture. */
                      'object-cover'
                    : 'object-contain object-left-bottom',
                )}
              />
            </div>
          )}

          {rv?.cornerRight && (
            <div
              className={cn(
                'absolute bottom-0 right-0',
                rv.cornerRight.framed &&
                  'overflow-hidden rounded-lg ring-1 ring-smaya-charcoal/10',
              )}
              style={{
                height: `${CORNER_H_PCT}%`,
                aspectRatio: rv.cornerRight.aspect,
              }}
            >
              <Image
                src={rv.cornerRight.src}
                alt=""
                fill
                sizes="(min-width: 640px) 190px, 150px"
                className={cn(
                  rv.cornerRight.framed
                    ? 'object-cover'
                    : 'object-contain object-right-bottom',
                )}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Dimension: a barely-there vertical gradient so the card is not a flat
          rectangle, deepening into brand colour on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-smaya-charcoal/[0.02] to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(to top, ${alpha(
            coral ? 'coral' : 'gold',
            0.12,
          )} 0%, ${alpha('plum', 0.04)} 45%, ${alpha('gold', 0)} 75%)`,
        }}
      />

      {/* Hairline that draws across the top edge on hover. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100',
          coral ? 'bg-smaya-coral' : 'bg-smaya-gold',
        )}
      />

      {/*
        THE HEADER IS OPTIONAL, PER CARD.

        Weddings drops it entirely (`header` unset): that reclaims ~84px of
        vertical space — 56px chip plus its 28px margin — which is what pays for
        the larger family figures without the card growing to match. Engagements
        keeps it, because its artwork flies into the chip and becomes the
        thumbnail.

        z-40, above the decorations at z-20 and the copy at z-30, so the chip
        and the ordinal always sit clear of the top decoration.
      */}
      {/*
        An ordinal-only header is ABSOLUTE, not part of the flex column.

        In flow it would sit below the card's top padding, and on a card whose
        decoration is `full` that padding is reserving the whole garland — so
        the number would land under the drapes instead of in the corner. Pinned
        to the top-right at z-40 it stays above the decoration (z-20) and the
        copy (z-30), which is where the brief wants it. The frosted pill is not
        decoration: 11px charcoal over balloons is unreadable whichever element
        is in front.
      */}
      {rv?.header === 'ordinal' && (
        <motion.span
          aria-hidden
          variants={REVEAL}
          initial="hidden"
          animate={shownAt}
          transition={revealAt(0.06)}
          className="absolute right-8 top-8 z-40 rounded-full bg-white/75 px-2 py-1 font-mono text-[11px] leading-none tabular-nums text-smaya-charcoal/70 backdrop-blur-sm sm:right-9 sm:top-9"
        >
          {String(index + 1).padStart(2, '0')}
        </motion.span>
      )}

      {(!isRevealCard || rv?.header === 'full') && (
      <motion.div
        variants={REVEAL}
        initial={isRevealCard ? 'hidden' : false}
        animate={shownAt}
        transition={revealAt(0.06)}
        className="relative z-40 flex items-start justify-between gap-4"
      >
        {/*
          Icon chip. Gold-on-white measured only 2.1:1 — too weak for a
          meaningful glyph and visually washed out. The stroke is now plum
          (8.8:1 on the chip) and only warms to gold on hover, once the chip
          itself has darkened behind it.
        */}
        <span
          className={cn(
            'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
            'transition-colors duration-500',
            /* Once the artwork lands here the chip is just a frame: the piece
               is an opaque illustration, so the accent tint would only show as
               a rim around it. */
            flies && revealed
              ? 'overflow-hidden ring-1 ring-smaya-charcoal/10'
              : coral
                ? 'bg-smaya-coral/10 text-smaya-plum group-hover:bg-smaya-plum group-hover:text-smaya-gold'
                : 'bg-smaya-gold/12 text-smaya-plum group-hover:bg-smaya-plum group-hover:text-smaya-gold',
          )}
        >
          {flies && revealed ? (
            /* The same `layoutId` as the centred artwork. Framer FLIPs between
               the two boxes, so the piece travels from the middle of the card
               into this chip without either position being hardcoded. */
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 block"
              transition={{ type: 'spring', stiffness: 180, damping: 26 }}
            >
              {/* `object-cover` on a portrait source in a square chip crops the
                  decorative border away and keeps the couple, which is the only
                  part legible at 56px. */}
              <Image
                src={rv!.art}
                alt=""
                fill
                sizes="56px"
                className="object-cover object-center"
              />
            </motion.span>
          ) : (
            <span
              className="icon-draw inline-flex transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
              data-drawn={drawn || undefined}
            >
              {ArtIcon ? (
                <ArtIcon size={28} />
              ) : (
                <LucideIcon size={26} aria-hidden />
              )}
            </span>
          )}
        </span>

        {/*
          Decorative ordinal. `aria-hidden` stops it being announced as content,
          but it is still visible text, so WCAG 1.4.3 still applies — aria-hidden
          is not a contrast exemption. At /45 it measured 3.35:1 and failed;
          /60 clears 4.5:1 while the 11px mono size keeps it visually secondary.

          Over a floral decoration, z-order alone does not make 11px charcoal
          legible — it only decides which unreadable thing is in front. It gets
          its own frosted pill once the card is open.
        */}
        <span
          aria-hidden
          className={cn(
            'font-mono text-[11px] tabular-nums text-smaya-charcoal/60 transition-colors duration-500 group-hover:text-smaya-plum',
            isRevealCard &&
              revealed &&
              'rounded-full bg-white/75 px-2 py-1 leading-none backdrop-blur-sm',
          )}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </motion.div>
      )}

      {/*
        Title and copy stay MOUNTED at opacity 0 rather than being unmounted
        until the click. Two reasons: the words remain in the served HTML for
        crawlers, and the card keeps its full height from first paint — which is
        what stops the grid resnapping when this card opens. `aria-hidden`
        mirrors the visual state so a screen reader is not offered text nobody
        can see.
      */}
      {(() => {
        const textNodes = (
          <>
            <motion.h3
              ref={headingRef}
              tabIndex={isRevealCard ? -1 : undefined}
              aria-hidden={!revealed}
              variants={REVEAL}
              initial={isRevealCard ? 'hidden' : false}
              animate={shownAt}
              transition={revealAt(0.18)}
              className={cn(
                'relative outline-none transition-colors duration-500',
                isRevealCard
                  ? /* Playfair, not the brand `font-serif` — that token is
                       Outfit, a geometric SANS, which gives a wedding title
                       none of the warmth a real serif does. */
                    'font-display text-[1.375rem] font-semibold italic leading-[1.15] text-smaya-plum sm:text-[1.75rem] md:text-[2rem]'
                  : 'mt-7 font-serif text-[1.375rem] font-medium leading-[1.25] tracking-[-0.01em] text-smaya-charcoal group-hover:text-smaya-plum sm:text-2xl',
              )}
            >
              {isRevealCard ? (
                <span className="relative inline-block">
                  {/*
                    Marker highlight, behind the glyphs rather than over them —
                    a wash on top would mute the very ink it is meant to lift.
                    Sized in `em` so it tracks the type at both breakpoints
                    instead of needing a second set of pixel values.
                  */}
                  <span
                    aria-hidden
                    className="absolute inset-x-[-0.22em] bottom-[0.08em] h-[0.42em] -rotate-1 rounded-sm bg-smaya-gold/40"
                  />
                  <span className="relative">{service.title}</span>
                </span>
              ) : (
                service.title
              )}
            </motion.h3>

            <motion.p
              aria-hidden={!revealed}
              variants={REVEAL}
              initial={isRevealCard ? 'hidden' : false}
              animate={shownAt}
              transition={revealAt(0.3)}
              className={cn(
                'relative mt-2 sm:mt-3',
                isRevealCard
                  ? /*
                      Smaller and tighter on a small card, and that is a fit
                      requirement rather than taste. The copy band is a fixed
                      41% of the card's height, but a 320px card wraps the same
                      paragraph to five lines instead of four — measured, the
                      panel wanted 230px inside a 184px band and pushed down
                      into the corner art. Stepping the type down at the narrow
                      end is what closes that gap without a taller card.

                      Also a notch darker and heavier than the other six: on
                      cream, under a garland, /70 light read as washed out.
                    */
                    'text-[0.8125rem] font-normal leading-[1.5] text-smaya-charcoal/85 sm:text-[0.875rem] sm:leading-[1.6]'
                  : 'flex-grow text-[0.9375rem] font-light leading-[1.7] text-smaya-charcoal/70',
              )}
            >
              {service.longDesc ?? service.desc}
            </motion.p>
          </>
        )

        if (!isRevealCard) return textNodes

        /*
          ONE GROUND FOR THE COPY ON ALL SEVEN — a frosted panel at PANEL_PCT,
          always centred.

          This replaces a split that had drifted: a panel at 70% pinned left on
          one card, 55% centred on four, and no panel at all on Weddings, which
          ran full width over a soft radial wash. That is what made the set look
          like different templates. There is no longer a per-card option to set.

          `flex flex-1 items-center` CENTRES THE COPY IN THE BAND, and that is
          load-bearing rather than decorative. The card is a locked 640px while
          its decoration and corner reserves are shares of WIDTH, so the leftover
          middle is a different size on every card and at every breakpoint.
          Centring lets the copy sit correctly in all of them without a single
          hand-set margin.

          `mt-7` once the decoration is `full`, because the card's own top
          padding has already reserved the whole garland; `mt-16` only on a card
          whose decoration is a cropped strip with nothing reserved for it.
        */
        return (
          <div
            /*
              ABSOLUTE, in the band between the two reserves — the copy is no
              longer in the card's flow at all.

              In flow it was the card's height: a long paragraph pushed the box
              taller and no `h-` could hold it. Pinned to top/bottom percentages
              of a fixed-height card it simply cannot, and `items-center` keeps
              it optically centred in whatever the band works out to at each
              breakpoint.
            */
            className="absolute inset-x-0 z-30 flex items-center px-6"
            style={{
              top: `${COPY_TOP_PCT}%`,
              bottom: `${COPY_BOTTOM_PCT}%`,
            }}
          >
            <div
              className="relative z-30 mx-auto w-full"
              style={{ width: `${PANEL_PCT}%` }}
            >
              {revealed && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="pointer-events-none absolute -inset-x-4 -inset-y-4 z-0 rounded-xl bg-white/60 shadow-[0_1px_24px_rgba(28,27,31,0.06)] ring-1 ring-white/70 backdrop-blur-md"
                />
              )}
              <div className="relative z-10">{textNodes}</div>
            </div>
          </div>
        )
      })()}

      {/*
        The unopened state: the artwork centred over the whole card.

        WRAPPED IN <AnimatePresence> ONLY WHEN IT DOES NOT FLY.

        The two are mutually exclusive. An exiting element holds its `layoutId`
        until the exit finishes, so on a card whose artwork flies into the chip
        both copies would claim the same id at once and framer would animate
        from the wrong one. Cards with a header therefore mount and unmount
        plainly and let the shared layout carry the motion; cards without one
        have nothing to fly to, so they get a fade-and-shrink exit instead.

        THE STACK, bottom to top: decorations z-20, copy z-30, header z-40,
        artwork z-50. The artwork is above everything, but only while it
        exists — for the flying card that is until the FLIP completes, and for
        the fading one until its 0.45s exit ends.
      */}
      <ConditionalPresence enabled={!flies}>
        {isRevealCard && !opened && (
        <motion.div
          key="reveal-art"
          exit={flies ? undefined : { opacity: 0, scale: 0.86 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          /* `p-6` so the 16:9 artwork keeps a margin off the card's edges now
             that the card is a locked 640px and the image no longer fills it.
             The artwork carries its own aspect ratio, so the extra vertical
             room centres it rather than stretching it. */
          className="absolute inset-0 z-50 grid place-items-center p-4"
        >
          <button
            ref={silhouetteRef}
            type="button"
            onClick={handleReveal}
            aria-expanded={opened}
            aria-label={`Reveal ${service.title} details`}
            /* The width lives HERE, not on the span inside. The button is a
               grid item under `place-items-center`, so it shrink-wraps to its
               content — a percentage width on its child resolved against zero
               and the artwork collapsed to a 0x0 box.

               No max-width: the artwork fills the card's full inner width.
               It was capped at 17rem inside ~341px of space, which left the
               card looking mostly empty. */
            className="group/rev flex h-full w-full cursor-pointer items-center justify-center"
          >
            {/*
              THE FIT AXIS IS PER-CARD AND IT MATTERS.

              The box takes the artwork's own ratio so the image fills it with
              no dead margin, but which dimension DRIVES that box depends on the
              piece. A landscape one (Weddings, 1.83:1) is bound by the card's
              width. A portrait one (Engagements, 0.89:1) fitted to the width
              would be far taller than the card and spill straight out of it, so
              it is bound by height instead. The unused axis carries a `max-` so
              the other can never overflow either.
            */}
            <motion.span
              layoutId={flies ? layoutId : undefined}
              transition={{ type: 'spring', stiffness: 180, damping: 26 }}
              className={cn(
                'relative block overflow-hidden rounded-xl ring-1 ring-smaya-charcoal/10',
                rv?.artFit === 'height'
                  ? 'h-full max-w-full'
                  : /* 92% rather than the full padded width: it keeps a hair of
                       the gradient visible down both sides so the artwork reads
                       as MOUNTED on the card rather than as the card itself. */
                    'max-h-full w-[92%]',
              )}
              style={{ aspectRatio: rv?.artAspect }}
            >
              {/*
                Hover stays a CSS transform on a child rather than an inline
                framer `scale` — framer measures shared-layout boxes from the
                DOM, and a scale on the measured node lands the artwork
                off-target in the chip.
              */}
              <span className="block h-full w-full transition-[scale,filter] duration-300 ease-out group-hover/rev:scale-[1.05] group-hover/rev:drop-shadow-[0_0_26px_rgba(155,81,224,0.5)] group-focus-visible/rev:scale-[1.05] group-focus-visible/rev:drop-shadow-[0_0_26px_rgba(155,81,224,0.5)]">
                <Image
                  src={rv!.art}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 340px, 90vw"
                  className="object-cover"
                />
              </span>
            </motion.span>
          </button>
        </motion.div>
        )}
      </ConditionalPresence>
    </motion.li>
  )
}
