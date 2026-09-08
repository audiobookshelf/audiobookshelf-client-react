import { COOKIE_NAMES } from '@/lib/cookies'
import { parseCoverSize } from '@/lib/coverSizes'
import { cookies } from 'next/headers'

/**
 * Get the saved cover sizes from cookies (server-side)
 * isMobile is the last viewport the client reported, which the user agent cannot tell for a resized window
 */
export async function getCoverSizes(): Promise<{ width?: number; mobileWidth?: number; isMobile?: boolean }> {
  const cookieStore = await cookies()
  const viewport = cookieStore.get(COOKIE_NAMES.mobileViewport)?.value
  return {
    width: parseCoverSize(cookieStore.get(COOKIE_NAMES.coverSize)?.value),
    mobileWidth: parseCoverSize(cookieStore.get(COOKIE_NAMES.mobileCoverSize)?.value),
    isMobile: viewport === '1' ? true : viewport === '0' ? false : undefined
  }
}
