'use server'

import {
  getLibraryAuthors,
  getLibraryCollections,
  getLibraryFilterData,
  getLibraryItems,
  getLibraryPersonalized,
  getLibraryPlaylists,
  getLibrarySeries,
  getRecentEpisodes,
  removeLibraryItemsWithIssues
} from '@/lib/api'
import { RECENT_EPISODES_PAGE_SIZE } from '@/lib/recentEpisodes'
import { revalidatePath } from 'next/cache'

export async function fetchLibraryItemsAction(libraryId: string, query: string) {
  return getLibraryItems(libraryId, query)
}

export async function fetchLibraryFilterDataAction(libraryId: string) {
  return getLibraryFilterData(libraryId)
}

export async function fetchLibraryPersonalizedAction(libraryId: string) {
  return getLibraryPersonalized(libraryId)
}

export async function fetchSeriesAction(libraryId: string, query: string) {
  return getLibrarySeries(libraryId, query)
}

export async function fetchAuthorsAction(libraryId: string, query: string) {
  return getLibraryAuthors(libraryId, query)
}

export async function fetchCollectionsAction(libraryId: string, query: string) {
  return getLibraryCollections(libraryId, query)
}

export async function fetchPlaylistsAction(libraryId: string, query: string) {
  return getLibraryPlaylists(libraryId, query)
}

export async function fetchRecentEpisodesAction(libraryId: string, page: number) {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('Invalid recent episodes page')
  return getRecentEpisodes(libraryId, RECENT_EPISODES_PAGE_SIZE, page)
}

export async function removeLibraryItemsWithIssuesAction(libraryId: string) {
  return removeLibraryItemsWithIssues(libraryId)
}

/** Drop this tab's cached RSC for the open library so the next visit, including Back, renders current server data. */
export async function revalidateLibraryLayoutAction(libraryId: string) {
  revalidatePath(`/library/${libraryId}`, 'layout')
}
