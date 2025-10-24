'use server'

import * as api from '@/lib/api'
import { GetLibrariesResponse, SearchLibraryResponse, UserLoginResponse } from '@/types/api'

/**
 * Server Action: Search a library
 */
export async function searchLibraryAction(libraryId: string, query: string, limit?: number): Promise<SearchLibraryResponse> {
  return api.searchLibrary(libraryId, query, limit)
}

/**
 * Server Action: Get current user
 */
export async function getCurrentUserAction(): Promise<UserLoginResponse> {
  return api.getCurrentUser()
}

/**
 * Server Action: Get libraries
 */
export async function getLibrariesAction(): Promise<GetLibrariesResponse> {
  return api.getLibraries()
}
