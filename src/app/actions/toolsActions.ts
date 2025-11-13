'use server'

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
