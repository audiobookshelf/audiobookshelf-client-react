import { NextRequest, NextResponse } from 'next/server'
import { getServerStatus } from './lib/api'
import Logger from './lib/Logger'

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  const languageCookie = request.cookies.get('language')?.value
  const themeCookie = request.cookies.get('theme')?.value

  Logger.debug('[middleware] handling request for:', pathname)

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
    Logger.debug(`[middleware] continuing to: ${pathname}`)
    return setLanguageCookie(NextResponse.next())
  }

  const isLoginRoute = pathname === '/login'
  if (isLoginRoute) {
    if (accessToken) {
      Logger.debug('[middleware] request has accessToken')
      const libraryUrl = createUrl('/library')
      return redirect(libraryUrl)
    } else if (refreshToken) {
      // Has refreshToken redirect to refresh
      const refreshUrl = createUrl('/internal-api/refresh')
      Logger.debug('[middleware] request has no accessToken but has refreshToken')
      return redirect(refreshUrl)
    }

    Logger.debug('[middleware] no tokens found')
    return next()
  }

  // Non-login routes
  if (!accessToken && !refreshToken) {
    // No tokens found, redirect to login
    Logger.debug(`[middleware] no tokens found`)
    const loginUrl = createUrl('/login')
    return redirect(loginUrl)
  }

  if (!accessToken && refreshToken) {
    // Redirect to refresh token route with current path
    const refreshUrl = createUrl('/internal-api/refresh')
    if (pathname !== '/') {
      refreshUrl.searchParams.set('redirect', pathname)
    }
    Logger.debug(`[middleware] accessToken not found, refreshToken found`)
    return redirect(refreshUrl)
  }

  if (pathname === '/') {
    const libraryUrl = createUrl('/library')
    return redirect(libraryUrl)
  }

  const response = next()
  // Set current path to use for redirects on token refresh
  response.headers.set('x-current-path', pathname)

  return response
}

export const config = {
  matcher: ['/((?!api|internal-api|_next/static|_next/image|.*\\.png|.*\\.ico|.*\\.svg|.*\\.json).*)']
}
