import { getClientBaseUrlFromRequest, getUserDefaultUrlPath, redirectToLogin, refreshSessionWithToken, setTokenCookies } from '@/lib/api'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const rscMap = new Map<string, boolean>()

export async function GET(request: Request) {
  return handleRefresh(request)
}

export async function POST(request: Request) {
  return handleRefresh(request)
}

async function handleRefresh(request: Request) {
  // Client URL for browser redirects (what the user sees)
  const clientBaseUrl = getClientBaseUrlFromRequest(request)

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

    const session = await refreshSessionWithToken(refreshToken)

    if (!session) {
      return redirectToLogin(request, 'Token refresh failed')
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = session

    // If the request is an API request, dont redirect (used in socket auth_failed handler)
    if (request.headers.get('accept') === 'application/json') {
      const response = NextResponse.json({ success: true })
      setTokenCookies(response, newAccessToken, newRefreshToken)
      return response
    }

    // Get redirect URL from query parameters or default to user default path
    const redirectUrlPath = url.searchParams.get('redirect') || getUserDefaultUrlPath(session.userDefaultLibraryId, session.userType)
    const redirectUrl = new URL(redirectUrlPath, clientBaseUrl)

    const response = NextResponse.redirect(redirectUrl)
    setTokenCookies(response, newAccessToken, newRefreshToken)

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return redirectToLogin(request, 'Internal server error')
  }
}
