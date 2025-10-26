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
