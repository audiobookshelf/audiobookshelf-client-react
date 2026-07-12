'use server'

import * as api from '@/lib/api'
import type { BatchQuickMatchOptions } from '@/lib/api'
import type { Collection } from '@/types/api'
import { revalidatePath } from 'next/cache'

function revalidateCollectionDetailPage(collection: Pick<Collection, 'libraryId' | 'id'>) {
  const { libraryId, id } = collection
  if (!libraryId || !id) return
  revalidatePath(`/library/${libraryId}/collection/${id}`)
}

export async function batchDeleteLibraryItemsAction(libraryItemIds: string[], hardDelete: boolean) {
  return api.batchDeleteLibraryItems(libraryItemIds, hardDelete)
}

export async function batchScanLibraryItemsAction(libraryItemIds: string[]) {
  return api.batchScanLibraryItems(libraryItemIds)
}

export async function batchQuickMatchLibraryItemsAction(libraryItemIds: string[], options: BatchQuickMatchOptions) {
  return api.batchQuickMatchLibraryItems(libraryItemIds, options)
}

export async function batchEmbedMetadataAction(libraryItemIds: string[]) {
  return api.batchEmbedMetadata(libraryItemIds)
}

export async function batchAddBooksToCollectionAction(collectionId: string, books: string[]) {
  const updated = await api.batchAddBooksToCollection(collectionId, books)
  revalidateCollectionDetailPage(updated)
  return updated
}

export async function batchRemoveBooksFromCollectionAction(collectionId: string, books: string[]) {
  const updated = await api.batchRemoveBooksFromCollection(collectionId, books)
  revalidateCollectionDetailPage(updated)
  return updated
}
