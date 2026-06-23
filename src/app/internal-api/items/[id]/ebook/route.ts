import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendWithCookieRefresh, respondProxyFailure } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for primary ebook file requests
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/ebook`

    const result = await fetchBackendWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondProxyFailure(request, result)
    }

    const { upstream: response, refreshedTokens } = result
    const fileBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    return attachRefreshedSessionCookies(
      new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, no-cache'
        }
      }),
      refreshedTokens
    )
  } catch (error) {
    console.error('[EbookProxy] Error fetching ebook:', error)
    return NextResponse.json({ error: 'Failed to fetch ebook' }, { status: 500 })
  }
}
