/**
 * Returns true when the image URL is served by our cookie-authenticated internal API proxy.
 * Standard `/api/items/.../cover` URLs are public and do not require a session.
 */
export function isAuthenticatedImageUrl(src: string): boolean {
  return src.startsWith('/internal-api/')
}

/**
 * Refresh the session without a full page redirect (used when an authenticated
 * resource fails to load, e.g. expired access token on an <img> request).
 */
export async function silentRefreshSession(): Promise<boolean> {
  try {
    const res = await fetch('/internal-api/refresh', {
      headers: {
        Accept: 'application/json'
      }
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Append a cache-busting query param so the browser retries the image fetch.
 */
export function withImageRetryParam(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_retry=${Date.now()}`
}
