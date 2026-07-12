import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendStreamingDownload } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for library file downloads.
 *
 * Forwards to the backend with httpOnly cookie auth and token refresh
 * so `<a href>` downloads keep working.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/items/${id}/file/${fileId}/download`

  return proxyBackendStreamingDownload(request, cookieStore, backendUrl, {
    logLabel: 'FileDownload',
    errorMessage: 'Failed to fetch file'
  })
}
