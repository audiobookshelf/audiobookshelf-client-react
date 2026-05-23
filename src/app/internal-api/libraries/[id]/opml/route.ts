import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendDownloadWithCookieRefresh, respondDownloadProxyFailure } from '@/lib/serverDownloadProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for podcast library OPML export
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/libraries/${id}/opml`

    const result = await fetchBackendDownloadWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondDownloadProxyFailure(request, result)
    }

    const { upstream: response, refreshedTokens } = result

    if (!response.body) {
      return attachRefreshedSessionCookies(NextResponse.json({ error: 'Backend returned empty OPML response' }, { status: 502 }), refreshedTokens)
    }

    const contentType = response.headers.get('content-type') || 'application/xml'
    const contentLength = response.headers.get('content-length')

    return attachRefreshedSessionCookies(
      new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          ...(contentLength ? { 'Content-Length': contentLength } : {}),
          'Cache-Control': 'no-cache'
        }
      }),
      refreshedTokens
    )
  } catch (error) {
    console.error('[LibraryOpml] Error fetching library OPML:', error)
    return NextResponse.json({ error: 'Failed to fetch library OPML' }, { status: 500 })
  }
}
