import { prunePersonalizedShelves } from '@/lib/personalizedShelfUtils'
import type { LibraryItem, PersonalizedShelf, PlaylistItem, Series } from '@/types/api'
import { isBookLibraryItem, isPersonalizedSeriesRef, isPodcastMedia } from '@/types/api'

function resolveRecentEpisodeAfterUpdate(existing: LibraryItem, updated: LibraryItem) {
  const recentEpisode = existing.recentEpisode
  if (!recentEpisode) return undefined

  if (!isPodcastMedia(updated.media)) return recentEpisode

  const episodes = updated.media.episodes
  if (!episodes?.some((episode) => episode.id === recentEpisode.id)) return undefined

  return recentEpisode
}

function preserveShelfSeriesRef(existing: LibraryItem, updated: LibraryItem): LibraryItem {
  if (!isBookLibraryItem(existing) || !isBookLibraryItem(updated)) return updated
  const existingSeries = existing.media.metadata.series
  if (!existingSeries || !isPersonalizedSeriesRef(existingSeries)) return updated

  return {
    ...updated,
    media: {
      ...updated.media,
      metadata: {
        ...updated.media.metadata,
        series: existingSeries
      }
    }
  }
}

/** Preserve client-only fields when merging a socket `item_updated` payload. */
export function mergeLibraryItemUpdate(existing: LibraryItem, updated: LibraryItem): LibraryItem {
  const merged: LibraryItem = {
    ...updated,
    rssFeed: existing.rssFeed,
    mediaItemShare: existing.mediaItemShare,
    recentEpisode: resolveRecentEpisodeAfterUpdate(existing, updated)
  }
  return preserveShelfSeriesRef(existing, merged)
}

export function applyLibraryItemUpdateToList(items: LibraryItem[], updatedItem: LibraryItem): LibraryItem[] {
  let changed = false
  const nextItems = items.map((item) => {
    if (item.id !== updatedItem.id) return item
    changed = true
    return mergeLibraryItemUpdate(item, updatedItem)
  })
  return changed ? nextItems : items
}

export function applyLibraryItemUpdateToPlaylistItems(items: PlaylistItem[], updatedItem: LibraryItem): PlaylistItem[] {
  let changed = false
  const nextItems = items.map((item) => {
    if (item.libraryItemId !== updatedItem.id) return item
    changed = true
    return {
      ...item,
      libraryItem: mergeLibraryItemUpdate(item.libraryItem, updatedItem)
    }
  })
  return changed ? nextItems : items
}

export function applyLibraryItemUpdateToShelves(shelves: PersonalizedShelf[], updatedItem: LibraryItem): PersonalizedShelf[] {
  let changed = false
  const nextShelves = shelves.map((shelf) => {
    if (shelf.type === 'book' || shelf.type === 'podcast' || shelf.type === 'episode') {
      let entityChanged = false
      const nextEntities = (shelf.entities as LibraryItem[]).flatMap((entity) => {
        if (entity.id !== updatedItem.id) return [entity]
        entityChanged = true
        const merged = mergeLibraryItemUpdate(entity, updatedItem)
        if (shelf.type === 'episode' && !merged.recentEpisode) return []
        return [merged]
      })
      if (!entityChanged) return shelf
      changed = true
      return { ...shelf, entities: nextEntities }
    }

    if (shelf.type === 'series') {
      let entityChanged = false
      const nextEntities = (shelf.entities as Series[]).map((series) => {
        const books = series.books
        if (!books?.some((book) => book.id === updatedItem.id)) return series

        let bookChanged = false
        const nextBooks = books.map((book) => {
          if (book.id !== updatedItem.id) return book
          bookChanged = true
          return mergeLibraryItemUpdate(book, updatedItem)
        })
        if (!bookChanged) return series
        entityChanged = true
        return { ...series, books: nextBooks }
      })
      if (!entityChanged) return shelf
      changed = true
      return { ...shelf, entities: nextEntities }
    }

    return shelf
  })

  return changed ? prunePersonalizedShelves(nextShelves) : shelves
}
