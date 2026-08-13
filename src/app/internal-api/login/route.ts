import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerBaseUrl, setLanguageCookie, setTokenCookies } from '../../../lib/api'
import { getTypeSafeTranslations } from '../../../lib/getTypeSafeTranslations'
import { isSupportedLanguageCode } from '../../../lib/languages'
import { isUserAdminOrUp } from '../../../lib/userPermissions'
import { UpdateServerSettingsResponse, UserLoginWithTokensResponse } from '../../../types/api'

/**
 * After init, the language cookie reflects the admin's choice but the DB default is still en-us.
 * Persist via PATCH /api/settings on first login (no /init server change required).
 */
async function syncServerLanguageFromCookie(
  audiobookshelfServerUrl: string,
  accessToken: string,
  data: UserLoginWithTokensResponse
): Promise<string | undefined> {
  const languageCookie = (await cookies()).get('language')?.value
  const serverLanguage = data.serverSettings?.language

  if (!languageCookie || !isSupportedLanguageCode(languageCookie) || languageCookie === serverLanguage || !isUserAdminOrUp(data.user?.type ?? 'user')) {
    return serverLanguage
  }

  const patchResponse = await fetch(`${audiobookshelfServerUrl}/api/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ language: languageCookie })
  })

  if (!patchResponse.ok) {
    console.error('Failed to sync server language from cookie:', patchResponse.status, patchResponse.statusText)
    return languageCookie
  }

  const patchData: UpdateServerSettingsResponse = await patchResponse.json()
  if (patchData.serverSettings) {
    data.serverSettings = patchData.serverSettings
  }

  return patchData.serverSettings?.language ?? languageCookie
}

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

    const data: UserLoginWithTokensResponse = await loginResponse.json()
    const newAccessToken = data.user.accessToken
    const newRefreshToken = data.user.refreshToken

    if (!newAccessToken) {
      return NextResponse.json({ error: t('ErrorNoAccessTokenFound') }, { status: 401 })
    }

    const effectiveLanguage = await syncServerLanguageFromCookie(audiobookshelfServerUrl, newAccessToken, data)

    const response = NextResponse.json(data)
    setTokenCookies(response, newAccessToken, newRefreshToken ?? null)
    setLanguageCookie(response.cookies, effectiveLanguage)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: t('ErrorInternalServerError') }, { status: 500 })
  }
}
