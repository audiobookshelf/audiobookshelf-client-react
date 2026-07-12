import { batchDeleteLibraryItemsAction, batchEmbedMetadataAction, batchScanLibraryItemsAction } from '@/app/actions/batchActions'
import { batchUpdateMediaFinishedAction, deleteLibraryItemMediaEpisodeAction, getPodcastEpisodeAction } from '@/app/actions/mediaActions'
import { downloadLibraryItemFile, downloadLibraryItems } from '@/lib/download'
import type { SelectedMediaItem } from '@/lib/selectedMediaItem'

export async function toggleFinishedSelection(selectedItems: readonly SelectedMediaItem[], allFinished: boolean) {
  await batchUpdateMediaFinishedAction(
    selectedItems.map((item) => ({
      libraryItemId: item.libraryItemId,
      episodeId: item.episodeId,
      isFinished: !allFinished
    }))
  )
}

export async function deleteLibraryItemsSelection(uniqueLibraryItemIds: string[], hardDelete: boolean) {
  await batchDeleteLibraryItemsAction(uniqueLibraryItemIds, hardDelete)
}

export async function deleteEpisodesSelection(selectedItems: readonly SelectedMediaItem[], hardDelete: boolean) {
  for (const item of selectedItems) {
    if (!item.episodeId) continue
    await deleteLibraryItemMediaEpisodeAction(item.libraryItemId, item.episodeId, hardDelete)
  }
}

export async function downloadEpisodesSelection(selectedItems: readonly SelectedMediaItem[]) {
  for (const item of selectedItems) {
    if (!item.episodeId) continue
    const episode = await getPodcastEpisodeAction(item.libraryItemId, item.episodeId)
    if (!episode.audioFile) continue
    downloadLibraryItemFile(item.libraryItemId, episode.audioFile.ino, episode.audioFile.metadata?.filename)
  }
}

export function downloadLibraryItemsSelection(libraryId: string, uniqueLibraryItemIds: string[]) {
  downloadLibraryItems(libraryId, uniqueLibraryItemIds)
}

export async function rescanLibraryItemsSelection(uniqueLibraryItemIds: string[]) {
  await batchScanLibraryItemsAction(uniqueLibraryItemIds)
}

export async function embedMetadataSelection(uniqueLibraryItemIds: string[]) {
  await batchEmbedMetadataAction(uniqueLibraryItemIds)
}
