import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendDownloadWithCookieRefresh, respondDownloadProxyFailure } from '@/lib/serverDownloadProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for library file image requests
 *
 * This route acts as a proxy to the backend server, using the httpOnly
 * access_token cookie for authentication instead of requiring a token
 * in the URL query parameter.
 *
 * This approach:
 * - Keeps tokens secure (httpOnly cookies, not in URLs)
 * - Refreshes expired access tokens so <img> previews keep working
 * - Works seamlessly with <img> tags (browsers send cookies automatically)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/file/${fileId}`

    const result = await fetchBackendDownloadWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondDownloadProxyFailure(request, result)
    }

    const { upstream: response, refreshedTokens } = result

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    return attachRefreshedSessionCookies(
      new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      }),
      refreshedTokens
    )
  } catch (error) {
    console.error('[FileProxy] Error fetching file:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}
