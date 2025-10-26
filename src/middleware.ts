import { NextRequest, NextResponse } from 'next/server'
import { getServerStatus } from './lib/api'

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  const languageCookie = request.cookies.get('language')?.value

  // Fetch server language if cookie doesn't exist
  let serverLanguage: string | null = null
  if (!languageCookie) {
    try {
      const statusResponse = await getServerStatus()
      if (statusResponse.language) {
        serverLanguage = statusResponse.language
      }
    } catch (error) {
      console.error('Failed to fetch server status for language:', error)
    }
  }

  // Helper function to set language cookie on any response
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
    return response
  }

  const isLoginRoute = pathname === '/login'
  if (isLoginRoute) {
    if (accessToken) {
      // Has accessToken redirect to home
      return setLanguageCookie(NextResponse.redirect(new URL('/', request.nextUrl)))
    } else if (refreshToken) {
      // Has refreshToken redirect to refresh
      const refreshUrl = new URL('/internal-api/refresh', request.nextUrl)
      return setLanguageCookie(NextResponse.redirect(refreshUrl))
    }

    return setLanguageCookie(NextResponse.next())
  }

  if (!accessToken && !refreshToken) {
    // No tokens found, redirect to login
    return setLanguageCookie(NextResponse.redirect(new URL('/login', request.nextUrl)))
  }

  if (!accessToken && refreshToken) {
    // Redirect to refresh token route with current path
    const refreshUrl = new URL('/internal-api/refresh', request.nextUrl)
    if (pathname !== '/') {
      refreshUrl.searchParams.set('redirect', pathname)
    }
    return setLanguageCookie(NextResponse.redirect(refreshUrl))
  }

  if (pathname === '/') {
    return setLanguageCookie(NextResponse.redirect(new URL('/library', request.nextUrl)))
  }

  const response = setLanguageCookie(NextResponse.next())
  // Set current path to use for redirects on token refresh
  response.headers.set('x-current-path', pathname)

  return response
}

export const config = {
  matcher: ['/((?!api|internal-api|_next/static|_next/image|.*\\.png|.*\\.ico|.*\\.svg|.*\\.json).*)']
}
