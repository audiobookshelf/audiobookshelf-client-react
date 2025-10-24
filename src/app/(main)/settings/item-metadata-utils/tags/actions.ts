'use server'

import { apiRequest } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export type RemoveTagApiResponse = {
  numItemsUpdated: number
}

// Server Action to remove a tag
export async function removeTag(tag: string) {
  const encodedTag = encodeURIComponent(Buffer.from(tag).toString('base64'))

  const response = await apiRequest<RemoveTagApiResponse>(`/api/tags/${encodedTag}`, {
    method: 'DELETE'
  })

  // Revalidate the genres page to refresh the list
  if (response?.numItemsUpdated) {
    revalidatePath('/settings/item-metadata-utils/tags')
  }

  return response
}
