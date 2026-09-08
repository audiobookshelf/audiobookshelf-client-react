import { COVER_SIZE_COOKIE, COVER_SIZE_MOBILE_COOKIE, MOBILE_VIEWPORT_COOKIE, parseCoverSize } from '@/lib/coverSizes'
import { cookies } from 'next/headers'

/**
 * Get the saved cover sizes from cookies (server-side)
 * isMobile is the last viewport the client reported, which the user agent cannot tell for a resized window
 */
export async function getCoverSizes(): Promise<{ width?: number; mobileWidth?: number; isMobile?: boolean }> {
  const cookieStore = await cookies()
  const viewport = cookieStore.get(MOBILE_VIEWPORT_COOKIE)?.value
  return {
    width: parseCoverSize(cookieStore.get(COVER_SIZE_COOKIE)?.value),
    mobileWidth: parseCoverSize(cookieStore.get(COVER_SIZE_MOBILE_COOKIE)?.value),
    isMobile: viewport === '1' ? true : viewport === '0' ? false : undefined
  }
}
