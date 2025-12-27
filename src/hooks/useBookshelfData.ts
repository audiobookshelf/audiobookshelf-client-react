import { fetchAuthorsAction, fetchCollectionsAction, fetchLibraryItemsAction, fetchPlaylistsAction, fetchSeriesAction } from '@/app/actions/libraryActions'
import { Author, BookshelfEntity, Collection, EntityType, LibraryItem, Playlist, Series } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseBookshelfDataProps {
  libraryId: string
  entityType: EntityType
  query: string // URLSearchParams string
  itemsPerPage: number
}

interface BookshelfDataState {
  items: (BookshelfEntity | null)[]
  totalEntities: number
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
}

// Fetch action dispatcher based on entity type
async function fetchEntityData(entityType: EntityType, libraryId: string, queryParams: string) {
  switch (entityType) {
    case 'items':
      return fetchLibraryItemsAction(libraryId, queryParams)
    case 'series':
      return fetchSeriesAction(libraryId, queryParams)
    case 'collections':
      return fetchCollectionsAction(libraryId, queryParams)
    case 'playlists':
      return fetchPlaylistsAction(libraryId, queryParams)
    case 'authors':
      return fetchAuthorsAction(libraryId, queryParams)
  }
}

// Get results array from response (different APIs return different keys)
function getResultsFromResponse(entityType: EntityType, data: unknown): BookshelfEntity[] {
  const response = data as Record<string, unknown>
  switch (entityType) {
    case 'items':
      return (response.results as LibraryItem[]) || []
    case 'series':
      return (response.results as Series[]) || []
    case 'collections':
      return (response.results as Collection[]) || []
    case 'playlists':
      return (response.results as Playlist[]) || []
    case 'authors':
      // Authors API uses 'results' when paginated, 'authors' when not paginated
      return (response.results as Author[]) || (response.authors as Author[]) || []
  }
}

export function useBookshelfData({ libraryId, entityType, query, itemsPerPage }: UseBookshelfDataProps) {
  const [state, setState] = useState<BookshelfDataState>({
    items: [],
    totalEntities: 0,
    isInitialized: false,
    isLoading: false,
    error: null
  })

  const pagesLoadedRef = useRef<Set<number>>(new Set())
  const loadingPagesRef = useRef<Set<number>>(new Set())
  const itemsPerPageRef = useRef(itemsPerPage)

  // Reset when query or entityType changes
  useEffect(() => {
    setState({
      items: [],
      totalEntities: 0,
      isInitialized: false,
      isLoading: true,
      error: null
    })
    pagesLoadedRef.current.clear()
    loadingPagesRef.current.clear()
  }, [libraryId, entityType, query])

  // Handle itemsPerPage changes - invalidate cache but keep items
  // Only clear cache when itemsPerPage changes AFTER initial data load is complete
  // During initial layout settling, itemsPerPage may bounce around - ignore those changes
  useEffect(() => {
    if (itemsPerPage > 0) {
      // Only clear cache if we've already fetched data (isInitialized) and itemsPerPage actually changed
      if (state.isInitialized && itemsPerPageRef.current > 0 && itemsPerPageRef.current !== itemsPerPage) {
        // itemsPerPage changed after initial load - clear cache for re-fetch with new page boundaries
        pagesLoadedRef.current.clear()
        loadingPagesRef.current.clear()
      }
      itemsPerPageRef.current = itemsPerPage
    }
  }, [itemsPerPage, state.isInitialized])

  const loadPage = useCallback(
    async (page: number) => {
      // Use ref to get current itemsPerPage - this keeps callback identity stable
      const currentItemsPerPage = itemsPerPageRef.current

      // Skip if itemsPerPage is not yet set (layout not ready)
      if (currentItemsPerPage <= 0) return

      // Check if already loaded or loading
      if (pagesLoadedRef.current.has(page) || loadingPagesRef.current.has(page)) {
        return
      }

      loadingPagesRef.current.add(page)

      try {
        const fullQuery = query ? `${query}&` : ''
        // Build query params - include common params and entity-specific ones
        let queryParams = `${fullQuery}limit=${currentItemsPerPage}&page=${page}&minified=1`

        // Add entity-specific includes
        if (entityType === 'items') {
          queryParams += '&include=rssfeed,numEpisodesIncomplete,share'
        }

        const data = await fetchEntityData(entityType, libraryId, queryParams)

        const results = getResultsFromResponse(entityType, data)
        const total = (data as { total?: number }).total ?? results.length

        setState((prev) => {
          let newItems = [...prev.items]
          if (!prev.isInitialized || prev.totalEntities !== total) {
            newItems = new Array(total).fill(null)
          }

          const startIndex = page * currentItemsPerPage
          results.forEach((item, i) => {
            newItems[startIndex + i] = item
          })

          return {
            items: newItems,
            totalEntities: total,
            isInitialized: true,
            isLoading: false,
            error: null
          }
        })
        pagesLoadedRef.current.add(page)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load page')
        console.error('Failed to load page', page, error)
        setState((prev) => ({ ...prev, error, isLoading: false }))
      } finally {
        loadingPagesRef.current.delete(page)
      }
    },
    [libraryId, entityType, query]
  )

  return {
    ...state,
    loadPage
  }
}
