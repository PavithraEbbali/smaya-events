# Smaya Events

Premium multi-page site for Smaya Events — *Creators of Feeling*. Next.js 15
(App Router) + TypeScript + Tailwind v4, with Framer Motion, GSAP/ScrollTrigger/
SplitText and Lenis.

> **Working on this with an AI agent?** Read [`ai.wing`](./ai.wing) first. It
> carries the decision log, the invariants that have already broken once
> (`contracts`), what is genuinely unverified, and where the restore snapshots
> live. This README covers setup; `ai.wing` covers *why*.

Migrated from the Vite + React Router build in `../smaya-events`, consolidated
from 17 routes to 9 and re-skinned onto the plum/gold/coral palette.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## Routes

| Route | Notes |
| --- | --- |
| `/` | Home — video hero, verticals grid, about teaser, portfolio, stats, testimonials, CTA |
| `/about` | About **+ Vision/Mission + core values + impact stats**, merged |
| `/services` | Hub — the five grouped categories, each linking into the verticals |
| `/services/[slug]` | All seven verticals from one template; `generateStaticParams` pre-renders `celebrations`, `corporate`, `fitness`, `adventure`, `entertainment`, `community`, `workshops` |
| `/gallery` | Filterable masonry portfolio |
| `/events` | Upcoming events + `Event` JSON-LD |
| `/testimonials` | Six reviews + `Review` JSON-LD |
| `/blog` | Six post cards |
| `/contact` | Contact **+ Book**, merged behind a Free Consultation / General Inquiry toggle |

`/vision` and `/book` no longer exist. `/book` links resolve to
`/contact?type=consultation`, which pre-selects the consultation tab and its
fuller field set. `/events` "Register Now" deep-links to
`/contact?type=general&event=<name>` and pre-fills the message.

Everything except `/api/contact` is statically pre-rendered.

## Content

All copy and data live in typed modules under `data/` — nothing is inline in a
component.

`data/verticals.ts` is the single source of truth for the seven verticals: it
drives the dynamic route, the Services hub's through-links, the navbar
mega-menu, the mobile accordion, the Home grid and the footer.

Icons are referenced **by name** (`data/*` stores `'Waves'`, not the component)
so the data modules stay serialisable across the server/client boundary.
`lib/icons.ts` is the allow-list — add an icon there before using it in data.

## What still needs real assets

1. **Hero video.** `components/home/Hero.tsx` expects
   `/public/videos/hero-loop.mp4` plus `/public/videos/hero-poster.jpg`. Neither
   is committed. Until they exist the hero renders its poster image, so nothing
   is broken — drop the files in and the video takes over with no code change.
   The poster also covers slow connections and `prefers-reduced-motion`.
2. **Unsplash placeholders.** 18 sites are flagged with
   `// TODO: replace with Google Flow-generated or client-supplied asset`.
   `grep -rn "TODO: replace with Google Flow" data components` lists them.
3. **Founder photograph.** `components/about/AboutContent.tsx` uses a stock
   image for Manasa Raj; the Vite build had a real portrait
   (`src/assets/images/manasa_snow_trek_*.png`) that was not supplied here.

## Email

`/api/contact` validates server-side (`lib/contact-schema.ts`, shared with the
client so the two can't drift) and sends via **Resend**. It needs an API key
supplied by the site owner — copy `.env.example` to `.env.local` and fill in:

```
RESEND_API_KEY=
CONTACT_FROM_EMAIL=      # verified sender on your Resend domain
CONTACT_TO_EMAIL=        # where inquiries land
NEXT_PUBLIC_SITE_URL=    # used for metadataBase, OG tags and the sitemap
```

Without the key the route still validates and returns 200, logging the inquiry
to the server console — local development works without credentials. The form
surfaces both per-field errors and a failure banner.

A hidden `company` honeypot silently accepts and drops bot submissions.

## Logo

`public/logo/smaya logo design.jpeg` is the supplied artwork, untouched.
`smaya-monogram.png` and `smaya-monogram-light.png` are derived from it — a
tight crop with the ivory background keyed out, plus a contrast recolour of the
navy strokes for use on dark surfaces. Regenerate them from the original if the
source art changes.

The monogram's exact navy samples to **#231F36**, noticeably deeper and less
saturated than the brief's `--color-smaya-plum` (`#3D1F5C`). Rather than swap
the primary — which the whole plum→gold / plum→coral gradient system is built
on — the sampled value is exposed as `--color-smaya-plum-deep` and used for the
deepest gradient stops and hero overlays, so the logo always sits in-family.

## Motion

- `lib/gsap.ts` loads GSAP, ScrollTrigger and SplitText **on demand** so they
  stay out of the initial bundle.
- `ParticleField`, `CustomCursor` and `BlackHoleTransition` are
  `next/dynamic` + `ssr: false`.
- Cursor, 3D tilt, magnetic buttons and the particle field gate on
  `matchMedia('(pointer: fine)')` — they never attach listeners on touch.
- The hero's split-door reveal and the black-hole gravity well run **once per
  session** (`sessionStorage`), never on client-side navigation back to Home.

### The no-JS contract

Every rule that hides content until an observer fires is scoped to
`[data-motion="on"]`, an attribute set by a blocking inline script in
`app/layout.tsx`. Without scripting the attribute never appears and the page
renders in full. For the same reason `PageTransition` arms its clip-path wipe
only after the first client render — Framer serialises `initial` into the SSR
markup, and a clipped `<main>` would otherwise ship a blank page.

Keep this in mind when adding a new reveal: scope the hidden state, or the
content disappears for anyone whose JS fails.
