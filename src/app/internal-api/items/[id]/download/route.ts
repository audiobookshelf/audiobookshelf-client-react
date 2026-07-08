import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendStreamingDownload } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for full library item downloads.
 *
 * Forwards to `/api/items/:id/download` with httpOnly cookie auth and token refresh
 * so plain `<a href>` downloads keep working.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/items/${id}/download`

  return proxyBackendStreamingDownload(request, cookieStore, backendUrl, {
    logLabel: 'LibraryItemDownload',
    errorMessage: 'Failed to fetch library item download'
  })
}
