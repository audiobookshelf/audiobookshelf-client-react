import { attachRefreshedSessionCookies, fetchBackendWithCookieRefresh } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

type CookieStore = Awaited<ReturnType<typeof cookies>>

type MultipartProxyOptions = {
  /** When true, parse and forward upstream JSON body. Default: empty 200. */
  forwardJsonResponse?: boolean
}

type MultipartProxyRouteOptions = MultipartProxyOptions & {
  logLabel: string
  errorMessage: string
}

/**
 * Pipe a multipart upload from the browser to the backend with cookie auth.
 */
export async function proxyMultipartUpload(
  request: NextRequest,
  backendUrl: string,
  cookieStore: CookieStore,
  options?: MultipartProxyOptions
): Promise<NextResponse> {
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  if (!request.body) {
    return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
  }

  const result = await fetchBackendWithCookieRefresh(backendUrl, cookieStore, {
    method: 'POST',
    body: request.body,
    headers: { 'Content-Type': contentType }
  })

  if (!result.ok) {
    return attachRefreshedSessionCookies(NextResponse.json({ error: result.error }, { status: result.status }), result.refreshedTokens)
  }

  if (options?.forwardJsonResponse) {
    const data = await result.upstream.json()
    return attachRefreshedSessionCookies(NextResponse.json(data), result.refreshedTokens)
  }

  return attachRefreshedSessionCookies(new NextResponse(null, { status: 200 }), result.refreshedTokens)
}

/**
 * Multipart upload proxy with route-level error handling.
 */
export async function proxyMultipartUploadRoute(
  request: NextRequest,
  backendUrl: string,
  cookieStore: CookieStore,
  options: MultipartProxyRouteOptions
): Promise<NextResponse> {
  const { logLabel, errorMessage, ...uploadOptions } = options

  try {
    return await proxyMultipartUpload(request, backendUrl, cookieStore, uploadOptions)
  } catch (error) {
    console.error(`[${logLabel}] Error uploading:`, error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
