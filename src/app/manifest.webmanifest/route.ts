import { getBasePath } from '@/lib/basePath'
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
 * Prefixing lives in buildManifest() so it can be tested (cypress/tests/lib/buildManifest.cy.ts).
 */
export const dynamic = 'force-dynamic'

export function GET() {
  const base = getBasePath()

  return NextResponse.json(buildManifest(base), {
    headers: { 'Content-Type': 'application/manifest+json' }
  })
}
