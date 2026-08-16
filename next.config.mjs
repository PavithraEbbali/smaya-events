/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // TODO: remove once Unsplash placeholders are swapped for
      // Google Flow-generated or client-supplied assets.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    /*
     * Every `quality` value any <Image> asks for must be listed here.
     *
     * Next 15 only warns about an unlisted value; Next 16 makes the allowlist
     * mandatory, so an unlisted one stops being a log line and starts being a
     * broken image. 75 is the default and is what most of the site uses; 90 is
     * the performances reel, where the photography is the entire design.
     */
    qualities: [75, 90],
  },
}

export default nextConfig
