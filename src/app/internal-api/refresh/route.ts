import { getServerBaseUrl, getUserDefaultUrlPath, setTokenCookies } from '@/lib/api'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const rscMap = new Map<string, boolean>()

/**
 * Get the client-facing base URL from request headers.
 * This is needed for redirects since the server's internal URL (localhost)
 * differs from the URL the client used to reach the server.
 */
function getClientBaseUrl(request: Request): string {
  const headers = new Headers(request.headers)
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost'
  const protocol = headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
  return `${protocol}://${host}`
}

export async function GET(request: Request) {
  return handleRefresh(request)
}

export async function POST(request: Request) {
  return handleRefresh(request)
}

async function handleRefresh(request: Request) {
  // Server URL for backend API calls (internal network)
  const audiobookshelfServerUrl = getServerBaseUrl()
  // Client URL for browser redirects (what the user sees)
  const clientBaseUrl = getClientBaseUrl(request)

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      console.log('No refresh token found')
      return NextResponse.json({ error: 'No refresh token found' }, { status: 401 })
    }

    // Handle React Server Components (RSC) retry scenario:
    // When Next.js RSC encounters a redirect during server-side rendering,
    // it automatically retries the original request. This retry includes
    // the _rsc parameter in the URL. Only allow one refresh attempt per rsc id.
    const url = new URL(request.url)
    const rscId = url.searchParams.get('_rsc')
    if (rscId) {
      if (rscMap.has(rscId)) {
        return NextResponse.json({ error: 'Already called refresh' }, { status: 400 })
      } else {
        rscMap.set(rscId, true)
      }
    }

    // Make refresh request to the Audiobookshelf server
    const refreshResponse = await fetch(`${audiobookshelfServerUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Passing the refresh token in header is an alternative to using the Abs server cookie
        'x-refresh-token': refreshToken
      }
    })

    if (!refreshResponse.ok) {
      // Refresh failed, redirect to login page and delete refresh token cookie
      const redirectUrl = new URL('/login', clientBaseUrl)
      redirectUrl.searchParams.set('error', 'Token refresh failed')
      const response = NextResponse.redirect(redirectUrl)
      response.cookies.delete('refresh_token')
      return response
    }

    const data = await refreshResponse.json()
    const newAccessToken = data.user.accessToken
    const newRefreshToken = data.user.refreshToken

    if (!newAccessToken) {
      return NextResponse.json({ error: 'No new access token received' }, { status: 500 })
    }

    // Get redirect URL from query parameters or default to user default path
    const redirectUrlPath = url.searchParams.get('redirect') || getUserDefaultUrlPath(data.userDefaultLibraryId, data.user.type)
    const redirectUrl = new URL(redirectUrlPath, clientBaseUrl)

    const response = NextResponse.redirect(redirectUrl)
    setTokenCookies(response, newAccessToken, newRefreshToken)

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    // Redirect to login page and delete refresh token cookie
    const redirectUrl = new URL('/login', clientBaseUrl)
    redirectUrl.searchParams.set('error', 'Internal server error')
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.delete('refresh_token')
    return response
  }
}
