'use server'

import * as api from '@/lib/api'
import { BookSearchResult, PodcastSearchResult, UpdateLibraryItemMediaPayload, UpdateLibraryItemMediaResponse } from '@/types/api'

/**
 * Server Action: Search for books using a metadata provider
 */
export async function searchBooksAction(provider: string, title: string, author?: string, libraryItemId?: string): Promise<BookSearchResult[]> {
  return api.searchBooks(provider, title, author, libraryItemId)
}

/**
 * Server Action: Search for podcasts
 */
export async function searchPodcastsAction(term: string): Promise<PodcastSearchResult[]> {
  return api.searchPodcasts(term)
}

/**
 * Server Action: Apply match updates to a library item
 */
export async function applyMatchAction(libraryItemId: string, updatePayload: UpdateLibraryItemMediaPayload): Promise<UpdateLibraryItemMediaResponse> {
  return api.updateLibraryItemMedia(libraryItemId, updatePayload)
}
