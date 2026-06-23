import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendWithCookieRefresh } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for cover uploads.
 *
 * Uses httpOnly cookies for auth and refreshes expired access tokens before
 * forwarding multipart data to the backend.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  try {
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const body = await request.arrayBuffer()
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/cover`

    const result = await fetchBackendWithCookieRefresh(backendUrl, cookieStore, {
      method: 'POST',
      body,
      headers: { 'Content-Type': contentType }
    })

    if (!result.ok) {
      return attachRefreshedSessionCookies(NextResponse.json({ error: result.error }, { status: result.status }), result.refreshedTokens)
    }

    const data = await result.upstream.json()
    return attachRefreshedSessionCookies(NextResponse.json(data), result.refreshedTokens)
  } catch (error) {
    console.error('[CoverUploadProxy] Error uploading cover:', error)
    return NextResponse.json({ error: 'Failed to upload cover' }, { status: 500 })
  }
}
