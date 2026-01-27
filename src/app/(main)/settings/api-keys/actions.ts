'use server'

import * as api from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function deleteApiKey(apiKeyId: string): Promise<void> {
  await api.deleteApiKey(apiKeyId)
  revalidatePath('/settings/api-keys')
}
