'use server'

import { updateLibraryItemMedia, updateMediaFinished } from '@/lib/api'
import { UpdateLibraryItemMediaPayload } from '@/types/api'

import { revalidatePath } from 'next/cache'

export async function updateLibraryItemAction(libraryItemId: string, updatePayload: UpdateLibraryItemMediaPayload) {
  const response = await updateLibraryItemMedia(libraryItemId, updatePayload)
  if (response.updated && response.libraryItem) {
    revalidatePath(`/library/${response.libraryItem.libraryId}/item/${response.libraryItem.id}`)
  }
  return response
}

export async function toggleMediaFinished(libraryItemId: string, isFinished: boolean) {
  await updateMediaFinished(libraryItemId, { isFinished })
}
