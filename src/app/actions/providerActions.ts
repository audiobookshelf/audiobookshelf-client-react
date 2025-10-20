'use server'

import * as api from '@/lib/api'
import { ApiResponse } from '@/lib/api'
import { MetadataProvidersResponse } from '@/types/api'

/**
 * Server Action: Get all available metadata search providers
 */
export async function getMetadataProvidersAction(): Promise<ApiResponse<MetadataProvidersResponse>> {
  return api.getMetadataProviders()
}
