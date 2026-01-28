'use server'

import * as api from '@/lib/api'
import { CreateApiKeyPayload, CreateUpdateApiKeyResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function deleteApiKey(apiKeyId: string): Promise<void> {
  await api.deleteApiKey(apiKeyId)
  revalidatePath('/settings/api-keys')
}

export async function createApiKey(payload: CreateApiKeyPayload): Promise<CreateUpdateApiKeyResponse> {
  const result = await api.createApiKey(payload)
  revalidatePath('/settings/api-keys')
  return result
}

export async function updateApiKey(apiKeyId: string, payload: CreateApiKeyPayload): Promise<CreateUpdateApiKeyResponse> {
  const result = await api.updateApiKey(apiKeyId, payload)
  revalidatePath('/settings/api-keys')
  return result
}
