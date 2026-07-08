import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendStreamingResponse } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for podcast library OPML export.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/libraries/${id}/opml`

  return proxyBackendStreamingResponse(request, cookieStore, backendUrl, {
    logLabel: 'LibraryOpml',
    errorMessage: 'Failed to fetch library OPML',
    emptyBodyError: 'Backend returned empty OPML response',
    defaultContentType: 'application/xml',
    contentDisposition: false
  })
}
