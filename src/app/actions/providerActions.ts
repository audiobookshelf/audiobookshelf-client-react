'use server'

import * as api from '@/lib/api'
import { ApiResponse } from '@/lib/api'
import { MetadataProvidersResponse } from '@/types/api'

/**
 * Server Action: Get available book metadata search providers
 */
export async function getBookProvidersAction(): Promise<ApiResponse<MetadataProvidersResponse>> {
  return api.getBookProviders()
}

/**
 * Server Action: Get available podcast metadata search providers
 */
export async function getPodcastProvidersAction(): Promise<ApiResponse<MetadataProvidersResponse>> {
  return api.getPodcastProviders()
}

/**
 * Server Action: Get available book cover search providers
 */
export async function getBookCoverProvidersAction(): Promise<ApiResponse<MetadataProvidersResponse>> {
  return api.getBookCoverProviders()
}

/**
 * Server Action: Get available podcast cover search providers
 */
export async function getPodcastCoverProvidersAction(): Promise<ApiResponse<MetadataProvidersResponse>> {
  return api.getPodcastCoverProviders()
}

/**
 * Server Action: Get available author search providers
 */
export async function getAuthorProvidersAction(): Promise<ApiResponse<MetadataProvidersResponse>> {
  return api.getAuthorProviders()
}

/**
 * Server Action: Get available chapter search providers
 */
export async function getChapterProvidersAction(): Promise<ApiResponse<MetadataProvidersResponse>> {
  return api.getChapterProviders()
}
