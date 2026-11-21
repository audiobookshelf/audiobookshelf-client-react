import { withBasePath } from '@/lib/basePath'
import type { PodcastEpisode } from '@/types/api'

/**
 * Build cover URL for a library item
 * @param libraryItemId
 * @param timestamp - Optional timestamp for cache busting (typically updatedAt)
 * @param raw - If true, requests raw cover without server-side processing
 * @returns Cover URL
 */
export function getLibraryItemCoverUrl(libraryItemId: string, timestamp?: number | null, raw: boolean = false): string {
  const params = new URLSearchParams()
  params.set('ts', String(timestamp ?? 0))
  if (raw) {
    params.set('raw', '1')
  }
  return withBasePath(`/api/items/${libraryItemId}/cover?${params.toString()}`)
}

/**
 * Build URL for a library file (requires authentication)
 *
 * Authentication is handled via httpOnly cookies through the Next.js internal API proxy.
 * The browser automatically includes the access_token cookie with the request.
 * The internal-api route refreshes expired access tokens before proxying to the backend.
 *
 * @param libraryItemId
 * @param fileIno - The file inode value
 * @param timestamp - Optional timestamp for cache busting (typically updatedAt)
 * @returns Library file URL (authentication via cookies)
 */
export function getLibraryFileUrl(libraryItemId: string, fileIno: string, timestamp?: number): string {
  const params = new URLSearchParams()
  if (timestamp) {
    params.set('ts', String(timestamp))
  }
  return withBasePath(`/internal-api/items/${libraryItemId}/file/${fileIno}?${params.toString()}`)
}

/**
 * Get placeholder cover image URL
 */
export function getPlaceholderCoverUrl(): string {
  return withBasePath('/images/book_placeholder.jpg')
}

export interface CoverLibraryItem {
  id: string
  updatedAt?: number
  media: { coverPath?: string | null }
}

export interface GroupCoverItem {
  libraryItem: CoverLibraryItem
  episode?: PodcastEpisode | null
}

/**
 * Get cover src for a library item, falling back to the provided placeholder
 * when no coverPath is available.
 */
export function getLibraryItemCoverSrc(libraryItem: CoverLibraryItem, placeholder: string, raw = false): string {
  const hasCover = !!libraryItem.media.coverPath

  if (!hasCover) {
    return placeholder
  }

  return getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, raw)
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

/** Build an episode cover URL with its own cache timestamp. */
export function getEpisodeCoverUrl(
  libraryItemId: string,
  episode: { id: string; updatedAt?: number },
  { raw = false, width, fallback = true }: { raw?: boolean; width?: number; fallback?: boolean } = {}
): string {
  const params = new URLSearchParams()
  if (episode.updatedAt) params.set('ts', String(episode.updatedAt))
  if (raw) params.set('raw', '1')
  if (width) params.set('width', String(width))
  if (!fallback) params.set('fallback', '0')
  const query = params.toString()
  return withBasePath(`/api/podcasts/${libraryItemId}/episode/${episode.id}/cover${query ? `?${query}` : ''}`)
}

/** Prefer episode artwork, then the show cover or placeholder. */
export function getEpisodeCoverSrc(
  libraryItem: CoverLibraryItem,
  episode: Pick<PodcastEpisode, 'id' | 'updatedAt' | 'coverPath'> | null | undefined,
  placeholder: string,
  { raw = false }: { raw?: boolean } = {}
): string {
  if (episode?.coverPath) return getEpisodeCoverUrl(libraryItem.id, episode, { raw })
  return getLibraryItemCoverSrc(libraryItem, placeholder, raw)
}
