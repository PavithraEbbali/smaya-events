/**
 * Celebration burst for the tap-to-reveal service card.
 *
 * THE IMPORT IS DYNAMIC ON PURPOSE. `canvas-confetti` is only ever needed after
 * a deliberate click, so it must not sit in the initial bundle — this page is
 * already carrying three.js and framer, and the mobile Lighthouse target has no
 * room for a decorative library on the critical path.
 *
 * THE CANVAS IS TORN DOWN AFTERWARDS. canvas-confetti appends a fixed,
 * full-viewport <canvas> to <body> and, left alone, keeps it there forever. On
 * this project a stray full-bleed canvas has already been mistaken for a broken
 * background once, so `reset()` runs as soon as the particles finish.
 */

/** Brand palette — deep purple through to gold, plus white for sparkle. */
const COLORS = [
  '#3d1f5c', // plum
  '#5b3480', // plum-light
  '#9b51e0', // violet highlight
  '#d4af37', // gold
  '#f0d584', // gold-light
  '#ffffff',
]

/** How long the particles need before the canvas can be removed. */
const TEARDOWN_MS = 2600

export type ConfettiHandle = { cancel: () => void }

export type ConfettiTheme = {
  /** Overrides the plum/gold default. */
  colors?: string[]
  /**
   * Emoji rendered as particle shapes, e.g. ['🍫', '🎂'].
   *
   * canvas-confetti rasterises each one ONCE via `shapeFromText`, so the cost
   * is a couple of tiny canvases per burst rather than per particle. Emoji
   * carry their own colour, so `colors` stops mattering for the shaped stage —
   * which is why the plain stages still fire alongside it.
   */
  emoji?: string[]
}

/**
 * Fires a two-stage firecracker at a viewport-normalised origin (0–1 on both
 * axes, which is the coordinate space canvas-confetti expects).
 *
 * Returns a handle so a component unmounting mid-burst can cancel the teardown
 * timer rather than leaking it.
 */
export function celebrationBurst(
  origin: { x: number; y: number },
  theme?: ConfettiTheme,
): ConfettiHandle {
  let cancelled = false
  /* An array, not a single id — there are two pending timeouts and keeping one
     variable meant the second assignment orphaned the first. */
  const timers: number[] = []

  void import('canvas-confetti').then(({ default: confetti }) => {
    if (cancelled) return

    const base = {
      origin,
      colors: theme?.colors ?? COLORS,
      /* canvas-confetti reads the OS setting itself, so a reduced-motion
         visitor gets nothing even if the caller forgets to check. */
      disableForReducedMotion: true,
    }

    /*
      Optional emoji particles, rasterised once each rather than per particle.
      Guarded on the function existing: `shapeFromText` arrived in
      canvas-confetti 1.6, and a card configured with emoji on an older copy
      should quietly fall back to the plain burst rather than throw mid-click.
    */
    const shapes =
      theme?.emoji?.length && typeof confetti.shapeFromText === 'function'
        ? theme.emoji.map((text) => confetti.shapeFromText({ text, scalar: 2 }))
        : null

    if (shapes) {
      // A slower, heavier pop of the themed shapes, sized up so they read.
      confetti({
        ...base,
        particleCount: 22,
        spread: 130,
        startVelocity: 32,
        ticks: 200,
        gravity: 0.9,
        scalar: 2,
        flat: true,
        shapes,
      })
    }

    // 1. The crack — a tight, fast, all-directions sphere of sparks.
    confetti({
      ...base,
      particleCount: 44,
      spread: 360,
      startVelocity: 26,
      ticks: 90,
      gravity: 0.6,
      scalar: 0.75,
      shapes: ['star'],
    })

    // 2. The shower — slower, heavier, falls through the card.
    confetti({
      ...base,
      particleCount: 70,
      spread: 110,
      startVelocity: 40,
      decay: 0.9,
      ticks: 160,
      gravity: 1.1,
      scalar: 1,
    })

    // 3. Two late sparkler tails, offset left and right of the origin.
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return
        for (const dx of [-0.04, 0.04]) {
          confetti({
            ...base,
            origin: { x: origin.x + dx, y: origin.y },
            particleCount: 18,
            spread: 70,
            startVelocity: 22,
            ticks: 120,
            scalar: 0.6,
            shapes: ['star'],
          })
        }
      }, 180),
    )

    timers.push(
      window.setTimeout(() => {
        if (!cancelled) confetti.reset()
      }, TEARDOWN_MS),
    )
  })

  return {
    cancel: () => {
      cancelled = true
      timers.forEach((t) => window.clearTimeout(t))
    },
  }
}
