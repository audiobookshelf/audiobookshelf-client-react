import { NextRequest, NextResponse } from 'next/server'

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  const isLoginRoute = pathname === '/login'
  if (isLoginRoute) {
    if (accessToken) {
      // Has accessToken redirect to home
      return NextResponse.redirect(new URL('/', request.nextUrl))
    } else if (refreshToken) {
      // Has refreshToken redirect to refresh
      const refreshUrl = new URL('/internal-api/refresh', request.nextUrl)
      return NextResponse.redirect(refreshUrl)
    }

    return NextResponse.next()
  }

  if (!accessToken && !refreshToken) {
    // No tokens found, redirect to login
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (!accessToken && refreshToken) {
    // Redirect to refresh token route with current path
    const refreshUrl = new URL('/internal-api/refresh', request.nextUrl)
    if (pathname !== '/') {
      refreshUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(refreshUrl)
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/library', request.nextUrl))
  }

  const response = NextResponse.next()
  // Set current path to use for redirects on token refresh
  response.headers.set('x-current-path', pathname)

  return response
}

export const config = {
  matcher: ['/((?!api|internal-api|_next/static|_next/image|.*\\.png|.*\\.ico|.*\\.svg|.*\\.json).*)']
}
