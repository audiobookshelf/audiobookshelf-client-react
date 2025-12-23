import { fetchLibraryItemsAction } from '@/app/actions/libraryActions'
import { LibraryItem } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseBookshelfDataProps {
  libraryId: string
  query: string // URLSearchParams string
  initialTotal?: number
  itemsPerPage: number
}

interface BookshelfDataState {
  items: (LibraryItem | null)[]
  totalEntities: number
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
}

export function useBookshelfData({ libraryId, query, initialTotal = 0, itemsPerPage }: UseBookshelfDataProps) {
  const [state, setState] = useState<BookshelfDataState>({
    items: [],
    totalEntities: initialTotal,
    isInitialized: false,
    isLoading: false,
    error: null
  })

  const pagesLoadedRef = useRef<Set<number>>(new Set())
  const loadingPagesRef = useRef<Set<number>>(new Set())
  const itemsPerPageRef = useRef(itemsPerPage)

  // Reset when query changes
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
  }, [libraryId, query])

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
        const queryParams = `${fullQuery}limit=${currentItemsPerPage}&page=${page}&minified=1&include=rssfeed,numEpisodesIncomplete,share`

        const data = await fetchLibraryItemsAction(libraryId, queryParams)

        const results = data.results as LibraryItem[]
        const total = data.total as number

        setState((prev) => {
          let newItems = [...prev.items]
          if (!prev.isInitialized || prev.totalEntities !== total) {
            // Initialize sparse array
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
    [libraryId, query]
  )

  return {
    ...state,
    loadPage
  }
}
