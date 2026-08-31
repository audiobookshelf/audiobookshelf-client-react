'use server'

import * as api from '@/lib/api'
import type { ClientSettings } from '@/types/api'

/**
 * Server Action: Update client settings for the current user
 *
 * The current-user cache is deliberately not invalidated. These settings are applied
 * optimistically in UserContext, and revalidating would push a fresh initialUser through
 * the layout mid-edit, resetting the value the user is still changing.
 */
export async function updateClientSettingsAction(settings: ClientSettings): Promise<{ clientId: string; settings: ClientSettings }> {
  return api.updateClientSettings(settings)
}
