import type { SVGProps } from 'react'

/**
 * Bespoke line-art icons for the celebration rituals.
 *
 * Drawn rather than pulled from a generic set, so the ritual is actually
 * legible — lucide has no seemantha, no haldi, no sangeeth. All are 24x24,
 * 1.25 stroke, `currentColor`, `fill="none"`: they inherit gold (or any brand
 * colour) from the parent, and the shared `.icon-draw` stroke-dasharray reveal
 * works on them exactly as it does on the lucide glyphs.
 *
 * Plain SVG components, so they tree-shake and inline into the RSC payload —
 * no sprite fetch, no icon-font, no client boundary.
 */

export type CelebrationIconName =
  | 'rings'
  | 'engagement'
  | 'sangeeth'
  | 'haldi'
  | 'birthday'
  | 'babyShower'
  | 'seemantha'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** Two interlocking bands — weddings. */
export function RingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="14.5" r="5.5" />
      <circle cx="15" cy="14.5" r="5.5" />
      <path d="M12 5.2 10.2 8h3.6L12 5.2Z" />
      <path d="M12 5.2V3.4" />
    </Svg>
  )
}

/** Solitaire on a band — engagements. */
export function EngagementIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 6.5h7l2.5 3.2-6 3.1-6-3.1 2.5-3.2Z" />
      <path d="M8.5 6.5 12 12.8l3.5-6.3" />
      <path d="M6 9.7v3.6a6 6 0 0 0 12 0V9.7" />
    </Svg>
  )
}

/** Paired notes over a rhythm line — sangeeth. */
export function SangeethIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 17.5V5.2l10-1.8v12.1" />
      <circle cx="6.6" cy="17.8" r="2.4" />
      <circle cx="16.6" cy="15.9" r="2.4" />
      <path d="M9 8.6l10-1.8" />
    </Svg>
  )
}

/** Turmeric bloom with drop — haldi & mehendi. */
export function HaldiIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 9.4c0-2.3-1-4.1-1-4.1s2 .6 2.6 2M14.6 12c2.3 0 4.1-1 4.1-1s-.6 2-2 2.6M12 14.6c0 2.3 1 4.1 1 4.1s-2-.6-2.6-2M9.4 12c-2.3 0-4.1 1-4.1 1s.6-2 2-2.6" />
      <path d="M16.8 7.2c1.6-1.6 2.9-2 2.9-2s-.4 1.3-2 2.9M7.2 16.8c-1.6 1.6-2.9 2-2.9 2s.4-1.3 2-2.9" />
    </Svg>
  )
}

/** Tiered cake with a single candle — birthdays. */
export function BirthdayIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 20.5v-4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v4Z" />
      <path d="M6.8 14.5v-2.2a1.8 1.8 0 0 1 1.8-1.8h6.8a1.8 1.8 0 0 1 1.8 1.8v2.2" />
      <path d="M12 10.5V8" />
      <path d="M12 5.2c.9.7 1.3 1.3 1.3 1.9a1.3 1.3 0 0 1-2.6 0c0-.6.4-1.2 1.3-1.9Z" />
      <path d="M4.5 17.6c1.7 0 1.7 1.2 3.4 1.2s1.7-1.2 3.4-1.2 1.7 1.2 3.4 1.2 1.7-1.2 3.4-1.2" />
    </Svg>
  )
}

/** Rattle wrapped in a ribbon — baby showers. */
export function BabyShowerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.6" r="4.6" />
      <path d="M12 13.2v4.1" />
      <path d="M9.8 20.6h4.4a2.2 2.2 0 0 0-4.4 0Z" />
      <path d="M9.9 8.2a2.3 2.3 0 0 1 2.1-1.4 2.3 2.3 0 0 1 2.1 1.4" />
    </Svg>
  )
}

/** Lotus over a blessing bowl — seemantha. */
export function SeemanthaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.2c1.6 1.9 2.3 3.6 2.3 5.2 0 1.3-.8 2.3-2.3 2.3s-2.3-1-2.3-2.3c0-1.6.7-3.3 2.3-5.2Z" />
      <path d="M9.7 11.7c-1.9-.9-3.5-1.1-4.9-.7 1 1.9 2.4 3.1 4 3.5M14.3 11.7c1.9-.9 3.5-1.1 4.9-.7-1 1.9-2.4 3.1-4 3.5" />
      <path d="M4.6 16.4h14.8a7.4 7.4 0 0 1-14.8 0Z" />
    </Svg>
  )
}

const REGISTRY = {
  rings: RingsIcon,
  engagement: EngagementIcon,
  sangeeth: SangeethIcon,
  haldi: HaldiIcon,
  birthday: BirthdayIcon,
  babyShower: BabyShowerIcon,
  seemantha: SeemanthaIcon,
} as const satisfies Record<CelebrationIconName, (props: IconProps) => React.ReactElement>

export function getCelebrationIcon(name: CelebrationIconName) {
  return REGISTRY[name]
}

export function isCelebrationIcon(name: string): name is CelebrationIconName {
  return name in REGISTRY
}
