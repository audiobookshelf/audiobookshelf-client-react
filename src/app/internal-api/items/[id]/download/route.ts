import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendDownloadWithCookieRefresh, respondDownloadProxyFailure } from '@/lib/serverDownloadProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for full library item downloads.
 *
 * This forwards requests to the backend `/api/items/:id/download` endpoint
 * and authenticates using the httpOnly `access_token` cookie.
 * If the access token is expired, refreshes using `refresh_token` and retries
 * so plain `<a href>` downloads keep working.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/download`

    const result = await fetchBackendDownloadWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondDownloadProxyFailure(request, result)
    }

    const { upstream: response, refreshedTokens } = result

    if (!response.body) {
      return attachRefreshedSessionCookies(NextResponse.json({ error: 'Backend returned empty download stream' }, { status: 502 }), refreshedTokens)
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || 'attachment'
    const contentLength = response.headers.get('content-length')

    return attachRefreshedSessionCookies(
      new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition,
          ...(contentLength ? { 'Content-Length': contentLength } : {}),
          'Cache-Control': 'no-cache'
        }
      }),
      refreshedTokens
    )
  } catch (error) {
    console.error('[LibraryItemDownload] Error fetching item download:', error)
    return NextResponse.json({ error: 'Failed to fetch library item download' }, { status: 500 })
  }
}
