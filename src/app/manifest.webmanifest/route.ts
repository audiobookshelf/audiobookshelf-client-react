import { NextResponse } from 'next/server'

/**
 * Web app manifest, served at `<base>/manifest.webmanifest`.
 *
 * Implemented as a Route Handler rather than the `app/manifest.ts` convention on purpose: that
 * convention makes Next auto-inject a root-relative `<link rel="manifest" href="/manifest.webmanifest">`
 * whose path we cannot prefix, which double-links (and 404s) under a subfolder deploy. The base-path
 * link is emitted manually in the root layout instead; this handler only produces the content.
 *
 * ROUTER_BASE_PATH is a runtime env var (the audiobookshelf server applies the base path; Next has no
 * `basePath` configured), so this is dynamic and every URL is prefixed with it. For root deploys the
 * prefix is '' and URLs stay absolute.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  const base = process.env.ROUTER_BASE_PATH ?? ''

  const manifest = {
    name: 'audiobookshelf',
    short_name: 'audiobookshelf',
    description: 'Self-hosted audiobook and podcast server',
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

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' }
  })
}
