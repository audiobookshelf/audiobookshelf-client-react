import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import { formatBookAuthorNames, getBookDuration, isPlayableBook } from '@/lib/book'
import { getEpisodeDuration, isPlayableEpisode } from '@/lib/episode'
import type { LibraryItem, MediaProgress, PodcastEpisode } from '@/types/api'
import { isBookMedia, isBookMetadata } from '@/types/api'

export function buildBookQueueItem(libraryItem: LibraryItem): PlayerQueueItem | null {
  if (!isPlayableBook(libraryItem)) return null

  const media = libraryItem.media
  if (!isBookMedia(media) || !isBookMetadata(media.metadata)) return null

  return {
    libraryItemId: libraryItem.id,
    libraryId: libraryItem.libraryId,
    episodeId: null,
    title: media.metadata.title ?? '',
    subtitle: formatBookAuthorNames(media),
    caption: '',
    duration: getBookDuration(media) || null,
    coverPath: media.coverPath ?? null
  }
}

export function buildEpisodeQueueItem(params: {
  libraryItem: Pick<LibraryItem, 'id' | 'libraryId' | 'isMissing' | 'isInvalid'>
  episode: PodcastEpisode
  podcastTitle: string
  coverPath?: string | null
  caption?: string
}): PlayerQueueItem | null {
  const { libraryItem, episode, podcastTitle, coverPath, caption = '' } = params

  if (!isPlayableEpisode(libraryItem, episode)) return null

  return {
    libraryItemId: libraryItem.id,
    libraryId: libraryItem.libraryId,
    episodeId: episode.id,
    title: episode.title,
    subtitle: podcastTitle,
    caption,
    duration: getEpisodeDuration(episode) || null,
    coverPath: coverPath ?? null
  }
}

export function getQueueItemPlaybackStartTime(item: PlayerQueueItem, mediaProgress: MediaProgress[]): number | undefined {
  const progress = getMediaItemProgress(mediaProgress, item.libraryItemId, item.episodeId ?? undefined)

  if (!progress || progress.isFinished) return undefined
  return progress.currentTime
}
