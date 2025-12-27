'use server'

import * as api from '@/lib/api'
import { GetCollectionsResponse, GetLibrariesResponse, GetPlaylistsResponse, SearchLibraryResponse, UserLoginResponse } from '@/types/api'

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

/**
 * Server Action: Get collections for a library
 */
export async function getCollectionsAction(libraryId: string): Promise<GetCollectionsResponse> {
  return api.getLibraryCollections(libraryId)
}

/**
 * Server Action: Get playlists for a library
 */
export async function getPlaylistsAction(libraryId: string): Promise<GetPlaylistsResponse> {
  return api.getLibraryPlaylists(libraryId)
}
