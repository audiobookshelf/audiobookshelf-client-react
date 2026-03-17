import { getServerBaseUrl } from '@/lib/api'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for full library item downloads.
 *
 * This forwards requests to the backend `/api/items/:id/download` endpoint
 * and authenticates using the httpOnly `access_token` cookie.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = getServerBaseUrl()
    const backendUrl = `${baseUrl}/api/items/${id}/download`

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

    if (!response.body) {
      return NextResponse.json({ error: 'Backend returned empty download stream' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || 'attachment'
    const contentLength = response.headers.get('content-length')

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('[LibraryItemDownload] Error fetching item download:', error)
    return NextResponse.json({ error: 'Failed to fetch library item download' }, { status: 500 })
  }
}
