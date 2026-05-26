'use server'

import * as api from '@/lib/api'
import { AuthenticationSettings } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function updateAuthenticationSettings(payload: AuthenticationSettings) {
  const result = await api.updateAuthSettings(payload)
  revalidatePath('/settings/authentication')
  return result
}
