import { redirectToLogin, refreshSessionWithToken, SessionRefreshResult, SessionRefreshTokens, setTokenCookies } from '@/lib/api'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Logger from './Logger'

export function attachRefreshedSessionCookies(response: NextResponse, refreshedTokens: SessionRefreshTokens | null): NextResponse {
  if (refreshedTokens) {
    setTokenCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken)
  }
  return response
}

export type BackendDownloadFetchResult =
  | {
      ok: true
      upstream: Response
      /** When set, access/refresh changed this request — call setTokenCookies on the NextResponse. */
      refreshedTokens: SessionRefreshTokens | null
    }
  | {
      ok: false
      status: number
      error: string
      refreshedTokens: SessionRefreshTokens | null
    }

/**
 * For browser navigation (`<a href>` downloads), 401 → redirect to login like internal-api/refresh.
 * Clients that send `Accept: application/json` keep a JSON body (e.g. programmatic use).
 */
export function respondDownloadProxyFailure(request: NextRequest, result: Extract<BackendDownloadFetchResult, { ok: false }>): NextResponse {
  if (result.status === 401 && request.headers.get('accept') !== 'application/json') {
    return redirectToLogin(request, 'Session expired')
  }
  return attachRefreshedSessionCookies(NextResponse.json({ error: result.error }, { status: result.status }), result.refreshedTokens)
}

/**
 * GET a backend download URL using cookies, refreshing tokens once if the access token expired.
 */
export async function fetchBackendDownloadWithCookieRefresh(
  backendUrl: string,
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<BackendDownloadFetchResult> {
  const tokens = {
    access: cookieStore.get('access_token')?.value ?? null,
    refresh: cookieStore.get('refresh_token')?.value ?? null
  }
  const initial = { access: tokens.access, refresh: tokens.refresh }
  Logger.debug(`[fetchBackendDownloadWithCookieRefresh] tokens: has access: ${tokens.access !== null}, has refresh: ${tokens.refresh !== null}`)

  const cookiesToSetIfDirty = (): SessionRefreshTokens | null => {
    if (!tokens.access) return null
    if (tokens.access === initial.access && tokens.refresh === initial.refresh) return null
    return { accessToken: tokens.access, refreshToken: tokens.refresh }
  }

  if (!tokens.access && !tokens.refresh) {
    return { ok: false, status: 401, error: 'Unauthorized', refreshedTokens: null }
  }

  const applySession = (session: SessionRefreshResult) => {
    tokens.access = session.accessToken
    if (session.refreshToken) {
      tokens.refresh = session.refreshToken
    }
  }

  if (!tokens.access && tokens.refresh) {
    const session = await refreshSessionWithToken(tokens.refresh)
    Logger.debug(`[fetchBackendDownloadWithCookieRefresh] refreshSessionWithToken: session: ${session !== null}`)
    if (!session) {
      return { ok: false, status: 401, error: 'Unauthorized', refreshedTokens: null }
    }
    applySession(session)
  }

  let upstream = await fetch(backendUrl, {
    headers: { Authorization: `Bearer ${tokens.access!}` }
  })
  Logger.debug(`[fetchBackendDownloadWithCookieRefresh] fetch: upstream: ${upstream.status}`)

  if (upstream.status === 401 && tokens.refresh) {
    const session = await refreshSessionWithToken(tokens.refresh)
    if (session) {
      applySession(session)
      upstream = await fetch(backendUrl, {
        headers: { Authorization: `Bearer ${tokens.access!}` }
      })
    }
  }

  if (upstream.status === 401) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized - token may be expired',
      refreshedTokens: cookiesToSetIfDirty()
    }
  }

  if (!upstream.ok) {
    return {
      ok: false,
      status: upstream.status,
      error: `Backend error: ${upstream.statusText}`,
      refreshedTokens: cookiesToSetIfDirty()
    }
  }

  return { ok: true, upstream, refreshedTokens: cookiesToSetIfDirty() }
}
