import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { isPlayableBook } from '@/lib/book'
import { isPlayableEpisode } from '@/lib/episode'
import { buildBookQueueItem, buildEpisodeQueueItem } from '@/lib/playerQueue'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import type { LibraryItem, MediaProgress, PlaylistItem, PodcastEpisode } from '@/types/api'
import { isPodcastMedia } from '@/types/api'

type CompilationPlaybackEntry = {
  libraryItemId: string
  libraryItem: LibraryItem
  episode?: PodcastEpisode
  episodeId?: string | null
}

function isPlayableEntry(entry: CompilationPlaybackEntry): boolean {
  if (entry.episode) {
    return isPlayableEpisode(entry.libraryItem, entry.episode)
  }
  return isPlayableBook(entry.libraryItem)
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
    return buildEpisodeQueueItem({
      libraryItem,
      episode: entry.episode,
      podcastTitle: media.metadata?.title ?? '',
      coverPath: isPodcastMedia(media) ? (media.coverPath ?? null) : null
    })
  }

  return buildBookQueueItem(libraryItem)
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
