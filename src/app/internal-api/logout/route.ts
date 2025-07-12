import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerBaseUrl } from '../../../lib/api'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value

    const audiobookshelfServerUrl = getServerBaseUrl()

    // Make logout request to the Audiobookshelf server
    const logoutResponse = await fetch(`${audiobookshelfServerUrl}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass refresh token so the session can be deleted on the Abs server
        ...(refreshToken ? { 'x-refresh-token': refreshToken } : {})
      }
    })

    if (!logoutResponse.ok) {
      return NextResponse.json({ error: 'Logout failed' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    // Delete token cookies
    response.cookies.delete('refresh_token')
    response.cookies.delete('access_token')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
