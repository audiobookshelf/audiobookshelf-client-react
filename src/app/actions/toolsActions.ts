'use server'

import type { M4bEncodeOptions, MetadataObject } from '@/types/api'
import * as api from '@/lib/api'

/**
 * Server Action: Quick embed metadata into audio files for a library item
 */
export async function embedMetadataQuickAction(libraryItemId: string) {
  return api.embedMetadataQuick(libraryItemId)
}

/**
 * Server Action: Get all tasks with queue data
 */
export async function getTasksAction() {
  return api.getTasks()
}

/**
 * Server Action: Get metadata object for embedding preview
 */
export async function getMetadataObjectAction(libraryItemId: string): Promise<MetadataObject> {
  return api.getMetadataObject(libraryItemId)
}

/**
 * Server Action: Embed metadata into audio files with optional backup
 */
export async function embedMetadataAction(libraryItemId: string, backup: boolean) {
  return api.embedMetadata(libraryItemId, backup)
}

/**
 * Server Action: Start M4B encode for a library item
 */
export async function encodeM4bAction(libraryItemId: string, options: M4bEncodeOptions) {
  return api.encodeM4b(libraryItemId, options)
}

/**
 * Server Action: Cancel an in-progress M4B encode
 */
export async function cancelM4bEncodeAction(libraryItemId: string) {
  return api.cancelM4bEncode(libraryItemId)
}
