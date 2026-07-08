import { getServerBaseUrl } from '@/lib/api'
import { proxyMultipartUploadRoute } from '@/lib/proxyMultipartUpload'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for library item uploads.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/upload`

  return proxyMultipartUploadRoute(request, backendUrl, cookieStore, {
    logLabel: 'LibraryItemUploadProxy',
    errorMessage: 'Failed to upload library item'
  })
}
