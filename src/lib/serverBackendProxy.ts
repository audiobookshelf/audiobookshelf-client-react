import { redirectToLogin, refreshSessionWithToken, SessionRefreshResult, SessionRefreshTokens, setTokenCookies } from '@/lib/api'
import { isTokenExpired, shouldRefreshAccessToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Logger from './Logger'

type CookieStore = Awaited<ReturnType<typeof cookies>>

type ResolvedProxyAuth =
  | {
      ok: true
      accessToken: string
      refreshedTokens: SessionRefreshTokens | null
    }
  | {
      ok: false
      status: number
      error: string
      refreshedTokens: SessionRefreshTokens | null
    }

function isReadableStreamBody(body: BodyInit | null | undefined): body is ReadableStream<Uint8Array> {
  return typeof ReadableStream !== 'undefined' && body instanceof ReadableStream
}

export function attachRefreshedSessionCookies(response: NextResponse, refreshedTokens: SessionRefreshTokens | null): NextResponse {
  if (refreshedTokens) {
    setTokenCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken)
  }
  return response
}

export type BackendProxyFetchResult =
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

async function readUpstreamError(upstream: Response): Promise<string> {
  try {
    const text = await upstream.text()
    if (text?.trim()) {
      return text.trim()
    }
  } catch {
    // ignore
  }
  return `Backend error: ${upstream.statusText}`
}

function refreshedTokensIfDirty(
  tokens: { access: string | null; refresh: string | null },
  initial: { access: string | null; refresh: string | null }
): SessionRefreshTokens | null {
  if (!tokens.access) return null
  if (tokens.access === initial.access && tokens.refresh === initial.refresh) return null
  return { accessToken: tokens.access, refreshToken: tokens.refresh }
}

/**
 * Resolve cookie auth for an upstream request. When proactiveRefresh is true, refreshes
 * before the upstream call so a single-use body stream is not sent with an expired token.
 */
async function resolveProxyAuth(cookieStore: CookieStore, options?: { proactiveRefresh?: boolean }): Promise<ResolvedProxyAuth> {
  const tokens = {
    access: cookieStore.get('access_token')?.value ?? null,
    refresh: cookieStore.get('refresh_token')?.value ?? null
  }
  const initial = { access: tokens.access, refresh: tokens.refresh }

  const dirtyTokens = () => refreshedTokensIfDirty(tokens, initial)

  if (!tokens.access && !tokens.refresh) {
    return { ok: false, status: 401, error: 'Unauthorized', refreshedTokens: null }
  }

  const applySession = (session: SessionRefreshResult) => {
    tokens.access = session.accessToken
    if (session.refreshToken) {
      tokens.refresh = session.refreshToken
    }
  }

  const tryRefresh = async (): Promise<boolean> => {
    if (!tokens.refresh) return false
    const session = await refreshSessionWithToken(tokens.refresh)
    if (!session) return false
    applySession(session)
    return true
  }

  if (!tokens.access && !(await tryRefresh())) {
    return { ok: false, status: 401, error: 'Unauthorized', refreshedTokens: null }
  }

  if (options?.proactiveRefresh && tokens.access && tokens.refresh && shouldRefreshAccessToken(tokens.access)) {
    await tryRefresh()
  }

  if (!tokens.access || isTokenExpired(tokens.access)) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized - token may be expired',
      refreshedTokens: dirtyTokens()
    }
  }

  return { ok: true, accessToken: tokens.access, refreshedTokens: dirtyTokens() }
}

function upstreamFetchWithAuth(accessToken: string, backendUrl: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  const streaming = isReadableStreamBody(init?.body)
  if (streaming) {
    return fetch(backendUrl, {
      ...init,
      headers,
      duplex: 'half'
    } as RequestInit & { duplex: 'half' })
  }
  return fetch(backendUrl, { ...init, headers })
}

async function toBackendProxyFetchResult(upstream: Response, refreshedTokens: SessionRefreshTokens | null): Promise<BackendProxyFetchResult> {
  if (upstream.status === 401) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized - token may be expired',
      refreshedTokens
    }
  }

  if (!upstream.ok) {
    return {
      ok: false,
      status: upstream.status,
      error: await readUpstreamError(upstream),
      refreshedTokens
    }
  }

  return { ok: true, upstream, refreshedTokens }
}

/**
 * Call the backend with cookie auth.
 *
 * Buffered bodies and GET requests may retry once on 401. ReadableStream bodies are
 * refreshed proactively and piped with duplex: 'half' (single-use, no retry).
 */
