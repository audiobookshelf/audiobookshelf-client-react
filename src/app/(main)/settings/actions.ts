import { apiRequest } from '@/lib/api'
import { ServerSettings } from '@/types/api'

type UpdateServerSettingsApiResponse = {
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
