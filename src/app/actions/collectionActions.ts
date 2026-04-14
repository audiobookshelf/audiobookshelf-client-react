'use server'

import * as api from '@/lib/api'
import type { Collection } from '@/types/api'

/**
 * Create a collection w/ initial book library item IDs
 */
export async function createCollectionAction(payload: { libraryId: string; name: string; description?: string | null; books?: string[] }): Promise<Collection> {
  return api.createCollection(payload)
}

/**
 * Add a library item to a collection
 */
export async function addBookToCollectionAction(collectionId: string, libraryItemId: string): Promise<Collection> {
  return api.addBookToCollection(collectionId, libraryItemId)
}

/**
 * Remove a library item from a collection
 */
export async function removeBookFromCollectionAction(collectionId: string, libraryItemId: string): Promise<Collection> {
  return api.removeBookFromCollection(collectionId, libraryItemId)
}

/**
 * Update a collection's name and/or description
 */
export async function updateCollectionAction(collectionId: string, payload: { name?: string; description?: string }): Promise<Collection> {
  return api.updateCollection(collectionId, payload)
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
