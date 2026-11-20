'use server'

import * as api from '@/lib/api'
import { ApiError } from '@/lib/apiErrors'
import { isNextRedirectError } from '@/lib/nextErrors'
import { BookSearchResult, PodcastSearchResult, UpdateLibraryItemMediaPayload, UpdateLibraryItemMediaResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

const COVER_DOWNLOAD_ERRORS = ['Failed to download image from url', 'Failed to fetch image from url']

export type ApplyMatchErrorCode = 'cover-download-failed' | 'update-failed'

export type ApplyMatchActionResult = UpdateLibraryItemMediaResponse & {
  errorCode?: ApplyMatchErrorCode
}

/**
 * Server Action: Search for books using a metadata provider
 */
export async function searchBooksAction(provider: string, title: string, author?: string, libraryItemId?: string): Promise<BookSearchResult[]> {
  return api.searchBooks(provider, title, author, libraryItemId)
}

/**
 * Server Action: Search for podcasts
 */
export async function searchPodcastsAction(term: string, country = 'us'): Promise<PodcastSearchResult[]> {
  return api.searchPodcasts(term, country)
}

/**
 * Server Action: Apply match updates to a library item
 */
export async function applyMatchAction(libraryItemId: string, updatePayload: UpdateLibraryItemMediaPayload): Promise<ApplyMatchActionResult> {
  try {
    const result = await api.updateLibraryItemMedia(libraryItemId, updatePayload)
    revalidatePath('/library', 'layout')
    return result
  } catch (error) {
    // A thrown server-action error is replaced with a generic production message before it reaches the toast.
    if (isNextRedirectError(error)) throw error
    if (error instanceof ApiError && COVER_DOWNLOAD_ERRORS.includes(error.message.trim())) {
      console.error('Cover download failed while applying match', error.message)
      return { updated: false, errorCode: 'cover-download-failed' }
    }
    console.error('Failed to apply match', error)
    return { updated: false, errorCode: 'update-failed' }
  }
}
