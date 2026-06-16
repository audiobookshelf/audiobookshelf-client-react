import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import { getEpisodeDuration } from '@/lib/playlistItems'
import type { LibraryItem, MediaProgress, PlaylistItem, PodcastEpisode } from '@/types/api'
import { isBookMedia, isBookMetadata, isPodcastMedia } from '@/types/api'

type CompilationPlaybackEntry = {
  libraryItemId: string
  libraryItem: LibraryItem
  episode?: PodcastEpisode
  episodeId?: string | null
}

function isPlayableEntry(entry: CompilationPlaybackEntry): boolean {
  const libraryItem = entry.libraryItem
  if (libraryItem.isMissing || libraryItem.isInvalid) return false
  if (entry.episode) return !!entry.episode.audioFile
  const media = libraryItem.media
  if (isBookMedia(media) && 'tracks' in media) {
    return (media.tracks ?? []).length > 0
  }
  return false
}

function toPlaylistEntry(item: PlaylistItem): CompilationPlaybackEntry {
  return {
    libraryItemId: item.libraryItemId,
    libraryItem: item.libraryItem,
    episode: item.episode,
    episodeId: item.episodeId ?? item.episode?.id ?? null
  }
}

function toCollectionEntry(book: LibraryItem): CompilationPlaybackEntry {
  return {
    libraryItemId: book.id,
    libraryItem: book,
    episodeId: null
  }
}

function buildQueueItemFromEntry(entry: CompilationPlaybackEntry): PlayerQueueItem | null {
  const libraryItem = entry.libraryItem
  const media = libraryItem.media

  if (entry.episode) {
    return {
      libraryItemId: libraryItem.id,
      libraryId: libraryItem.libraryId,
      episodeId: entry.episode.id,
      title: entry.episode.title,
      subtitle: media.metadata?.title ?? '',
      caption: '',
      duration: getEpisodeDuration(entry.episode) || null,
      coverPath: isPodcastMedia(media) ? (media.coverPath ?? null) : null
    }
  }

  if (isBookMedia(media) && isBookMetadata(media.metadata)) {
    return {
      libraryItemId: libraryItem.id,
      libraryId: libraryItem.libraryId,
      episodeId: null,
      title: media.metadata.title ?? '',
      subtitle: (media.metadata.authors ?? []).map((au) => au.name).join(', '),
      caption: '',
      duration: media.duration ?? null,
      coverPath: media.coverPath ?? null
    }
  }

  return null
}

function buildCompilationQueueItems(entries: CompilationPlaybackEntry[], mediaProgress: MediaProgress[]): PlayerQueueItem[] {
  const playableEntries = entries.filter(isPlayableEntry)
  if (playableEntries.length === 0) return []

  const entriesWithProgress = playableEntries.map((entry) => {
    return {
      ...entry,
      progress: getMediaItemProgress(mediaProgress, entry.libraryItemId, entry.episodeId ?? undefined)
    }
  })

  const hasUnfinishedItems = entriesWithProgress.some((entry) => !entry.progress || !entry.progress.isFinished)

  // Finished items are skipped while any item is unfinished, so queue[0] is the first
  // unfinished item. When everything is finished the full list is queued for replay.
  const queueItems: PlayerQueueItem[] = []
  for (const entry of entriesWithProgress) {
    if (!hasUnfinishedItems || !entry.progress || !entry.progress.isFinished) {
      const queueItem = buildQueueItemFromEntry(entry)
      if (queueItem) queueItems.push(queueItem)
    }
  }

  return queueItems
}

export function getPlayablePlaylistItems(items: PlaylistItem[]): PlaylistItem[] {
  return items.filter((item) => isPlayableEntry(toPlaylistEntry(item)))
}

export function getPlayableCollectionBooks(books: LibraryItem[]): LibraryItem[] {
  return books.filter((book) => isPlayableEntry(toCollectionEntry(book)))
}

export function buildPlaylistQueueItems(items: PlaylistItem[], mediaProgress: MediaProgress[]): PlayerQueueItem[] {
  return buildCompilationQueueItems(items.map(toPlaylistEntry), mediaProgress)
}

export function buildCollectionQueueItems(books: LibraryItem[], mediaProgress: MediaProgress[]): PlayerQueueItem[] {
  return buildCompilationQueueItems(books.map(toCollectionEntry), mediaProgress)
}

export function getQueueItemPlaybackStartTime(
  item: PlayerQueueItem,
  mediaProgress: MediaProgress[],
  libraryItem?: { id: string; media?: { id?: string } | null }
): number | undefined {
  let progress: MediaProgress | null = getMediaItemProgress(mediaProgress, item.libraryItemId, item.episodeId ?? undefined)

  // if (item.episodeId) {
  //   progress =
  //     mediaProgress.find(
  //       (p) => p.libraryItemId === item.libraryItemId && (p.episodeId === item.episodeId || p.mediaItemId === item.episodeId)
  //     ) ?? null
  // } else if (libraryItem) {
  //   progress = getLibraryItemProgressFromMap(buildMediaItemProgressMap(mediaProgress), libraryItem)
  // } else {
  //   progress = mediaProgress.find((p) => p.libraryItemId === item.libraryItemId && !p.episodeId) ?? null
  // }

  if (!progress || progress.isFinished) return undefined
  return progress.currentTime
}
