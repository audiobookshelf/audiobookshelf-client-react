import type { PlaylistItem, PodcastEpisode } from '@/types/api'
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

export function getEpisodeDuration(episode: PodcastEpisode): number {
  const d = episode.audioFile?.duration ?? episode.audioTrack?.duration
  return typeof d === 'number' && Number.isFinite(d) ? d : 0
}

export function getPlaylistItemDuration(item: PlaylistItem): number {
  if (item.episode) {
    return getEpisodeDuration(item.episode)
  }
  const media = item.libraryItem.media
  if (isBookMedia(media) && 'duration' in media) {
    const d = media.duration
    return typeof d === 'number' && Number.isFinite(d) ? d : 0
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
