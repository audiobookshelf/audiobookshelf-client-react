import { getServerBaseUrl } from '@/lib/api'
import { proxyMultipartUpload } from '@/lib/proxyMultipartUpload'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for cover uploads.
 *
 * Uses httpOnly cookies for auth and refreshes expired access tokens before
 * piping multipart data to the backend (no full-body buffering in Next.js).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/cover`
    return await proxyMultipartUpload(request, backendUrl, cookieStore, { forwardJsonResponse: true })
  } catch (error) {
    console.error('[CoverUploadProxy] Error uploading cover:', error)
    return NextResponse.json({ error: 'Failed to upload cover' }, { status: 500 })
  }
}
