'use server'

import { apiRequest } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export type RemoveGenreApiResponse = {
  numItemsUpdated: number
}

// Server Action to remove a genre
export async function removeGenre(genre: string) {
  const encodedGenre = encodeURIComponent(Buffer.from(genre).toString('base64'))

  const response = await apiRequest<RemoveGenreApiResponse>(`/api/genres/${encodedGenre}`, {
    method: 'DELETE'
  })

  // Revalidate the genres page to refresh the list
  if (response?.numItemsUpdated) {
    revalidatePath('/settings/item-metadata-utils/genres')
  }

  return response
}

export type RenameGenreApiResponse = {
  genreMerged: boolean
  numItemsUpdated: number
}

// Server Action to rename a genre
export async function renameGenre(genre: string, newGenreName: string) {
  const response = await apiRequest<RenameGenreApiResponse>('/api/genres/rename', {
    method: 'POST',
    body: JSON.stringify({
      genre,
      newGenre: newGenreName
    })
  })

  // Revalidate the genres page to refresh the list
  if (response?.numItemsUpdated) {
    revalidatePath('/settings/item-metadata-utils/genres')
  }

  return response
}
