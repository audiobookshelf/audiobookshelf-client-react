import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { buildEpisodeQueueItem } from '@/lib/playerQueue'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import type { LibraryItem, MediaProgress, RecentPodcastEpisode } from '@/types/api'

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
      episode,
      libraryItemId: episode.libraryItemId,
      libraryId: episode.libraryId,
      podcastTitle: episode.podcast.metadata?.title ?? '',
      coverPath: episode.podcast.coverPath ?? null,
      caption: captionForEpisode?.(episode) ?? ''
    })
    if (queueItem) queueItems.push(queueItem)
  }

  return queueItems
}
