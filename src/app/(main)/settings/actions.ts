'use server'

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

export async function updateServerSettings(settingsUpdatePayload: Partial<ServerSettings>): Promise<UpdateServerSettingsApiResponse> {
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

export async function updateSortingPrefixes(sortingPrefixes: string[]): Promise<UpdateSortingPrefixesApiResponse> {
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

export async function purgeCache(): Promise<void> {
  await apiRequest<void>('/api/cache/purge', {
    method: 'POST'
  })
}

export async function purgeItemsCache(): Promise<void> {
  await apiRequest<void>('/api/cache/items/purge', {
    method: 'POST'
  })
}
