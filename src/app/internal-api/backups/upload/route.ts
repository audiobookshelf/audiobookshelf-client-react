import { getServerBaseUrl } from '@/lib/api'
import { proxyMultipartUploadRoute } from '@/lib/proxyMultipartUpload'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for backup archive uploads.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/backups/upload`

  return proxyMultipartUploadRoute(request, backendUrl, cookieStore, {
    forwardJsonResponse: true,
    logLabel: 'BackupUploadProxy',
    errorMessage: 'Failed to upload backup'
  })
}
