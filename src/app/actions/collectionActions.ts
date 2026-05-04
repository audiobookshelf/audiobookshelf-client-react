'use server'

import * as api from '@/lib/api'
import type { Collection } from '@/types/api'
import { revalidatePath } from 'next/cache'

function revalidateCollectionDetailPage(collection: Pick<Collection, 'libraryId' | 'id'>) {
  const { libraryId, id } = collection
  if (!libraryId || !id) return
  revalidatePath(`/library/${libraryId}/collection/${id}`)
}

/**
 * Create a collection w/ initial book library item IDs
 */
export async function createCollectionAction(payload: { libraryId: string; name: string; description?: string | null; books?: string[] }): Promise<Collection> {
  const created = await api.createCollection(payload)
  revalidateCollectionDetailPage(created)
  return created
}

/**
 * Add a library item to a collection
 */
export async function addBookToCollectionAction(collectionId: string, libraryItemId: string): Promise<Collection> {
  const updated = await api.addBookToCollection(collectionId, libraryItemId)
  revalidateCollectionDetailPage(updated)
  return updated
}

/**
 * Remove a library item from a collection
 */
export async function removeBookFromCollectionAction(collectionId: string, libraryItemId: string): Promise<Collection> {
  const updated = await api.removeBookFromCollection(collectionId, libraryItemId)
  revalidateCollectionDetailPage(updated)
  return updated
}

/**
 * Update a collection's name, description, and/or book order (`books`: library item ids in order)
 */
export async function updateCollectionAction(
  collectionId: string,
  payload: { name?: string; description?: string | null; books?: string[] }
): Promise<Collection> {
  const updated = await api.updateCollection(collectionId, payload)
  revalidateCollectionDetailPage(updated)
  return updated
}

/**
 * Delete a collection
 */
export async function deleteCollectionAction(collectionId: string): Promise<void> {
  return api.deleteCollection(collectionId)
}

/**
 * Create a playlist from a collection
 */
export async function createPlaylistFromCollectionAction(collectionId: string): Promise<{ id: string }> {
  return api.createPlaylistFromCollection(collectionId)
}
