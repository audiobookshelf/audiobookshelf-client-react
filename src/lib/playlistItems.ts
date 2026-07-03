import { getBookDuration } from '@/lib/book'
import { getEpisodeDuration } from '@/lib/episode'
import type { PlaylistItem } from '@/types/api'
import { isBookMedia } from '@/types/api'
import type { SortableBookshelfEntry } from '@/types/compilation'

export function getPlaylistItemKey(item: Pick<PlaylistItem, 'libraryItemId' | 'episodeId'>): string {
  return `${item.libraryItemId}:${item.episodeId ?? ''}`
}

export function toSortablePlaylistItems(items: PlaylistItem[]): SortableBookshelfEntry[] {
  return items.map((item) => ({
    sortableId: getPlaylistItemKey(item),
    libraryItem: item.libraryItem,
    episode: item.episode
  }))
}

export function getPlaylistItemDuration(item: PlaylistItem): number {
  if (item.episode) {
    return getEpisodeDuration(item.episode)
  }
  const media = item.libraryItem.media
  if (isBookMedia(media)) {
    return getBookDuration(media)
  }
  return 0
}

export function playlistItemsToPayload(items: PlaylistItem[]) {
  return items.map((i) => ({
    libraryItemId: i.libraryItemId,
    episodeId: i.episodeId ?? null
  }))
}

export function matchesPlaylistItem(item: Pick<PlaylistItem, 'libraryItemId' | 'episodeId'>, libraryItemId: string, episodeId?: string | null): boolean {
  return item.libraryItemId === libraryItemId && (item.episodeId ?? null) === (episodeId ?? null)
}
