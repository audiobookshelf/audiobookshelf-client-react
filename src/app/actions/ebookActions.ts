'use server'

import * as api from '@/lib/api'

export async function updateEbookProgressAction(libraryItemId: string, payload: { ebookLocation?: string | number; ebookProgress?: number }) {
  return api.updateEbookProgress(libraryItemId, payload)
}
