import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendWithCookieRefresh, respondProxyFailure } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for backup file downloads
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/backups/${id}/download`

    const result = await fetchBackendWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondProxyFailure(request, result)
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
    console.error('[BackupDownload] Error fetching backup download:', error)
    return NextResponse.json({ error: 'Failed to fetch backup download' }, { status: 500 })
  }
}
