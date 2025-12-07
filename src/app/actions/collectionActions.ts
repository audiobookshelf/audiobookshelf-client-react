'use server'

import * as api from '@/lib/api'
import type { Collection } from '@/types/api'

/**
 * Update a collection's name and/or description
 */
export async function updateCollectionAction(
  collectionId: string,
  payload: { name?: string; description?: string | null }
): Promise<Collection> {
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

