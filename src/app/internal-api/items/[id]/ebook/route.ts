import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendBufferedResponse } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for primary ebook file requests.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/items/${id}/ebook`

  return proxyBackendBufferedResponse(request, cookieStore, backendUrl, {
    logLabel: 'EbookProxy',
    errorMessage: 'Failed to fetch ebook',
    cacheControl: 'private, no-cache'
  })
}
