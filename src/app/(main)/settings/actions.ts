import { apiRequest } from '@/lib/api'
import { ServerSettings } from '@/types/api'

export type UpdateServerSettingsApiResponse = {
  serverSettings: ServerSettings
}

export type UpdateSortingPrefixesApiResponse = {
  rowsUpdated: number
  serverSettings: ServerSettings
}

// Server Action
export async function updateServerSettings(serverSettings: ServerSettings) {
  'use server'

  const response = await apiRequest<UpdateServerSettingsApiResponse>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(serverSettings)
  })

  return response
}

// Server Action for updating sorting prefixes
export async function updateSortingPrefixes(sortingPrefixes: string[]) {
  'use server'

  const response = await apiRequest<UpdateSortingPrefixesApiResponse>('/api/sorting-prefixes', {
    method: 'PATCH',
    body: JSON.stringify({ sortingPrefixes })
  })

  return response
}
