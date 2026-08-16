/**
 * Shared `loading.tsx` body.
 *
 * WHAT THIS IS ACTUALLY FOR — because it is easy to overrate.
 *
 * Every route here is statically prerendered (the build reports ○/● for all of
 * them), and `next/link` prefetches static routes on viewport entry, so a
 * warm navigation resolves from the router cache and this never paints. It
 * earns its place in the cases the cache cannot cover: a cold entry, a hard
 * reload, a slow connection, or a link tapped before its prefetch completed.
 * Those are precisely the moments a blank frame reads as a broken app.
 *
 * It is deliberately a NEUTRAL PLATE rather than a per-page wireframe. A
 * skeleton that mimics a layout it then fails to match is worse than one that
 * clearly says "loading" — and every page below has a different shape.
 */
export function RouteSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col gap-6 px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8"
    >
      <div className="h-3 w-28 animate-pulse rounded-full bg-smaya-charcoal/10" />
      <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-smaya-charcoal/10 sm:h-14" />
      <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-smaya-charcoal/[0.07]" />

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-2xl bg-smaya-charcoal/[0.06]"
          />
        ))}
      </div>

      <span className="sr-only">Loading</span>
    </div>
  )
}
