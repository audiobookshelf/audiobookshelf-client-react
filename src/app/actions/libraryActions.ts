'use server'

import {
  getLibraryAuthors,
  getLibraryCollections,
  getLibraryFilterData,
  getLibraryItems,
  getLibraryPersonalized,
  getLibraryPlaylists,
  getRecentEpisodes,
  getLibrarySeries,
  removeLibraryItemsWithIssues
} from '@/lib/api'
import { RECENT_EPISODES_PAGE_SIZE } from '@/lib/recentEpisodes'

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
