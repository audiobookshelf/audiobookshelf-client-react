'use server'

import * as api from '@/lib/api'
import { ApiResponse } from '@/lib/api'
import { GetLibrariesResponse, SearchLibraryResponse, UserLoginResponse } from '@/types/api'

/**
 * Server Action: Search a library
 */
export async function searchLibraryAction(libraryId: string, query: string, limit?: number): Promise<ApiResponse<SearchLibraryResponse>> {
  return api.searchLibrary(libraryId, query, limit)
}

/**
 * Server Action: Get current user
 */
export async function getCurrentUserAction(): Promise<ApiResponse<UserLoginResponse>> {
  return api.getCurrentUser()
}

/**
 * Server Action: Get libraries
 */
export async function getLibrariesAction(): Promise<ApiResponse<GetLibrariesResponse>> {
  return api.getLibraries()
}
