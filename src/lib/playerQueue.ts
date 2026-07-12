import type { PlayerQueueItem } from '@/contexts/MediaContext'
import type { EpisodeNavigationContext } from '@/lib/episodeEditNavigation'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import { formatBookAuthorNames, getBookDuration, isPlayableBook } from '@/lib/book'
import { getEpisodeDuration, isPlayableEpisode } from '@/lib/episode'
import type { LibraryItem, MediaProgress, PodcastEpisode, PodcastLibraryItem } from '@/types/api'
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

/** Episode prev/next scope for the player queue modal, in queue order. */
export function getPlayerQueueEpisodeNavigationContext(queueItems: PlayerQueueItem[], item: PlayerQueueItem): EpisodeNavigationContext {
  const slots = queueItems
    .filter((queueItem) => queueItem.episodeId)
    .map((queueItem) => ({
      episodeId: queueItem.episodeId!,
      libraryItemId: queueItem.libraryItemId
    }))

  const initialIndex = slots.findIndex((slot) => slot.episodeId === item.episodeId && slot.libraryItemId === item.libraryItemId)
  if (initialIndex < 0) {
    return {
      slots: [{ episodeId: item.episodeId!, libraryItemId: item.libraryItemId }],
      initialIndex: 0
    }
  }

  return { slots, initialIndex }
}

export function getQueueItemPlaybackStartTime(item: PlayerQueueItem, mediaProgress: MediaProgress[]): number | undefined {
  const progress = getMediaItemProgress(mediaProgress, item.libraryItemId, item.episodeId ?? undefined)

  if (!progress || progress.isFinished) return undefined
  return progress.currentTime
}

/** Queue from clicked episode through the list, skipping finished except the clicked episode. */
export function buildPodcastEpisodesQueueFromIndex(
  episodes: PodcastEpisode[],
  libraryItem: PodcastLibraryItem,
  mediaProgress: MediaProgress[],
  startIndex: number,
  captionForEpisode?: (episode: PodcastEpisode) => string
): PlayerQueueItem[] {
  const queueItems: PlayerQueueItem[] = []
  const podcastTitle = libraryItem.media.metadata?.title ?? ''
  const coverPath = libraryItem.media.coverPath ?? null
  const clickedEpisodeId = episodes[startIndex]?.id

  for (let i = startIndex; i < episodes.length; i++) {
    const episode = episodes[i]
    const progress = getMediaItemProgress(mediaProgress, libraryItem.id, episode.id)
    if (progress?.isFinished && episode.id !== clickedEpisodeId) continue

    const queueItem = buildEpisodeQueueItem({
      libraryItem,
      episode,
      podcastTitle,
      coverPath,
      caption: captionForEpisode?.(episode) ?? ''
    })
    if (queueItem) queueItems.push(queueItem)
  }

  return queueItems
}

/** Item-page Play: first unplayed episode in table order (Vue parity), with forward queue. */
export function getPodcastItemPagePlaybackParams(
  episodesInOrder: PodcastEpisode[],
  libraryItem: PodcastLibraryItem,
  mediaProgress: MediaProgress[],
  captionForEpisode?: (episode: PodcastEpisode) => string
): { episodeId: string; queueItems: PlayerQueueItem[] } | null {
  if (episodesInOrder.length === 0) return null

  let episodeIndex = episodesInOrder.findIndex((episode) => {
    const progress = getMediaItemProgress(mediaProgress, libraryItem.id, episode.id)
    return !progress || !progress.isFinished
  })
  if (episodeIndex < 0) episodeIndex = 0

  const episodeId = episodesInOrder[episodeIndex]?.id
  if (!episodeId) return null

  const queueItems = buildPodcastEpisodesQueueFromIndex(episodesInOrder, libraryItem, mediaProgress, episodeIndex, captionForEpisode)

  return { episodeId, queueItems }
}
