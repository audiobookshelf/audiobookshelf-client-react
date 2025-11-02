import { getServerBaseUrl } from '@/lib/api'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for library file downloads
 *
 * This route acts as a proxy to the backend server for file downloads,
 * using the httpOnly access_token cookie for authentication.
 *
 * The Content-Disposition header forces the browser to download the file
 * instead of displaying it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/file/${fileId}/download`

    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized - token may be expired' }, { status: 401 })
      }
      return NextResponse.json({ error: `Backend error: ${response.statusText}` }, { status: response.status })
    }

    // Get the file data
    const fileBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || 'attachment'

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('[FileDownload] Error fetching file:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}
