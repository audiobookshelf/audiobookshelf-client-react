import type { MetadataRoute } from 'next'

/**
 * Build the web app manifest with every URL prefixed by the runtime base path.
 *
 * `base` is the Next app base path (empty for root deploys, e.g. '/abs' for a Next subfolder).
 * Kept as a pure function — separate from the route handler's NextResponse wrapper — so the
 * base-path prefixing can be unit-tested without pulling in `next/server`.
 */
export function buildManifest(base: string): MetadataRoute.Manifest {
  return {
    name: 'audiobookshelf',
    short_name: 'audiobookshelf',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    orientation: 'any',
    background_color: '#232323',
    theme_color: '#232323',
    icons: [
      { src: `${base}/images/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: `${base}/images/icon192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}/images/icon512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}/images/icon-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
}
