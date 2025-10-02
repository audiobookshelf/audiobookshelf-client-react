import { apiRequest } from '@/lib/api'
import { Library } from '@/types/api'

type SaveLibraryOrderApiResponse = {
  libraries: Library[]
}

// Server Action
export async function saveLibraryOrder(reorderObjects: { id: string; newOrder: number }[]) {
  'use server'

  const response = await apiRequest<SaveLibraryOrderApiResponse>('/api/libraries/order', {
    method: 'POST',
    body: JSON.stringify(reorderObjects)
  })

  return response
}
