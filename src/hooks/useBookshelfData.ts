import { fetchAuthorsAction, fetchCollectionsAction, fetchLibraryItemsAction, fetchPlaylistsAction, fetchSeriesAction } from '@/app/actions/libraryActions'
import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { Author, BookshelfEntity, Collection, EntityType, LibraryItem, MediaItemShare, Playlist, RssFeed, Series } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseBookshelfDataProps {
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

export function useBookshelfData({ entityType, query, itemsPerPage }: UseBookshelfDataProps) {
  const { library } = useLibrary()
  const libraryId = library.id
  const [state, setState] = useState<BookshelfDataState>({
    items: [],
    totalEntities: 0,
    isInitialized: false,
    isLoading: true,
    error: null
  })

  const pagesLoadedRef = useRef<Set<number>>(new Set())
  const loadingPagesRef = useRef<Set<number>>(new Set())
  const itemsPerPageRef = useRef(itemsPerPage)
  const activeQueryRef = useRef(query)

  // Reset when query or entityType changes
  useEffect(() => {
    activeQueryRef.current = query
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

  // Remove a single item from the items array by ID
  // Clears page tracking since indices shift after removal
  const removeItem = useCallback((id: string) => {
    // Clear page tracking - indices shift after filter, so we need to
    // allow re-fetching if user scrolls to areas that had loaded data
    pagesLoadedRef.current.clear()
    loadingPagesRef.current.clear()

    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item?.id !== id),
      totalEntities: Math.max(0, prev.totalEntities - 1)
    }))
  }, [])

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

        // Check if query changed while fetching
        if (query !== activeQueryRef.current) return

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
        if (query !== activeQueryRef.current) return
        const error = err instanceof Error ? err : new Error('Failed to load page')
        console.error('Failed to load page', page, error)
        setState((prev) => ({ ...prev, error, isLoading: false }))
      } finally {
        if (query === activeQueryRef.current) {
          loadingPagesRef.current.delete(page)
        }
      }
    },
    [libraryId, entityType, query]
  )

  /**
   * Maps over loaded items, applying the updater to each non-null entry.
   * Only triggers a re-render if the updater returns a new reference for at least one item.
   */
  const updateItems = useCallback((updater: (item: BookshelfEntity) => BookshelfEntity) => {
    setState((prev) => {
      let changed = false
      const nextItems = prev.items.map((item) => {
        if (!item) return item

        const nextItem = updater(item)
        if (nextItem !== item) {
          changed = true
        }
        return nextItem
      })

      if (!changed) return prev
      return {
        ...prev,
        items: nextItems
      }
    })
  }, [])

  // Socket listeners for Author updates
  // Only active when viewing authors
  const handleAuthorAdded = useCallback(
    (author: Author) => {
      if (author.libraryId !== libraryId || entityType !== 'authors') return

      // Since an author was added, the sort order might change completely
      // We must invalidate the current data and refetch
      pagesLoadedRef.current.clear()
      loadingPagesRef.current.clear()

      setState((prev) => ({
        ...prev,
        items: [],
        totalEntities: 0,
        isInitialized: false,
        isLoading: true,
        error: null
      }))
    },
    [entityType, libraryId]
  )

  const handleAuthorUpdated = useCallback(
    (author: Author) => {
      if (author.libraryId !== libraryId || entityType !== 'authors') return

      updateItems((item) => {
        if (item.id !== author.id) return item
        return author
      })
    },
    [entityType, libraryId, updateItems]
  )

  const handleAuthorRemoved = useCallback(
    (data: { id: string; libraryId: string } | Author) => {
      // data might be the author object or { id, libraryId } depending on server event
      const libId = 'libraryId' in data ? data.libraryId : (data as Author).libraryId
      const id = 'id' in data ? data.id : (data as Author).id

      if (libId !== libraryId) return

      if (entityType !== 'authors') return
      removeItem(id)
    },
    [entityType, libraryId, removeItem]
  )

  useSocketEvent<Author>('author_added', handleAuthorAdded)
  useSocketEvent<Author>('author_updated', handleAuthorUpdated)
  useSocketEvent<Author | { id: string; libraryId: string }>('author_removed', handleAuthorRemoved)

  // Socket listeners for share updates
  // Shares only apply to book library items
  const handleShareOpen = useCallback(
    (mediaItemShare: MediaItemShare) => {
      if (library.mediaType !== 'book' || entityType !== 'items') return

      updateItems((item) => {
        const li = item as LibraryItem
        if (li.media.id !== mediaItemShare.mediaItemId) return item
        return { ...li, mediaItemShare }
      })
    },
    [entityType, library.mediaType, updateItems]
  )

  const handleShareClosed = useCallback(
    (mediaItemShare: MediaItemShare) => {
      if (library.mediaType !== 'book' || entityType !== 'items') return

      updateItems((item) => {
        const li = item as LibraryItem
        if (li.media.id !== mediaItemShare.mediaItemId) return item
        return { ...li, mediaItemShare: undefined }
      })
    },
    [entityType, library.mediaType, updateItems]
  )

  useSocketEvent<MediaItemShare>('share_open', handleShareOpen)
  useSocketEvent<MediaItemShare>('share_closed', handleShareClosed)

  // Socket listeners for RSS feed updates
  // Relevant for entity types that can be published via RSS
  const handleRssFeedOpen = useCallback(
    (rssFeed: RssFeed) => {
      if (entityType !== 'items' && entityType !== 'series' && entityType !== 'collections') return

      updateItems((item) => {
        if (item.id !== rssFeed.entityId) return item
        return { ...item, rssFeed } as BookshelfEntity
      })
    },
    [entityType, updateItems]
  )

  const handleRssFeedClosed = useCallback(
    (rssFeed: RssFeed) => {
      if (entityType !== 'items' && entityType !== 'series' && entityType !== 'collections') return

      updateItems((item) => {
        if (item.id !== rssFeed.entityId) return item
        return { ...item, rssFeed: undefined } as BookshelfEntity
      })
    },
    [entityType, updateItems]
  )

  useSocketEvent<RssFeed>('rss_feed_open', handleRssFeedOpen)
  useSocketEvent<RssFeed>('rss_feed_closed', handleRssFeedClosed)

  return {
    ...state,
    loadPage
  }
}
