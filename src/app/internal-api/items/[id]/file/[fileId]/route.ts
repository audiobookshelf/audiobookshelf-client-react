import { getServerBaseUrl } from '@/lib/api'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for library file image requests
 *
 * This route acts as a proxy to the backend server, using the httpOnly
 * access_token cookie for authentication instead of requiring a token
 * in the URL query parameter.
 *
 * This approach:
 * - Keeps tokens secure (httpOnly cookies, not in URLs)
 * - Handles token expiration automatically (middleware refreshes tokens)
 * - Works seamlessly with <img> tags (browsers send cookies automatically)
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
    const backendUrl = `${baseUrl}/api/items/${id}/file/${fileId}`

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

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('[FileProxy] Error fetching file:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}
