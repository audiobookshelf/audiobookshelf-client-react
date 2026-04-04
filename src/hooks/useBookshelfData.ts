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

function buildPageQueryParams(entityType: EntityType, query: string, page: number, limit: number): string {
  const fullQuery = query ? `${query}&` : ''
  let queryParams = `${fullQuery}limit=${limit}&page=${page}&minified=1`
  if (entityType === 'items') {
    queryParams += '&include=rssfeed,numEpisodesIncomplete,share'
  }
  return queryParams
}

type BookshelfPageResults = { results: BookshelfEntity[]; total: number }

/** One bookshelf list API page: shared by `loadPage` and `reconcilePagesAfterUpdate`. */
async function fetchBookshelfPageData(entityType: EntityType, libraryId: string, query: string, page: number, limit: number): Promise<BookshelfPageResults> {
  const data = await fetchEntityData(entityType, libraryId, buildPageQueryParams(entityType, query, page, limit))
  const results = getResultsFromResponse(entityType, data)
  const total = (data as { total?: number }).total ?? results.length
  return { results, total }
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

  const invalidate = useCallback(() => {
    pagesLoadedRef.current.clear()
    loadingPagesRef.current.clear()
    setState({
      items: [],
      totalEntities: 0,
      isInitialized: false,
      isLoading: true,
      error: null
    })
  }, [])

  // Reset when query or entityType changes
  useEffect(() => {
    activeQueryRef.current = query
    invalidate()
  }, [libraryId, entityType, query, invalidate])

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

  /**
   * Side-fetch pages and merge into the existing sparse array without clearing the shelf.
   * After a reorder/filter shift or total change, `pagesLoadedRef` is replaced with only these pages
   * so other regions refetch. If every reconciled slot keeps the same id (metadata-only touch),
   * other loaded pages stay marked valid — only ids in `changedIds` get new object references.
   * Omit `changedIds` when every reconciled cell is filled or replaced by id (e.g. add/remove).
   */
  const reconcilePagesAfterUpdate = useCallback(
    async (pageNumbers: number[], changedIds?: Set<string>): Promise<{ total: number } | null> => {
      const limit = itemsPerPageRef.current
      if (limit <= 0 || pageNumbers.length === 0) return null

      const sortedPages = [...new Set(pageNumbers)].filter((p) => p >= 0).sort((a, b) => a - b)

      let newPageResults: BookshelfPageResults[]
      try {
        newPageResults = []
        for (const page of sortedPages) {
          newPageResults.push(await fetchBookshelfPageData(entityType, libraryId, query, page, limit))
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to reconcile bookshelf')
        console.error('reconcilePagesAfterUpdate', error)
        setState((prev) => ({ ...prev, error }))
        return null
      }

      if (query !== activeQueryRef.current) return null

      const total = newPageResults[0]?.total ?? 0

      let pagesToMark: number[] | null = null

      setState((prev) => {
        let nextItems: (BookshelfEntity | null)[]
        const structureChanged = total !== prev.totalEntities

        if (structureChanged) {
          nextItems = new Array(total).fill(null)
          for (let i = 0; i < Math.min(prev.items.length, total); i++) {
            nextItems[i] = prev.items[i] ?? null
          }
        } else {
          nextItems = [...prev.items]
        }

        // When true, list order/membership for reconciled pages matches what we already had (same id
        // per slot, same total, no holes cleared). Only touched items need new references — safe to
        // keep other pages in `pagesLoadedRef` instead of invalidating the whole cache.
        let keepOtherPagesLoaded = !structureChanged

        let cellChanged = false

        for (let pi = 0; pi < sortedPages.length; pi++) {
          const page = sortedPages[pi]
          const { results } = newPageResults[pi]
          const startIndex = page * limit
          const endIndex = Math.min(startIndex + limit, total)

          for (let i = startIndex; i < endIndex; i++) {
            const j = i - startIndex
            if (j < results.length) {
              const newItem = results[j]
              const old = nextItems[i]

              let assigned: BookshelfEntity
              if (!old) {
                assigned = newItem
                keepOtherPagesLoaded = false
              } else if (old.id !== newItem.id) {
                assigned = newItem
                keepOtherPagesLoaded = false
              } else if (changedIds?.has(old.id)) {
                assigned = newItem
              } else {
                assigned = old
              }

              if (assigned !== old) {
                nextItems[i] = assigned
                cellChanged = true
              }
            } else if (nextItems[i] != null) {
              console.log('This should not happen: index', i, 'item', nextItems[i])
              nextItems[i] = null
              cellChanged = true
              keepOtherPagesLoaded = false
            }
          }
        }

        if (!structureChanged && !cellChanged) return prev

        pagesToMark = keepOtherPagesLoaded ? null : sortedPages

        return {
          ...prev,
          items: nextItems,
          totalEntities: total,
          isInitialized: true,
          isLoading: false,
          error: null
        }
      })

      if (pagesToMark) {
        pagesLoadedRef.current = new Set(pagesToMark)
      }

      return { total }
    },
    [entityType, libraryId, query]
  )

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
        const { results, total } = await fetchBookshelfPageData(entityType, libraryId, query, page, currentItemsPerPage)

        if (query !== activeQueryRef.current) return

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
    loadPage,
    reconcilePagesAfterUpdate
  }
}
