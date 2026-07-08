import { getServerBaseUrl } from '@/lib/api'
import { proxyMultipartUploadRoute } from '@/lib/proxyMultipartUpload'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Proxy endpoint for cover uploads.
 *
 * Uses httpOnly cookies for auth and pipes multipart data to the backend.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/items/${id}/cover`

  return proxyMultipartUploadRoute(request, backendUrl, cookieStore, {
    forwardJsonResponse: true,
    logLabel: 'CoverUploadProxy',
    errorMessage: 'Failed to upload cover'
  })
}
