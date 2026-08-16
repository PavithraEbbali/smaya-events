import type { Metadata, Viewport } from 'next'
import { Inter, Outfit, Playfair_Display } from 'next/font/google'

import { site } from '@/data/site'
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { PageTransition } from '@/components/layout/PageTransition'
import { SmoothScrollProvider } from '@/components/layout/SmoothScrollProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
})

/**
 * Display serif, used for the Weddings card heading.
 *
 * The project's `font-serif` token is Outfit, which is actually a geometric
 * SANS — fine for section headings, but it gives a wedding title none of the
 * warmth a real serif does. Only three weights and one italic are loaded, so
 * this costs a few KB rather than the whole family.
 */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.positioning}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'event management Bangalore',
    'luxury wedding planner',
    'sangeeth choreography',
    'corporate events',
    'Aqua Zumba',
    'fitness events',
    'trekking',
    'Smaya Events',
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.positioning}`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.positioning}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#3D1F5C',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: site.name,
  description: site.description,
  url: site.url,
  email: site.email,
  telephone: site.phone,
  slogan: site.tagline,
  founder: { '@type': 'Person', name: site.founder },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bengaluru',
    addressCountry: 'IN',
  },
  sameAs: [site.instagram],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${playfair.variable}`}
      // The inline script below stamps `data-motion` onto this element before
      // React hydrates, which React would otherwise flag as a mismatch.
      suppressHydrationWarning
    >
      <head>
        {/*
          Arms the JS-driven reveal states before first paint. Every rule that
          hides content until an observer fires is scoped to [data-motion="on"],
          so if scripting is unavailable the attribute is never set and the page
          renders fully instead of staying invisible. Blocking and inline by
          design — deferring it would cause a flash of revealed content.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.motion="on"`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-smaya-ivory text-smaya-charcoal antialiased">
        <script
          type="application/ld+json"
          // Static, author-controlled payload — no user input reaches this.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-smaya-plum focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <SmoothScrollProvider>
          <Navbar />
          <div id="main-content" className="flex flex-grow flex-col">
            <PageTransition>{children}</PageTransition>
          </div>
          <Footer />
          <FloatingWhatsApp />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
