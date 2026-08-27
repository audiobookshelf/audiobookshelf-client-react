import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookies, getServerStatus } from './lib/api'
import { withBasePath } from './lib/basePath'
import { isSessionTokenValid } from './lib/jwt'
import { matchAcceptLanguage } from './lib/languages'
import Logger from './lib/Logger'

/** Next.js App Router sends this on Server Action POSTs */
const NEXT_ACTION_HEADER = 'next-action'

function isNextServerActionRequest(request: NextRequest): boolean {
  return request.method === 'POST' && request.headers.has(NEXT_ACTION_HEADER)
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const accessTokenCookie = request.cookies.get('access_token')?.value
  const refreshTokenCookie = request.cookies.get('refresh_token')?.value
  const languageCookie = request.cookies.get('language')?.value
  const themeCookie = request.cookies.get('theme')?.value
  const path = pathname + search

  const hasValidAccessToken = isSessionTokenValid(accessTokenCookie)
  const hasValidRefreshToken = isSessionTokenValid(refreshTokenCookie)

  Logger.debug('[proxy] handling request for:', path)
  if (accessTokenCookie && !hasValidAccessToken) {
    Logger.debug('[proxy] access token is expired')
  }
  if (refreshTokenCookie && !hasValidRefreshToken) {
    Logger.debug('[proxy] refresh token is expired')
  }

  // Helper to create URLs with correct host/port from request headers.
  // nextUrl/url don't always contain the right host/port,
  // but nextjs populates the x-forwarded-host and x-forwarded-proto headers correctly.
  // Middleware redirects are sent verbatim, so the base path has to be added here.
  const createUrl = (path: string) => {
    const absolutePath = withBasePath(path)
    try {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
      const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
      return new URL(absolutePath, `${protocol}://${host}`)
    } catch (error) {
      Logger.error('[proxy] failed to create URL:', { path, error })
      // Fallback: use the current request's URL as base
      return new URL(absolutePath, request.nextUrl.origin)
    }
  }

  // Fetch server status when language cookie is missing, or when a session cookie may
  // be stale after a fresh DB (server not initialized yet).
  let serverLanguage: string | null = null
  let isServerInitialized: boolean | null = null
  if (!languageCookie || (pathname === '/login' && (hasValidAccessToken || hasValidRefreshToken))) {
    try {
      const statusResponse = await getServerStatus()
      isServerInitialized = !!statusResponse.isInit
      if (isServerInitialized && statusResponse.language) {
        // Initialized server: seed from stored server default
        serverLanguage = statusResponse.language
      } else if (!languageCookie) {
        // Uninitialized / first visit: prefer Accept-Language over en-us default
        serverLanguage = matchAcceptLanguage(request.headers.get('accept-language')) || statusResponse.language || 'en-us'
      }
    } catch (error) {
      Logger.error('[proxy] failed to fetch server status:', error)
      if (!languageCookie) {
        serverLanguage = matchAcceptLanguage(request.headers.get('accept-language')) || 'en-us'
      }
    }
  }

  // Set default theme if cookie doesn't exist
  const shouldSetDefaultTheme = !themeCookie

  // Helper function to set language and theme cookies on any response
  const setLanguageCookie = (response: NextResponse) => {
    if (serverLanguage) {
      response.cookies.set('language', serverLanguage, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60 // 1 year
      })
    }
    if (shouldSetDefaultTheme) {
      response.cookies.set('theme', 'dark', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60 // 1 year
      })
    }
    return response
  }

  const redirect = (url: URL): NextResponse => {
    Logger.debug(`[proxy] redirecting to: ${url}`)
    return setLanguageCookie(NextResponse.redirect(url))
  }

  const next = (): NextResponse => {
    Logger.debug(`[proxy] continuing to: ${path}`)
    return setLanguageCookie(NextResponse.next())
  }

  const isShareRoute = pathname.startsWith('/share/')
  if (isShareRoute) {
    return next()
  }

  const isLoginRoute = pathname === '/login'
  if (isLoginRoute) {
    // After a DB wipe, old JWTs may still pass the expiry check but the server is uninitialized.
    // Clear them so the init form can render instead of bouncing to /library.
    if (isServerInitialized === false) {
      Logger.debug('[proxy] server not initialized; clearing stale session cookies')
      const response = next()
      clearSessionCookies(response)
      return response
    }

    if (hasValidAccessToken) {
      Logger.debug('[proxy] request has valid accessToken')
      const libraryUrl = createUrl('/library')
      return redirect(libraryUrl)
    } else if (hasValidRefreshToken) {
      // Has valid refreshToken redirect to refresh
      const refreshUrl = createUrl('/internal-api/refresh')
      Logger.debug('[proxy] request has no valid accessToken but has valid refreshToken')
      return redirect(refreshUrl)
    }

    Logger.debug('[proxy] no valid tokens found')
    return next()
  }

  // Non-login routes
  if (!hasValidAccessToken && !hasValidRefreshToken) {
    // No valid tokens found, redirect to login
    Logger.debug(`[proxy] no valid tokens found`)
    const loginUrl = createUrl('/login')
    return redirect(loginUrl)
  }

  if (!hasValidAccessToken && hasValidRefreshToken) {
    // Server Actions POST to the page URL. Redirecting to /internal-api/refresh replaces the
    // action response with a 302, so the client never receives the action result. Let the action
    // run and refresh tokens in apiRequest (server-side) instead.
    if (isNextServerActionRequest(request)) {
      Logger.debug('[proxy] server action with expired access token; continuing so apiRequest can refresh')
      const response = next()
      response.headers.set('x-current-path', path)
      return response
    }

    // Redirect to refresh token route with current path
    const refreshUrl = createUrl('/internal-api/refresh')
    if (pathname !== '/') {
      refreshUrl.searchParams.set('redirect', path)
    }
    Logger.debug(`[proxy] valid accessToken not found, valid refreshToken found`)
    return redirect(refreshUrl)
  }

  if (pathname === '/') {
    const libraryUrl = createUrl('/library')
    return redirect(libraryUrl)
  }

  const response = next()
  // Set current path to use for redirects on token refresh
  response.headers.set('x-current-path', path)

  return response
}

export const config = {
  // '/' is listed separately: the catch-all below does not match the origin-root path, which is
  // what the browser hits for both `https://host/` and `https://host/abs/` (Next strips basePath
  // before matching). Without it the home URL 404s instead of redirecting to /library.
  // PWA files (sw.js, manifest.webmanifest) are excluded so they stay publicly fetchable:
  // otherwise the auth redirect would serve a /login HTML page in their place, breaking
  // service-worker registration and install from the login screen.
  matcher: ['/', '/((?!api|internal-api|_next/static|_next/image|sw\\.js|manifest\\.webmanifest|.*\\.png|.*\\.ico|.*\\.svg|.*\\.json).*)']
}
