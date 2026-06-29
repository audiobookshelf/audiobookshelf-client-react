'use server'

import * as api from '@/lib/api'

export async function updateEbookProgressAction(libraryItemId: string, payload: { ebookLocation?: string | number; ebookProgress?: number }) {
  return api.updateEbookProgress(libraryItemId, payload)
}

export async function updateEbookFileStatusAction(libraryItemId: string, fileIno: string) {
  return api.updateEbookFileStatus(libraryItemId, fileIno)
}
