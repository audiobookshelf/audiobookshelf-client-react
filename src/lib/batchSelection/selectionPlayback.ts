import { batchGetLibraryItemsAction, getExpandedLibraryItemAction, getPodcastEpisodeAction } from '@/app/actions/mediaActions'
import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { buildBookQueueItem, buildEpisodeQueueItem } from '@/lib/playerQueue'
import type { SelectedMediaItem } from '@/lib/selectedMediaItem'
import type { LibraryItem } from '@/types/api'
import { isPodcastMedia } from '@/types/api'

export interface SelectionPlayPayload {
  libraryItem: LibraryItem
  episodeId: string | null
  queueItems: PlayerQueueItem[]
}

export async function buildSelectedBooksPlayPayload(
  selectedItems: readonly SelectedMediaItem[],
  uniqueLibraryItemIds: string[]
): Promise<SelectionPlayPayload> {
  const response = await batchGetLibraryItemsAction(uniqueLibraryItemIds)
  const itemMap = new Map(response.libraryItems.map((item) => [item.id, item]))
  const queueItems: PlayerQueueItem[] = []

  for (const selected of selectedItems) {
    const libraryItem = itemMap.get(selected.libraryItemId)
    if (!libraryItem) continue
    const queueItem = buildBookQueueItem(libraryItem)
    if (queueItem) queueItems.push(queueItem)
  }

  if (!queueItems.length) {
    throw new Error('No playable books in selection')
  }

  const firstLibraryItem = itemMap.get(queueItems[0].libraryItemId)
  if (!firstLibraryItem) {
    throw new Error('No playable books in selection')
  }

  return {
    libraryItem: firstLibraryItem,
    episodeId: null,
    queueItems
  }
}

export async function buildSelectedEpisodesPlayPayload(selectedItems: readonly SelectedMediaItem[]): Promise<SelectionPlayPayload> {
  const libraryItemCache = new Map<string, LibraryItem>()
  const queueItems: PlayerQueueItem[] = []

  for (const selected of selectedItems) {
    if (!selected.episodeId) continue

    let libraryItem = libraryItemCache.get(selected.libraryItemId)
    if (!libraryItem) {
      libraryItem = await getExpandedLibraryItemAction(selected.libraryItemId)
      libraryItemCache.set(selected.libraryItemId, libraryItem)
    }

    const episode = await getPodcastEpisodeAction(selected.libraryItemId, selected.episodeId)
    const podcastTitle = isPodcastMedia(libraryItem.media) ? (libraryItem.media.metadata?.title ?? '') : ''
    const queueItem = buildEpisodeQueueItem({
      libraryItem,
      episode,
      podcastTitle,
      coverPath: isPodcastMedia(libraryItem.media) ? (libraryItem.media.coverPath ?? null) : null
    })
    if (queueItem) queueItems.push(queueItem)
  }

  if (!queueItems.length) {
    throw new Error('No playable episodes in selection')
  }

  const firstSelected = selectedItems.find((item) => item.episodeId)
  if (!firstSelected?.episodeId) {
    throw new Error('No playable episodes in selection')
  }

  const firstLibraryItem = libraryItemCache.get(firstSelected.libraryItemId) ?? (await getExpandedLibraryItemAction(firstSelected.libraryItemId))

  return {
    libraryItem: firstLibraryItem,
    episodeId: firstSelected.episodeId,
    queueItems
  }
}
