import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendDownloadWithCookieRefresh, respondDownloadProxyFailure } from '@/lib/serverDownloadProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for library file downloads
 *
 * This route acts as a proxy to the backend server for file downloads,
 * using the httpOnly access_token cookie for authentication.
 * Refreshes the session when the access token is expired so `<a href>` downloads work.
 *
 * The Content-Disposition header forces the browser to download the file
 * instead of displaying it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/file/${fileId}/download`

    const result = await fetchBackendDownloadWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondDownloadProxyFailure(request, result)
    }

    const { upstream: response, refreshedTokens } = result

    // Get the file data
    const fileBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || 'attachment'

    // Return the file with appropriate headers
    return attachRefreshedSessionCookies(
      new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition,
          'Cache-Control': 'no-cache'
        }
      }),
      refreshedTokens
    )
  } catch (error) {
    console.error('[FileDownload] Error fetching file:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}
