'use server'

import * as api from '@/lib/api'
import type { ClientSettings } from '@/types/api'
import { updateTag } from 'next/cache'

/**
 * Server Action: Update client settings for the current user
 */
export async function updateClientSettingsAction(settings: ClientSettings): Promise<{ clientSettings: ClientSettings }> {
  const response = await api.updateClientSettings(settings)

  // Invalidate the current user cache
  if (response) {
    updateTag('current-user')
  }

  return response
}
