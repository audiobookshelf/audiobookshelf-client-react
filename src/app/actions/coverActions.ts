'use server'

import * as api from '@/lib/api'

/**
 * Server Action: Remove the current cover from a library item
 */
export async function removeCoverAction(libraryItemId: string) {
  return api.removeCover(libraryItemId)
}

/**
 * Server Action: Update cover from a URL
 */
export async function updateCoverFromUrlAction(libraryItemId: string, coverUrl: string) {
  return api.updateCoverFromUrl(libraryItemId, coverUrl)
}

/**
 * Server Action: Set cover from a local file in the library
 */
export async function setCoverFromLocalFileAction(libraryItemId: string, filePath: string) {
  return api.setCoverFromLocalFile(libraryItemId, filePath)
}
