import { NextResponse } from 'next/server'
import { getServerBaseUrl, setTokenCookies } from '../../../lib/api'
import { getTypeSafeTranslations } from '../../../lib/getTypeSafeTranslations'

export async function POST(request: Request) {
  const t = await getTypeSafeTranslations()

  try {
    const { username, password } = await request.json()

    const audiobookshelfServerUrl = getServerBaseUrl()

    // Make login request to the Audiobookshelf server
    const loginResponse = await fetch(`${audiobookshelfServerUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Tells the Abs server to return the refresh token
        'x-return-tokens': 'true'
      },
      body: JSON.stringify({ username, password })
    })

    if (!loginResponse.ok) {
      return NextResponse.json({ error: t('ErrorLoginFailed') }, { status: 401 })
    }

    const data = await loginResponse.json()
    const newAccessToken = data.user.accessToken
    const newRefreshToken = data.user.refreshToken
    const userLanguage = data.serverSettings?.language

    if (!newAccessToken) {
      return NextResponse.json({ error: t('ErrorNoAccessTokenFound') }, { status: 401 })
    }

    const response = NextResponse.json(data)
    setTokenCookies(response, newAccessToken, newRefreshToken)

    // Set language cookie from user's server settings
    if (userLanguage) {
      response.cookies.set('language', userLanguage, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60 // 1 year
      })
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: t('ErrorInternalServerError') }, { status: 500 })
  }
}
