'use server'

import { getCollection, getLibraryItems, getLibraryPersonalized, getPlaylist, getSeries } from '@/lib/api'

// We define a simplified ContextItem type here or import it if shared.
// However, the hook defined ContextItem locally.
// Let's rely on the return types of the API functions which are serializable.

export async function fetchLibraryItemsAction(libraryId: string, queryParams: string) {
  return getLibraryItems(libraryId, queryParams)
}

export async function fetchSeriesAction(libraryId: string, seriesId: string) {
  return getSeries(libraryId, seriesId)
}

export async function fetchCollectionAction(collectionId: string) {
  return getCollection(collectionId)
}

export async function fetchPlaylistAction(playlistId: string) {
  return getPlaylist(playlistId)
}

export async function fetchLibraryPersonalizedAction(libraryId: string) {
  return getLibraryPersonalized(libraryId)
}

// Re-export lists from libraryActions if available, or wrap getXXX
import { getLibraryAuthors, getLibraryCollections, getLibraryPlaylists, getLibrarySeries } from '@/lib/api'

export async function fetchCollectionsAction(libraryId: string, queryParams: string) {
  return getLibraryCollections(libraryId, queryParams)
}

export async function fetchPlaylistsAction(libraryId: string, queryParams: string) {
  return getLibraryPlaylists(libraryId, queryParams)
}

export async function fetchAuthorsAction(libraryId: string, queryParams: string) {
  return getLibraryAuthors(libraryId, queryParams)
}

export async function fetchLibrarySeriesAction(libraryId: string, queryParams: string) {
  return getLibrarySeries(libraryId, queryParams)
}

// STOP. The previous code imported from `@/app/actions/libraryActions` for lists.
// `navigationActions` seemed to be for single items or small fetches.
// We should import the list actions from `libraryActions` in `navigationFetcher` or re-export them here?
// Better: Import them directly in `navigationFetcher` from where they are defined.
// `useBookshelfData` imported from `@/app/actions/libraryActions`.
// Let's check `libraryActions.ts`.
