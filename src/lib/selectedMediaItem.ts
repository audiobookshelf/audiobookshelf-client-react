import { isPlayableBook } from '@/lib/book'
import { isPlayableEpisode } from '@/lib/episode'
import type { LibraryItem, PodcastEpisode } from '@/types/api'

export interface SelectedMediaItem {
  selectionKey: string
  libraryItemId: string
  episodeId?: string
  hasTracks: boolean
}

export function libraryItemSelectionKey(libraryItemId: string): string {
  return `li:${libraryItemId}`
}

export function episodeSelectionKey(episodeId: string): string {
  return `ep:${episodeId}`
}

export function getSelectionKey(params: { libraryItemId: string; episodeId?: string }): string {
  if (params.episodeId) return episodeSelectionKey(params.episodeId)
  return libraryItemSelectionKey(params.libraryItemId)
}

function isPlayableLibraryItem(libraryItem: LibraryItem): boolean {
  if (libraryItem.mediaType === 'podcast') return true
  return isPlayableBook(libraryItem)
}

export function libraryItemToSelectedMediaItem(item: LibraryItem): SelectedMediaItem {
  return {
    selectionKey: libraryItemSelectionKey(item.id),
    libraryItemId: item.id,
    hasTracks: isPlayableLibraryItem(item)
  }
}

export function episodeToSelectedMediaItem(libraryItem: LibraryItem, episode: PodcastEpisode): SelectedMediaItem {
  return {
    selectionKey: episodeSelectionKey(episode.id),
    libraryItemId: libraryItem.id,
    episodeId: episode.id,
    hasTracks: isPlayableEpisode(libraryItem, episode)
  }
}

export function toSelectedMediaItem(libraryItem: LibraryItem, episode?: PodcastEpisode): SelectedMediaItem {
  if (episode) return episodeToSelectedMediaItem(libraryItem, episode)
  return libraryItemToSelectedMediaItem(libraryItem)
}

export function orderedLibraryItemSelectionKeys(items: readonly LibraryItem[], selectEpisodes = false): string[] {
  const keys: string[] = []
  for (const item of items) {
    if (selectEpisodes) {
      const episode = item.recentEpisode
      if (episode) keys.push(episodeSelectionKey(episode.id))
      continue
    }
    keys.push(libraryItemSelectionKey(item.id))
  }
  return keys
}

export interface SelectionKeySource {
  libraryItem: LibraryItem
  episode?: PodcastEpisode
}

export function orderedSelectionKeysFromSources(sources: readonly SelectionKeySource[]): string[] {
  return sources.map((source) => getSelectionKey({ libraryItemId: source.libraryItem.id, episodeId: source.episode?.id }))
}
