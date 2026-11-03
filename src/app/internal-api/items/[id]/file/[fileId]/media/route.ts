import { getServerBaseUrl } from '@/lib/api'
import { attachRefreshedSessionCookies, fetchBackendWithCookieRefresh } from '@/lib/serverBackendProxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Stream a library file for playback (chapter preview).
 * Forwards Range so the audio element can seek without loading the whole file.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params
  const cookieStore = await cookies()
  const backendUrl = `${getServerBaseUrl()}/api/items/${id}/file/${fileId}`
  const range = request.headers.get('range')

  const result = await fetchBackendWithCookieRefresh(backendUrl, cookieStore, {
    headers: range ? { Range: range } : undefined
  })

  if (!result.ok) {
    return attachRefreshedSessionCookies(NextResponse.json({ error: result.error }, { status: result.status }), result.refreshedTokens)
  }

  const upstream = result.upstream
  const headers = new Headers()
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  headers.set('Cache-Control', 'private, no-store')

  return attachRefreshedSessionCookies(new NextResponse(upstream.body, { status: upstream.status, headers }), result.refreshedTokens)
}
