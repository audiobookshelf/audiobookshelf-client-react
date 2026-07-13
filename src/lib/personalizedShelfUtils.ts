import type { Author, AuthorNumBooksUpdate, LibraryItem, PersonalizedShelf, Series } from '@/types/api'

/** Drop series with no books, authors with no books, and shelves with no entities. */
export function prunePersonalizedShelves(shelves: PersonalizedShelf[]): PersonalizedShelf[] {
  const nextShelves = shelves.map((shelf) => {
    if (shelf.type === 'series') {
      const nextEntities = (shelf.entities as Series[]).filter((series) => (series.books?.length ?? 0) > 0)
      if (nextEntities.length === shelf.entities.length) return shelf
      return { ...shelf, entities: nextEntities }
    }

    if (shelf.type === 'authors') {
      const nextEntities = (shelf.entities as Author[]).filter((author) => (author.numBooks ?? 0) > 0)
      if (nextEntities.length === shelf.entities.length) return shelf
      return { ...shelf, entities: nextEntities }
    }

    return shelf
  })

  return nextShelves.filter((shelf) => shelf.entities.length > 0)
}

/** Remove a recent-episode card from episode shelves after the episode was deleted. */
export function applyEpisodeRemovalFromShelves(shelves: PersonalizedShelf[], libraryItemId: string, episodeId: string): PersonalizedShelf[] {
  const nextShelves = shelves.map((shelf) => {
    if (shelf.type !== 'episode') return shelf

    const nextEntities = (shelf.entities as LibraryItem[]).filter((entity) => entity.id !== libraryItemId || entity.recentEpisode?.id !== episodeId)
    if (nextEntities.length === shelf.entities.length) return shelf
    return { ...shelf, entities: nextEntities }
  })

  return prunePersonalizedShelves(nextShelves)
}

/** Remove a library item from book/podcast/episode shelves and from nested series books. */
export function applyLibraryItemRemovalToShelves(shelves: PersonalizedShelf[], libraryItemId: string): PersonalizedShelf[] {
  const nextShelves = shelves.map((shelf) => {
    if (shelf.type === 'book' || shelf.type === 'podcast' || shelf.type === 'episode') {
      const nextEntities = (shelf.entities as LibraryItem[]).filter((entity) => entity.id !== libraryItemId)
      if (nextEntities.length === shelf.entities.length) return shelf
      return { ...shelf, entities: nextEntities }
    }

    if (shelf.type === 'series') {
      let entityChanged = false
      const nextEntities = (shelf.entities as Series[]).map((series) => {
        const books = series.books
        if (!books?.some((book) => book.id === libraryItemId)) return series
        entityChanged = true
        return { ...series, books: books.filter((book) => book.id !== libraryItemId) }
      })
      if (!entityChanged) return shelf
      return { ...shelf, entities: nextEntities }
    }

    return shelf
  })

  return prunePersonalizedShelves(nextShelves)
}

/** Unshift newly added library items onto the recently-added shelf when present. */
export function applyLibraryItemsAddedToRecentlyAddedShelf(shelves: PersonalizedShelf[], libraryItems: LibraryItem[]): PersonalizedShelf[] {
  const recentlyAddedIndex = shelves.findIndex((shelf) => shelf.id === 'recently-added')
  if (recentlyAddedIndex < 0) return shelves

  const recentlyAddedShelf = shelves[recentlyAddedIndex]
  const existingIds = new Set((recentlyAddedShelf.entities as LibraryItem[]).map((entity) => entity.id))
  const itemsToAdd = libraryItems.filter((item) => !existingIds.has(item.id))
  if (itemsToAdd.length === 0) return shelves

  const nextShelves = [...shelves]
  nextShelves[recentlyAddedIndex] = {
    ...recentlyAddedShelf,
    entities: [...itemsToAdd, ...(recentlyAddedShelf.entities as LibraryItem[])]
  }
  return nextShelves
}

export function applyAuthorAddedToNewestAuthorsShelf(shelves: PersonalizedShelf[], author: Author): PersonalizedShelf[] {
  const newestAuthorsIndex = shelves.findIndex((shelf) => shelf.id === 'newest-authors')
  if (newestAuthorsIndex < 0) return shelves

  const newestAuthorsShelf = shelves[newestAuthorsIndex]
  const existingAuthors = newestAuthorsShelf.entities as Author[]
  if (existingAuthors.some((entity) => entity.id === author.id)) return shelves

  const authorToAdd = author.numBooks != null ? author : { ...author, numBooks: 1 }

  const nextShelves = [...shelves]
  nextShelves[newestAuthorsIndex] = {
    ...newestAuthorsShelf,
    entities: [authorToAdd, ...existingAuthors]
  }
  return nextShelves
}

export function applyAuthorUpdateToShelves(shelves: PersonalizedShelf[], author: Author | AuthorNumBooksUpdate): PersonalizedShelf[] {
  if (author.numBooks !== undefined && author.numBooks <= 0) {
    return applyAuthorRemovalToShelves(shelves, author.id)
  }

  let changed = false
  const nextShelves = shelves.map((shelf) => {
    if (shelf.type !== 'authors') return shelf

    let entityChanged = false
    const nextEntities = (shelf.entities as Author[]).map((entity) => {
      if (entity.id !== author.id) return entity
      entityChanged = true
      return { ...entity, ...author }
    })
    if (!entityChanged) return shelf
    changed = true
    return { ...shelf, entities: nextEntities }
  })

  return changed ? nextShelves : shelves
}

export function applyAuthorRemovalToShelves(shelves: PersonalizedShelf[], authorId: string): PersonalizedShelf[] {
  const nextShelves = shelves.map((shelf) => {
    if (shelf.type !== 'authors') return shelf

    const nextEntities = (shelf.entities as Author[]).filter((entity) => entity.id !== authorId)
    if (nextEntities.length === shelf.entities.length) return shelf
    return { ...shelf, entities: nextEntities }
  })

  return prunePersonalizedShelves(nextShelves)
}
