import { getServerBaseUrl } from '@/lib/api'
import { proxyMultipartUpload } from '@/lib/proxyMultipartUpload'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for backup archive uploads.
 *
 * Uses httpOnly cookies for auth and pipes multipart data to the backend.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/backups/upload`
    return await proxyMultipartUpload(request, backendUrl, cookieStore, { forwardJsonResponse: true })
  } catch (error) {
    console.error('[BackupUploadProxy] Error uploading backup:', error)
    return NextResponse.json({ error: 'Failed to upload backup' }, { status: 500 })
  }
}
