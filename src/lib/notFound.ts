import { getAuthor, getCollection, getLibraryItem, getPlaylist, getSeries, getUser } from '@/lib/api'
import { ApiError } from '@/lib/apiErrors'
import { isNextNotFoundError } from '@/lib/nextErrors'
import type { Author, Collection, LibraryItem, Playlist, Series, User } from '@/types/api'
import { notFound } from 'next/navigation'

/**
 * Fetch helpers that call `notFound()` when a resource is missing.
 */

async function fetchOrNotFound<T>(fetch: () => Promise<T>): Promise<T> {
  try {
    const result = await fetch()
    if (!result) notFound()
    return result
  } catch (error) {
    if (isNextNotFoundError(error)) throw error
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }
}

export async function getLibraryItemOrNotFound(itemId: string, expanded?: boolean, include?: string): Promise<LibraryItem> {
  return fetchOrNotFound(() => getLibraryItem(itemId, expanded, include))
}

export async function getAuthorOrNotFound(authorId: string, queryParams?: string): Promise<Author> {
  return fetchOrNotFound(() => getAuthor(authorId, queryParams))
}

export async function getSeriesOrNotFound(libraryId: string, seriesId: string): Promise<Series> {
  return fetchOrNotFound(() => getSeries(libraryId, seriesId))
}

export async function getCollectionOrNotFound(collectionId: string): Promise<Collection> {
  return fetchOrNotFound(() => getCollection(collectionId))
}

export async function getPlaylistOrNotFound(playlistId: string): Promise<Playlist> {
  return fetchOrNotFound(() => getPlaylist(playlistId))
}

export async function getUserOrNotFound(userId: string): Promise<User> {
  return fetchOrNotFound(() => getUser(userId))
}
