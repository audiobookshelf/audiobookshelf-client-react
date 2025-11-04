import { NextRequest, NextResponse } from 'next/server'
import { getServerStatus } from './lib/api'
import { isTokenExpired } from './lib/jwt'
import Logger from './lib/Logger'

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const accessTokenCookie = request.cookies.get('access_token')?.value
  const refreshTokenCookie = request.cookies.get('refresh_token')?.value
  const languageCookie = request.cookies.get('language')?.value
  const themeCookie = request.cookies.get('theme')?.value
  const path = pathname + search

  // Validate JWT tokens - treat expired tokens as non-existent
  // Add 5 second buffer to proactively refresh tokens that are about to expire
  const hasValidAccessToken = !!(accessTokenCookie && !isTokenExpired(accessTokenCookie, 5))
  const hasValidRefreshToken = !!(refreshTokenCookie && !isTokenExpired(refreshTokenCookie, 5))

  Logger.debug('[middleware] handling request for:', path)
  if (accessTokenCookie && !hasValidAccessToken) {
    Logger.debug('[middleware] access token is expired')
  }
  if (refreshTokenCookie && !hasValidRefreshToken) {
    Logger.debug('[middleware] refresh token is expired')
  }

  // Helper to create URLs with correct host/port from request headers.
  // nextUrl/url don't always containt the right host/port,
  // but nextjs populates the x-forwarded-host and x-forwarded-proto headers correctly.
  const createUrl = (path: string) => {
    try {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
      const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
      return new URL(path, `${protocol}://${host}`)
    } catch (error) {
      Logger.error('[middleware] failed to create URL:', { path, error })
      // Fallback: use the current request's URL as base
      return new URL(path, request.nextUrl.origin)
    }
  }

  // Fetch server language if cookie doesn't exist
  let serverLanguage: string | null = null
  if (!languageCookie) {
    try {
      const statusResponse = await getServerStatus()
      if (statusResponse.language) {
        serverLanguage = statusResponse.language
      }
    } catch (error) {
      Logger.error('[middleware] failed to fetch server status for language:', error)
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
    Logger.debug(`[middleware] redirecting to: ${url}`)
    return setLanguageCookie(NextResponse.redirect(url))
  }

  const next = (): NextResponse => {
    Logger.debug(`[middleware] continuing to: ${path}`)
    return setLanguageCookie(NextResponse.next())
  }

  const isLoginRoute = pathname === '/login'
  if (isLoginRoute) {
    if (hasValidAccessToken) {
      Logger.debug('[middleware] request has valid accessToken')
      const libraryUrl = createUrl('/library')
      return redirect(libraryUrl)
    } else if (hasValidRefreshToken) {
      // Has valid refreshToken redirect to refresh
      const refreshUrl = createUrl('/internal-api/refresh')
      Logger.debug('[middleware] request has no valid accessToken but has valid refreshToken')
      return redirect(refreshUrl)
    }

    Logger.debug('[middleware] no valid tokens found')
    return next()
  }

  // Non-login routes
  if (!hasValidAccessToken && !hasValidRefreshToken) {
    // No valid tokens found, redirect to login
    Logger.debug(`[middleware] no valid tokens found`)
    const loginUrl = createUrl('/login')
    return redirect(loginUrl)
  }

  if (!hasValidAccessToken && hasValidRefreshToken) {
    // Redirect to refresh token route with current path
    const refreshUrl = createUrl('/internal-api/refresh')
    if (pathname !== '/') {
      refreshUrl.searchParams.set('redirect', path)
    }
    Logger.debug(`[middleware] valid accessToken not found, valid refreshToken found`)
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
  matcher: ['/((?!api|internal-api|_next/static|_next/image|.*\\.png|.*\\.ico|.*\\.svg|.*\\.json).*)']
}
