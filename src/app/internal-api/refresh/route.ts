import { clearSessionCookies, getClientBaseUrlFromRequest, redirectToLogin, refreshSessionWithToken, setTokenCookies } from '@/lib/api'
import { getSafeRedirectPath, withBasePath } from '@/lib/basePath'
import { getUserDefaultUrlPath } from '@/lib/userPermissions'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const rscMap = new Map<string, boolean>()

function wantsJson(request: Request) {
  return request.headers.get('accept') === 'application/json'
}

/** 401 JSON for the socket refresh path. Cookies are cleared so a reload cannot retry a rejected token. */
function unauthorizedJson() {
  const response = NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
  clearSessionCookies(response)
  return response
}

/** Rate limit, server error, or unreachable server. Cookies stay so the session can recover. */
function transientJson(httpStatus: number, retryAfter: string | null) {
  const response = NextResponse.json({ error: 'Token refresh failed' }, { status: httpStatus })
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter)
  }
  return response
}

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

    const outcome = await refreshSessionWithToken(refreshToken)

    if (outcome.kind === 'unauthorized') {
      if (wantsJson(request)) {
        return unauthorizedJson()
      }
      return redirectToLogin(request, 'Token refresh failed')
    }

    if (outcome.kind === 'transient') {
      return transientJson(outcome.httpStatus, outcome.retryAfter)
    }

    const session = outcome.session
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = session

    // If the request is an API request, dont redirect (used in socket auth_failed handler)
    if (wantsJson(request)) {
      const response = NextResponse.json({ success: true })
      setTokenCookies(response, newAccessToken, newRefreshToken)
      return response
    }

    // Only follow an in-app path. Anything else falls back to the user's library.
    const redirectUrlPath = getSafeRedirectPath(url.searchParams.get('redirect')) || getUserDefaultUrlPath(session.userDefaultLibraryId)
    // A root-relative path would drop the base path from clientBaseUrl, so add it explicitly.
    const redirectUrl = new URL(withBasePath(redirectUrlPath), clientBaseUrl)

    const response = NextResponse.redirect(redirectUrl)
    setTokenCookies(response, newAccessToken, newRefreshToken)

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return transientJson(500, null)
  }
}
