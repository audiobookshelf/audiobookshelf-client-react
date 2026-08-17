import { buildManifest } from '@/lib/pwa/buildManifest'
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
 * prefix is '' and URLs stay absolute. The base-path prefixing lives in buildManifest() so it can be
 * tested (cypress/tests/lib/buildManifest.cy.ts).
 */
export const dynamic = 'force-dynamic'

export function GET() {
  const base = process.env.ROUTER_BASE_PATH ?? ''

  return NextResponse.json(buildManifest(base), {
    headers: { 'Content-Type': 'application/manifest+json' }
  })
}
