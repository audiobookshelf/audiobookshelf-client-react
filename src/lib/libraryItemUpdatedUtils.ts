import type { LibraryItem, PersonalizedShelf, PlaylistItem, Series } from '@/types/api'

/** Preserve client-only fields when merging a socket `item_updated` payload. */
export function mergeLibraryItemUpdate(existing: LibraryItem, updated: LibraryItem): LibraryItem {
  return {
    ...updated,
    rssFeed: existing.rssFeed,
    mediaItemShare: existing.mediaItemShare,
    recentEpisode: existing.recentEpisode
  }
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
      const nextEntities = (shelf.entities as LibraryItem[]).map((entity) => {
        if (entity.id !== updatedItem.id) return entity
        entityChanged = true
        return mergeLibraryItemUpdate(entity, updatedItem)
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

  return changed ? nextShelves : shelves
}
