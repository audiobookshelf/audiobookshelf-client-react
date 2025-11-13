'use server'

import { apiRequest } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export type SaveNarratorApiResponse = {
  updated: number
}

export type DeleteNarratorApiResponse = {
  updated: number
}

// Server Action to save/update a narrator
export async function saveNarrator(libraryId: string, narratorId: string, newName: string) {
  const response = await apiRequest<SaveNarratorApiResponse>(`/api/libraries/${libraryId}/narrators/${narratorId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: newName
    })
  })

  // Revalidate the narrators page to refresh the list
  if (response?.updated) {
    revalidatePath(`/library/${libraryId}/narrators`)
  }

  return response
}

// Server Action to delete a narrator
export async function deleteNarrator(libraryId: string, narratorId: string) {
  const response = await apiRequest<DeleteNarratorApiResponse>(`/api/libraries/${libraryId}/narrators/${narratorId}`, {
    method: 'DELETE'
  })

  // Revalidate the narrators page to refresh the list
  if (response?.updated) {
    revalidatePath(`/library/${libraryId}/narrators`)
  }

  return response
}
