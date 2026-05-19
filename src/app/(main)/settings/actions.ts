import { apiRequest } from '@/lib/api'
import { ServerSettings } from '@/types/api'
import { updateTag } from 'next/cache'

export type UpdateServerSettingsApiResponse = {
  serverSettings: ServerSettings
}

export type UpdateSortingPrefixesApiResponse = {
  rowsUpdated: number
  serverSettings: ServerSettings
}

// Server Action
export async function updateServerSettings(settingsUpdatePayload: Partial<ServerSettings>): Promise<UpdateServerSettingsApiResponse> {
  'use server'

  const response = await apiRequest<UpdateServerSettingsApiResponse>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(settingsUpdatePayload)
  })

  // Invalidate the current user cache
  if (response) {
    updateTag('current-user')
  }

  return response
}

// Server Action for updating sorting prefixes
export async function updateSortingPrefixes(sortingPrefixes: string[]): Promise<UpdateSortingPrefixesApiResponse> {
  'use server'

  const response = await apiRequest<UpdateSortingPrefixesApiResponse>('/api/sorting-prefixes', {
    method: 'PATCH',
    body: JSON.stringify({ sortingPrefixes })
  })

  // Invalidate the current user cache
  if (response) {
    updateTag('current-user')
  }

  return response
}
