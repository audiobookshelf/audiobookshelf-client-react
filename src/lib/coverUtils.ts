import type { LibraryItem } from '@/types/api'

/**
 * Build cover URL for a library item
 * @param libraryItemId
 * @param timestamp - Optional timestamp for cache busting (typically updatedAt)
 * @param raw - If true, requests raw cover without server-side processing
 * @returns Cover URL
 */
export function getLibraryItemCoverUrl(libraryItemId: string, timestamp?: number | null, raw: boolean = false): string {
  const params = new URLSearchParams()
  params.set('ts', String(timestamp || Date.now()))
  if (raw) {
    params.set('raw', '1')
  }
  return `/api/items/${libraryItemId}/cover?${params.toString()}`
}

/**
 * Build URL for a library file (requires authentication)
 *
 * Authentication is handled via httpOnly cookies through the Next.js internal API proxy.
 * The browser automatically includes the access_token cookie with the request.
 * If the token expires, Next.js middleware will redirect to refresh the token.
 *
 * @param libraryItemId
 * @param fileIno - The file inode value
 * @returns Library file URL (authentication via cookies)
 */
export function getLibraryFileUrl(libraryItemId: string, fileIno: string): string {
  return `/internal-api/items/${libraryItemId}/file/${fileIno}`
}

/**
 * Get placeholder cover image URL
 */
export function getPlaceholderCoverUrl(): string {
  return '/images/book_placeholder.jpg'
}

/**
 * Get cover src for a library item, falling back to the provided placeholder
 * when no coverPath is available.
 */
export function getLibraryItemCoverSrc(libraryItem: LibraryItem, placeholder: string): string {
  const hasCover =
    // Full library item media
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(libraryItem as any).media?.coverPath

  if (!hasCover) {
    return placeholder
  }

  const timestamp = 'updatedAt' in libraryItem ? libraryItem.updatedAt : undefined
  return getLibraryItemCoverUrl(libraryItem.id, timestamp ?? null)
}

/**
 * Get cover aspect ratio from cover aspect ratio setting
 * coverAspectRatioSetting is 0 or 1
 * 0 = standard (1.6)
 * 1 = square (1)
 */
export function getCoverAspectRatio(coverAspectRatioSetting: 0 | 1 | undefined): number {
  if (coverAspectRatioSetting === 1) {
    return 1
  } else {
    return 1.6
  }
}
