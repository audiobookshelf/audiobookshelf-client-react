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
export async function updateServerSettings(serverSettings: ServerSettings): Promise<UpdateServerSettingsApiResponse> {
  'use server'

  return apiRequest<UpdateServerSettingsApiResponse>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(serverSettings)
  })
}

// Server Action for updating sorting prefixes
export async function updateSortingPrefixes(sortingPrefixes: string[]): Promise<UpdateSortingPrefixesApiResponse> {
  'use server'

  return apiRequest<UpdateSortingPrefixesApiResponse>('/api/sorting-prefixes', {
    method: 'PATCH',
    body: JSON.stringify({ sortingPrefixes })
  })
}
