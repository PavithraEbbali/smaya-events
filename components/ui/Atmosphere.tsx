/* -------------------------------------------------------------------------- *
 * Ambient studio lighting for dark sections.
 *
 * Pairs with the `surface-obsidian` utility in globals.css: that sets the
 * canvas, this puts the lamps on it. Kept as one component rather than a
 * gradient pasted into each section, so the warm/cool balance is decided in a
 * single place — five copies drift the moment one of them is nudged.
 *
 * PURE CSS, DELIBERATELY. Ambient texture rendered as an image would be one
 * more network request that can fail, and this project has already had remote
 * artwork turn into blank boxes. A gradient cannot 404.
 * -------------------------------------------------------------------------- */

type Props = {
  /**
   * `fixed` pins the lighting to the viewport so it stays put while content
   * scrolls through it — right for a full-page canvas. `absolute` scopes it to
   * one section, which is what a section with its own ground wants.
   */
  anchor?: 'fixed' | 'absolute'
  /** Dials the whole rig down where artwork already supplies the mood. */
  intensity?: number
  className?: string
}

export function Atmosphere({ anchor = 'absolute', intensity = 1, className = '' }: Props) {
  /*
    Opacity carries the intensity rather than the colour stops.

    Baking it into the rgba values would need five numbers recomputed per call
    site and would silently change the hue balance; a single multiplier on the
    layer keeps warm and cool in the same proportion at every strength.
  */
  return (
    <div
      aria-hidden
      data-atmosphere
      className={`pointer-events-none ${anchor} inset-0 ${className}`}
      style={{
        opacity: intensity,
        background: [
          /* Warm amber, upper left — the key light. */
          'radial-gradient(ellipse 46% 38% at 12% 8%, rgba(197,168,128,0.13) 0%, transparent 62%)',
          /* Cool violet, lower right — the fill, kept weaker so the room reads
             warm overall rather than split down the middle. */
          'radial-gradient(ellipse 44% 36% at 88% 88%, rgba(122,106,149,0.12) 0%, transparent 60%)',
          /* A wide, very faint warm bloom through the centre, so the two lamps
             read as one lit space instead of two unrelated corners. */
          'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(197,168,128,0.04) 0%, transparent 70%)',
        ].join(', '),
      }}
    />
  )
}
