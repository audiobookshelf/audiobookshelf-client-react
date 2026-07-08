import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendBufferedResponse } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for a specific ebook file by inode.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/items/${id}/ebook/${fileId}`

  return proxyBackendBufferedResponse(request, cookieStore, backendUrl, {
    logLabel: 'EbookProxy',
    errorMessage: 'Failed to fetch ebook',
    cacheControl: 'private, no-cache'
  })
}
