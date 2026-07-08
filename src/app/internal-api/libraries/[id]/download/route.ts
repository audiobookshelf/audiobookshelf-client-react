import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendStreamingDownload } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for multi-item library downloads (zip).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ids = request.nextUrl.searchParams.get('ids')

  if (!ids) {
    return NextResponse.json({ error: 'Missing ids query parameter' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/libraries/${id}/download?ids=${encodeURIComponent(ids)}`

  return proxyBackendStreamingDownload(request, cookieStore, backendUrl, {
    logLabel: 'LibraryItemsDownload',
    errorMessage: 'Failed to fetch library items download'
  })
}