export async function fetchBackendWithCookieRefresh(backendUrl: string, cookieStore: CookieStore, init?: RequestInit): Promise<BackendProxyFetchResult> {
  const streaming = isReadableStreamBody(init?.body)
  Logger.debug(
    `[fetchBackendWithCookieRefresh] has access: ${cookieStore.get('access_token')?.value != null}, has refresh: ${cookieStore.get('refresh_token')?.value != null}, streaming: ${streaming}`
  )

  const auth = await resolveProxyAuth(cookieStore, { proactiveRefresh: streaming })
  if (!auth.ok) {
    return auth
  }

  const upstream = await upstreamFetchWithAuth(auth.accessToken, backendUrl, init)
  Logger.debug(`[fetchBackendWithCookieRefresh] fetch: upstream: ${upstream.status}`)

  if (!streaming && upstream.status === 401) {
    const refreshToken = cookieStore.get('refresh_token')?.value ?? null
    if (refreshToken) {
      const session = await refreshSessionWithToken(refreshToken)
      if (session) {
        const retried = await upstreamFetchWithAuth(session.accessToken, backendUrl, init)
        return toBackendProxyFetchResult(retried, {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        })
      }
    }
  }

  return toBackendProxyFetchResult(upstream, auth.refreshedTokens)
}

/**
 * For browser navigation (`<a href>` downloads), 401 → redirect to login like internal-api/refresh.
 * Clients that send `Accept: application/json` keep a JSON body (e.g. programmatic use).
 */
export function respondProxyFailure(request: NextRequest, result: Extract<BackendProxyFetchResult, { ok: false }>): NextResponse {
  if (result.status === 401 && request.headers.get('accept') !== 'application/json') {
    return redirectToLogin(request, 'Session expired')
  }
  return attachRefreshedSessionCookies(NextResponse.json({ error: result.error }, { status: result.status }), result.refreshedTokens)
}

type ProxyBackendResponseOptions = {
  logLabel: string
  errorMessage: string
}

type ProxyBackendStreamingOptions = ProxyBackendResponseOptions & {
  emptyBodyError?: string
  defaultContentType?: string
  /** Omit header when false. When omitted, uses upstream Content-Disposition or `attachment`. */
  contentDisposition?: string | false
  cacheControl?: string
}

type ProxyBackendBufferedOptions = ProxyBackendResponseOptions & {
  defaultContentType?: string
  cacheControl: string
  contentDisposition?: string
}

/**
 * Proxy a backend response stream through internal-api (cookie auth + token refresh).
 */
export async function proxyBackendStreamingResponse(
  request: NextRequest,
  cookieStore: CookieStore,
  backendUrl: string,
  options: ProxyBackendStreamingOptions
): Promise<NextResponse> {
  try {
    const result = await fetchBackendWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondProxyFailure(request, result)
    }

    const { upstream: response, refreshedTokens } = result

    if (!response.body) {
      return attachRefreshedSessionCookies(
        NextResponse.json({ error: options.emptyBodyError ?? 'Backend returned empty response stream' }, { status: 502 }),
        refreshedTokens
      )
    }

    const contentType = response.headers.get('content-type') || options.defaultContentType || 'application/octet-stream'
    const contentDisposition =
      options.contentDisposition === false ? null : (options.contentDisposition ?? response.headers.get('content-disposition') ?? 'attachment')
    const contentLength = response.headers.get('content-length')

    return attachRefreshedSessionCookies(
      new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
          ...(contentLength ? { 'Content-Length': contentLength } : {}),
          'Cache-Control': options.cacheControl ?? 'no-cache'
        }
      }),
      refreshedTokens
    )
  } catch (error) {
    console.error(`[${options.logLabel}] Error fetching response:`, error)
    return NextResponse.json({ error: options.errorMessage }, { status: 500 })
  }
}

/**
 * Proxy a backend download stream through internal-api (cookie auth + token refresh).
 * Used by `<a href>` download routes so browsers keep working when the access token expires.
 */
export async function proxyBackendStreamingDownload(
  request: NextRequest,
  cookieStore: CookieStore,
  backendUrl: string,
  options: ProxyBackendResponseOptions
): Promise<NextResponse> {
  return proxyBackendStreamingResponse(request, cookieStore, backendUrl, {
    ...options,
    emptyBodyError: 'Backend returned empty download stream'
  })
}

/**
 * Proxy a backend response buffered in memory (cookie auth + token refresh).
 * Used for smaller assets like ebook previews and file thumbnails.
 */
export async function proxyBackendBufferedResponse(
  request: NextRequest,
  cookieStore: CookieStore,
  backendUrl: string,
  options: ProxyBackendBufferedOptions
): Promise<NextResponse> {
  try {
    const result = await fetchBackendWithCookieRefresh(backendUrl, cookieStore)
    if (!result.ok) {
      return respondProxyFailure(request, result)
    }

    const { upstream: response, refreshedTokens } = result
    const body = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || options.defaultContentType || 'application/octet-stream'

    return attachRefreshedSessionCookies(
      new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          ...(options.contentDisposition ? { 'Content-Disposition': options.contentDisposition } : {}),
          'Cache-Control': options.cacheControl
        }
      }),
      refreshedTokens
    )
  } catch (error) {
    console.error(`[${options.logLabel}] Error fetching response:`, error)
    return NextResponse.json({ error: options.errorMessage }, { status: 500 })
  }
}
