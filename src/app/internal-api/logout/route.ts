import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getServerBaseUrl } from '../../../lib/api'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const authMethod = cookieStore.get('auth_method')?.value
    const openidIdToken = cookieStore.get('openid_id_token')?.value

    const audiobookshelfServerUrl = getServerBaseUrl()

    // Only forward OIDC cookies when this session actually used OpenID (avoids stale auth_method=openid).
    const isOpenIdAuth = authMethod === 'openid' || authMethod === 'openid-mobile'
    const oidcCookies = [
      isOpenIdAuth && authMethod ? `auth_method=${authMethod}` : null,
      isOpenIdAuth && openidIdToken ? `openid_id_token=${openidIdToken}` : null
    ].filter(Boolean)

    // Make logout request to the Audiobookshelf server
    const logoutResponse = await fetch(`${audiobookshelfServerUrl}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass refresh token so the session can be deleted on the Abs server
        ...(refreshToken ? { 'x-refresh-token': refreshToken } : {}),
        ...(oidcCookies.length ? { Cookie: oidcCookies.join('; ') } : {})
      }
    })

    if (!logoutResponse.ok) {
      return NextResponse.json({ error: 'Logout failed' }, { status: 401 })
    }

    const response = NextResponse.json(await logoutResponse.json())
    // Delete token cookies
    response.cookies.delete('refresh_token')
    response.cookies.delete('access_token')
    response.cookies.delete('auth_method')
    response.cookies.delete('openid_id_token')
    // Clear language cookie on logout so it gets re-initialized on next login
    response.cookies.delete('language')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
