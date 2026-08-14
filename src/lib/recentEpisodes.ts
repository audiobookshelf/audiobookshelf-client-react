import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { buildEpisodeQueueItem } from '@/lib/playerQueue'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import type { LibraryItem, MediaProgress, RecentPodcastEpisode } from '@/types/api'

export const RECENT_EPISODES_PAGE_SIZE = 50

/** Append episodes in source order while ignoring duplicates from offset pagination. */
export function appendUniqueRecentEpisodes(current: RecentPodcastEpisode[], incoming: RecentPodcastEpisode[]): RecentPodcastEpisode[] {
  if (!incoming.length) return current

  const seen = new Set(current.map((episode) => episode.id))
  const uniqueIncoming = incoming.filter((episode) => {
    if (seen.has(episode.id)) return false
    seen.add(episode.id)
    return true
  })

  return uniqueIncoming.length ? [...current, ...uniqueIncoming] : current
}

/** Build minimal library item stubs for group cover rendering from recent episodes. */
export function getUniqueCoverLibraryItems(episodes: RecentPodcastEpisode[]): LibraryItem[] {
  const seen = new Set<string>()
  const items: LibraryItem[] = []

  for (const episode of episodes) {
    if (seen.has(episode.libraryItemId)) continue
    seen.add(episode.libraryItemId)

    items.push({
      id: episode.libraryItemId,
      libraryId: episode.libraryId,
      updatedAt: episode.updatedAt,
      media: episode.podcast,
      mediaType: 'podcast',
      ino: '',
      path: '',
      relPath: '',
      isFile: false,
      mtimeMs: 0,
      ctimeMs: 0,
      birthtimeMs: 0,
      addedAt: 0,
      isMissing: false,
      isInvalid: false
    })

    if (items.length >= 4) break
  }

  return items
}

/** Queue from clicked episode through newer items (lower indices), skipping finished. */
export function buildRecentEpisodesQueueFromIndex(
  episodes: RecentPodcastEpisode[],
  mediaProgress: MediaProgress[],
  startIndex: number,
  captionForEpisode?: (episode: RecentPodcastEpisode) => string
): PlayerQueueItem[] {
  const queueItems: PlayerQueueItem[] = []

  for (let i = startIndex; i >= 0; i--) {
    const episode = episodes[i]
    const progress = getMediaItemProgress(mediaProgress, episode.libraryItemId, episode.id)
    if (progress?.isFinished) continue

    const queueItem = buildEpisodeQueueItem({
      libraryItem: {
        id: episode.libraryItemId,
        libraryId: episode.libraryId,
        isMissing: false,
        isInvalid: false
      },
      episode,
      podcastTitle: episode.podcast.metadata?.title ?? '',
      coverPath: episode.podcast.coverPath ?? null,
      caption: captionForEpisode?.(episode) ?? ''
    })
    if (queueItem) queueItems.push(queueItem)
  }

  return queueItems
}
