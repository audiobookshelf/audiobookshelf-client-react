import { getServerBaseUrl } from '@/lib/api'
import { proxyMultipartUpload } from '@/lib/proxyMultipartUpload'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for library item uploads.
 *
 * Uses httpOnly cookies for auth and pipes multipart data to the backend.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/upload`
    return await proxyMultipartUpload(request, backendUrl, cookieStore)
  } catch (error) {
    console.error('[LibraryItemUploadProxy] Error uploading library item:', error)
    return NextResponse.json({ error: 'Failed to upload library item' }, { status: 500 })
  }
}
