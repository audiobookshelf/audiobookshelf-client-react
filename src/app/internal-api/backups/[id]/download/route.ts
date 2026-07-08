import { getServerBaseUrl } from '@/lib/api'
import { proxyBackendStreamingDownload } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for backup file downloads.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/backups/${id}/download`

  return proxyBackendStreamingDownload(request, cookieStore, backendUrl, {
    logLabel: 'BackupDownload',
    errorMessage: 'Failed to fetch backup download'
  })
}
