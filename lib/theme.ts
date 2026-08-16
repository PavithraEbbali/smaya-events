/**
 * Brand palette as typed TS constants.
 *
 * SCOPE — read before using this.
 *
 * `app/globals.css` (@theme) remains the single source of truth for styling.
 * Tailwind generates `bg-smaya-plum`, `text-smaya-gold` etc. by statically
 * scanning class strings, and 33 files already rely on those utilities. Routing
 * styling through JS constants would defeat that scan, lose the utilities, and
 * duplicate the palette in two places that would inevitably drift.
 *
 * This module exists for the cases Tailwind classes genuinely cannot reach:
 *   - canvas 2D fills (ParticleField, BlackHoleTransition)
 *   - computed gradient strings passed via inline `style`
 *   - anything needing a colour as a runtime *value* rather than a class
 *
 * The hex values here MUST stay in sync with @theme. If you change one, change
 * both — there is a guard test hint at the bottom of this file.
 */

export const palette = {
  /** Primary — deep luxury purple/navy-plum. */
  plum: '#3D1F5C',
  /** Hover states and gradient stops. */
  plumLight: '#5B3480',
  /** Sampled from the supplied logo monogram; deepest surfaces. */
  plumDeep: '#231F36',
  /** Universal accent — CTAs, underlines, dividers. Never changes. */
  gold: '#D4AF37',
  /** Shimmer highlight stop. */
  goldLight: '#F0D584',
  /**
   * Gold TEXT on a light ground. Plain `gold` measures 2.0:1 on ivory and
   * fails even the 3:1 large-text bar; this clears 4.5:1 on ivory and white.
   * Use `gold` on dark grounds and for non-text accents.
   */
  goldDeep: '#887023',
  /** Secondary accent for the "energy" verticals. */
  coral: '#FF6F61',
  /** Base background. */
  ivory: '#FAF9F6',
  /** Dark sections, footer, overlays. */
  charcoal: '#1C1B1F',
} as const

export type PaletteToken = keyof typeof palette
export type HexColor = (typeof palette)[PaletteToken]

/** Pre-parsed RGB triplets, so canvas code never re-parses hex per frame. */
export const rgbTriplet: Readonly<Record<PaletteToken, readonly [number, number, number]>> = {
  plum: [61, 31, 92],
  plumLight: [91, 52, 128],
  plumDeep: [35, 31, 54],
  gold: [212, 175, 55],
  goldLight: [240, 213, 132],
  goldDeep: [136, 112, 35],
  coral: [255, 111, 97],
  ivory: [250, 249, 246],
  charcoal: [28, 27, 31],
}

/**
 * `rgba()` string for a brand colour at a given alpha.
 * `alpha(  'gold', 0.4 )` -> "rgba(212, 175, 55, 0.4)"
 */
export function alpha(token: PaletteToken, a: number): string {
  const [r, g, b] = rgbTriplet[token]
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Radial gradient string, for inline `style` backgrounds. */
export function radialGlow(
  token: PaletteToken,
  opacity: number,
  extent = '65%',
  position = 'circle',
): string {
  return `radial-gradient(${position}, ${alpha(token, opacity)} 0%, ${alpha(token, 0)} ${extent})`
}

/**
 * Gradient pairs from the brand usage rules.
 *   luxury -> plum → gold      energy -> plum → coral
 *   overlay -> charcoal → plum
 */
export const gradientPair = {
  luxury: [palette.plum, palette.gold],
  energy: [palette.plum, palette.coral],
  overlay: [palette.charcoal, palette.plum],
} as const

/**
 * Sync guard. In dev this compares the TS constants against the values the
 * browser actually computed from @theme, so drift is caught at runtime rather
 * than discovered visually months later. No-op on the server and in production.
 */
export function assertThemeInSync(): void {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return

  const styles = getComputedStyle(document.documentElement)
  const cssVar: Record<PaletteToken, string> = {
    plum: '--color-smaya-plum',
    plumLight: '--color-smaya-plum-light',
    plumDeep: '--color-smaya-plum-deep',
    gold: '--color-smaya-gold',
    goldLight: '--color-smaya-gold-light',
    goldDeep: '--color-smaya-gold-deep',
    coral: '--color-smaya-coral',
    ivory: '--color-smaya-ivory',
    charcoal: '--color-smaya-charcoal',
  }

  for (const token of Object.keys(cssVar) as PaletteToken[]) {
    const fromCss = styles.getPropertyValue(cssVar[token]).trim().toLowerCase()
    if (!fromCss) continue
    if (fromCss !== palette[token].toLowerCase()) {
      console.warn(
        `[theme] "${token}" is out of sync — lib/theme.ts has ${palette[token]}, ` +
          `globals.css has ${fromCss}. Update both.`,
      )
    }
  }
}
