import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendBufferedResponse } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for library file image requests.
 *
 * Uses httpOnly cookies for auth and token refresh so `<img>` previews keep working.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/items/${id}/file/${fileId}`

  return proxyBackendBufferedResponse(request, cookieStore, backendUrl, {
    logLabel: 'FileProxy',
    errorMessage: 'Failed to fetch file',
    cacheControl: 'public, max-age=31536000, immutable'
  })
}
