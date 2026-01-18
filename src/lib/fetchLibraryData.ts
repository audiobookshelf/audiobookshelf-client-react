import {
  fetchAuthorsAction,
  fetchCollectionAction,
  fetchCollectionsAction,
  fetchLibraryItemsAction,
  fetchLibraryPersonalizedAction,
  fetchLibrarySeriesAction,
  fetchPlaylistAction,
  fetchPlaylistsAction
} from '@/app/actions/navigationActions'
import { BookshelfEntity, EntityType, PersonalizedShelf } from '@/types/api'

// Include fields for library items (used by BookshelfClient)
const LIBRARY_ITEMS_INCLUDE = 'rssfeed,numEpisodesIncomplete,share'

// Shelf types that contain navigable entities
const NAVIGABLE_SHELF_TYPES = ['book', 'podcast', 'episode', 'series', 'authors'] as const

// Centralized types for fetching
export type ContextType = 'series' | 'books-in-series' | 'collection' | 'playlist' | 'personalized' | 'author' | EntityType

export interface FetchLibraryDataParams {
  context: ContextType
  contextId?: string | null
  libraryId?: string
  params?: string | null // Query string
  page?: number
  limit?: number
}

export interface FetchLibraryDataResult {
  items: BookshelfEntity[]
  total: number
}

export async function fetchLibraryData(args: FetchLibraryDataParams): Promise<FetchLibraryDataResult> {
  const { context, contextId, libraryId, params, page = 0, limit = 0 } = args

  // Base query params
  const baseParams = new URLSearchParams(params || '')
  if (limit > 0) baseParams.set('limit', limit.toString())
  baseParams.set('minified', '1')
  baseParams.set('page', page.toString())

  // Specific context handling
  if (context === 'items') {
    if (!libraryId) throw new Error('Library ID required for library context')

    // Add entity specific includes if 'items' (BookshelfClient uses this)
    baseParams.set('include', LIBRARY_ITEMS_INCLUDE)

    const res = await fetchLibraryItemsAction(libraryId, baseParams.toString())
    const items = res.results || []
    return { items, total: res.total ?? items.length }
  }

  if (context === 'series') {
    if (!libraryId) throw new Error('Library ID required for series context')
    const res = await fetchLibrarySeriesAction(libraryId, baseParams.toString())
    const items = res.results || []
    return { items, total: res.total ?? items.length }
  }

  if (context === 'books-in-series') {
    if (!libraryId || !contextId) throw new Error('Library ID and Series ID required for books-in-series context')
    const encodedId = encodeURIComponent(btoa(contextId))
    baseParams.set('filter', `series.${encodedId}`)
    const res = await fetchLibraryItemsAction(libraryId, baseParams.toString())
    const items = res.results || []
    return { items, total: res.total ?? items.length }
  }

  if (context === 'collections') {
    if (!libraryId) throw new Error('Library ID required')
    const res = await fetchCollectionsAction(libraryId, baseParams.toString())
    const items = res.results || []
    return { items, total: res.total ?? items.length }
  }

  if (context === 'playlists') {
    if (!libraryId) throw new Error('Library ID required')
    const res = await fetchPlaylistsAction(libraryId, baseParams.toString())
    const items = res.results || []
    return { items, total: res.total ?? items.length }
  }

  if (context === 'authors') {
    if (!libraryId) throw new Error('Library ID required')
    const res = await fetchAuthorsAction(libraryId, baseParams.toString())
    const items = res.results || res.authors || []
    return { items, total: res.total ?? items.length }
  }

  // Singular Contexts (Usually non-paginated or specific handling)
  if (context === 'collection' && contextId) {
    const res = await fetchCollectionAction(contextId)
    const items = res.books || []
    const total = items.length

    return { items, total }
  }

  if (context === 'playlist' && contextId) {
    const res = await fetchPlaylistAction(contextId)
    const items = (res.items || []).map((pi: { libraryItem: BookshelfEntity }) => pi.libraryItem).filter(Boolean)
    const total = items.length

    return { items, total }
  }

  if (context === 'personalized' && libraryId) {
    const shelves = await fetchLibraryPersonalizedAction(libraryId)

    if (!contextId) {
      return { items: shelves as BookshelfEntity[], total: shelves.length }
    }

    const shelf = shelves.find((s: PersonalizedShelf) => s.id === contextId)
    if (shelf && NAVIGABLE_SHELF_TYPES.includes(shelf.type)) {
      const items = shelf.entities as BookshelfEntity[]
      const total = items.length

      return { items, total }
    }

    return { items: [], total: 0 }
  }

  if (context === 'author' && contextId && libraryId) {
    baseParams.set('filter', `authors.${contextId}`)
    const res = await fetchLibraryItemsAction(libraryId, baseParams.toString())
    const items = res.results || []
    return { items, total: res.total ?? items.length }
  }

  console.warn(`[navigationFetcher] Unhandled context: ${context}`, { contextId, libraryId })
  return { items: [], total: 0 }
}
