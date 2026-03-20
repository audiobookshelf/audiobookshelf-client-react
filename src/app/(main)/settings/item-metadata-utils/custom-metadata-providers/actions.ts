'use server'

import * as api from '@/lib/api'
import { CreateCustomMetadataProviderPayload, CreateCustomMetadataProviderResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function createCustomMetadataProvider(payload: CreateCustomMetadataProviderPayload): Promise<CreateCustomMetadataProviderResponse> {
  const result = await api.createCustomMetadataProvider(payload)
  revalidatePath('/settings/item-metadata-utils/custom-metadata-providers')
  return result
}

export async function deleteCustomMetadataProvider(providerId: string): Promise<void> {
  await api.deleteCustomMetadataProvider(providerId)
  revalidatePath('/settings/item-metadata-utils/custom-metadata-providers')
}
