'use client'

import { ContextType, fetchLibraryData } from '@/lib/fetchLibraryData'
import { BookshelfEntity, PersonalizedShelf } from '@/types/api'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/** Use as `limit` parameter to fetch all items in a single request */
export const FETCH_ALL = 0

interface ShelfData {
  items: Record<number, BookshelfEntity>
  total: number
  lastUpdated: number
}

// Internal context state
// TODO: Implement LRU (Least Recently Used) eviction to prevent unbounded memory growth
// Consider tracking access times and limiting total cache size
interface LibraryDataState {
  shelves: Record<string, ShelfData>
  loadingRanges: Record<string, Set<number>> // Track loading pages/indices to prevent dupes
  errors: Record<string, Error | null> // Track fetch errors per shelf key
}

export interface LibraryDataContextArgs {
  context: ContextType
  contextId?: string | null
  libraryId?: string
  params?: string | null
}

interface LibraryDataContextValue {
  state: LibraryDataState
  loadPage: (key: string, contextArgs: LibraryDataContextArgs, page: number, limit: number) => Promise<void>
  getItemAsync: (key: string, contextArgs: LibraryDataContextArgs, index: number) => Promise<BookshelfEntity | null>
  updateItem: (key: string, item: BookshelfEntity) => void
  removeItem: (key: string, itemId: string) => void
}

const LibraryDataContext = createContext<LibraryDataContextValue | null>(null)

export function LibraryDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LibraryDataState>({
    shelves: {},
    loadingRanges: {},
    errors: {}
  })

  // Ref to track ongoing fetches to prevent race conditions/dupes in async flows
  const fetchingRef = useRef<Record<string, Set<number>>>({})

  const generateKey = useCallback((contextName: string, contextId?: string | null, params?: string | null) => {
    const parts = [contextName]
    if (contextId) parts.push(contextId)
    if (params) parts.push(params)
    return parts.join(':')
  }, [])

  const registerItems = useCallback((key: string, newItems: BookshelfEntity[], startIndex: number, total: number) => {
    setState((prev) => {
      const existingShelf = prev.shelves[key] || { items: {}, total: 0, lastUpdated: 0 }
      const nextItems = { ...existingShelf.items }

      newItems.forEach((item, i) => {
        if (item) nextItems[startIndex + i] = item
      })

      return {
        ...prev,
        shelves: {
          ...prev.shelves,
          [key]: {
            items: nextItems,
            total,
            lastUpdated: Date.now()
          }
        }
      }
    })
  }, [])

  // Ref to sync state for async access in loadPage and getItemAsync
  const stateRef = useRef(state)
  stateRef.current = state

  const loadPage = useCallback(
    async (key: string, contextArgs: LibraryDataContextArgs, page: number, limit: number) => {
      // Check if already loading
      if (!fetchingRef.current[key]) fetchingRef.current[key] = new Set()
      if (fetchingRef.current[key].has(page)) return

      // Check if we already have ALL items for this page range
      const startIndex = page * limit
      const existingItems = (stateRef.current.shelves[key] || { items: {} }).items

      let hasAllItems = true
      if (limit > 0) {
        // For paginated request, ensure every item in the range [startIndex, startIndex + limit) exists
        // We also check against 'total' if known to avoid checking out of bounds?
        // But we don't know total accurately before we fetch, or we might have an old total.
        // Safest is: if we miss ANY item in the conceptual page, we fetch.
        // Optimization: checking up to limit or reasonable bound.
        for (let i = 0; i < limit; i++) {
          if (!existingItems[startIndex + i]) {
            // Check if we are past known total?
            // If we have total=45, and we ask for 50 (items 0-49). 45-49 won't exist.
            // But we should consider valid if we have up to 'total'.
            const knownTotal = stateRef.current.shelves[key]?.total ?? Infinity
            if (startIndex + i < knownTotal) {
              hasAllItems = false
              break
            }
          }
        }
      } else {
        // limit === 0 (fetch all).
        // We only skip if we are sure we have ALL. (total > 0 and Object.keys(items).length === total)
        const shelfData = stateRef.current.shelves[key]
        if (!shelfData || shelfData.total === 0 || Object.keys(shelfData.items).length < shelfData.total) {
          hasAllItems = false
        }
      }

      if (hasAllItems) return

      fetchingRef.current[key].add(page)

      // Update loading state in UI
      setState((prev) => ({
        ...prev,
        loadingRanges: {
          ...prev.loadingRanges,
          [key]: new Set([...(prev.loadingRanges[key] || []), page])
        }
      }))

      try {
        const result = await fetchLibraryData({
          context: contextArgs.context,
          contextId: contextArgs.contextId,
          libraryId: contextArgs.libraryId,
          params: contextArgs.params,
          page,
          limit
        })

        registerItems(key, result.items, startIndex, result.total)

        // Side effect: If fetching personalized dashboard (list of shelves), populate individual shelves
        if (contextArgs.context === 'personalized' && !contextArgs.contextId) {
          result.items.forEach((item) => {
            // Check if item looks like a shelf with entities
            // We use 'as any' or check properties because BookshelfEntity intersection might be tricky to narrow without type guard
            // But since we know it's personalized dashboard, it SHOULD be PersonalizedShelf
            const shelf = item as PersonalizedShelf
            if (shelf.id && shelf.entities) {
              const shelfKey = generateKey('personalized', shelf.id, null)
              registerItems(shelfKey, shelf.entities, 0, shelf.entities.length)
            }
          })
        }
      } catch (error) {
        console.error('Failed to load navigation items', error)
        setState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            [key]: error instanceof Error ? error : new Error(String(error))
          }
        }))
      } finally {
        fetchingRef.current[key]?.delete(page)
        setState((prev) => {
          const nextLoading = new Set(prev.loadingRanges[key])
          nextLoading.delete(page)
          return {
            ...prev,
            loadingRanges: {
              ...prev.loadingRanges,
              [key]: nextLoading
            }
          }
        })
      }
    },
    [registerItems, generateKey]
  )

  const getItemAsyncImpl = useCallback(
    async (key: string, contextArgs: LibraryDataContextArgs, index: number): Promise<BookshelfEntity | null> => {
      const shelf = stateRef.current.shelves[key]
      if (shelf?.items[index]) return shelf.items[index]

      try {
        const result = await fetchLibraryData({
          ...contextArgs,
          page: index, // If limit is 1, page is index
          limit: 1
        })
        if (result.items.length > 0) {
          // Register just this item
          registerItems(key, result.items, index, result.total)
          return result.items[0]
        }
      } catch (e) {
        console.error(e)
      }
      return null
    },
    [registerItems]
  )

  const updateItemImpl = useCallback((key: string, item: BookshelfEntity) => {
    setState((prev) => {
      const existingShelf = prev.shelves[key]
      if (!existingShelf) return prev

      // Find the index of the item in the shelf
      const itemIndex = Object.entries(existingShelf.items).find(([, i]) => i.id === item.id)?.[0]
      if (itemIndex === undefined) return prev

      return {
        ...prev,
        shelves: {
          ...prev.shelves,
          [key]: {
            ...existingShelf,
            items: {
              ...existingShelf.items,
              [itemIndex]: item
            }
          }
        }
      }
    })
  }, [])

  const removeItemImpl = useCallback((key: string, itemId: string) => {
    setState((prev) => {
      const existingShelf = prev.shelves[key]
      if (!existingShelf) return prev

      // Find and remove the item
      const nextItems = { ...existingShelf.items }
      Object.entries(nextItems).forEach(([index, item]) => {
        if (item.id === itemId) {
          delete nextItems[Number(index)]
        }
      })

      return {
        ...prev,
        shelves: {
          ...prev.shelves,
          [key]: {
            ...existingShelf,
            items: nextItems,
            total: existingShelf.total - 1
          }
        }
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      state,
      loadPage,
      getItemAsync: getItemAsyncImpl,
      updateItem: updateItemImpl,
      removeItem: removeItemImpl
    }),
    [state, loadPage, getItemAsyncImpl, updateItemImpl, removeItemImpl]
  )

  return <LibraryDataContext.Provider value={value}>{children}</LibraryDataContext.Provider>
}

/**
 * Scoped hook for accessing navigation context data.
 * @param context - The type of context (e.g., 'library', 'series', 'collection', 'playlist', 'personalized')
 * @param contextId - Optional ID for the specific context entity
 * @param params - Optional query parameters string
 * @param libraryId - The library ID
 * @param autoLoad - If true (default), automatically fetches all data on mount. Set to false for manual pagination control.
 */
export function useLibraryDataContext<T extends BookshelfEntity = BookshelfEntity>(
  context: ContextType,
  contextId?: string | null,
  params?: string | null,
  libraryId?: string,
  autoLoad = true
) {
  const ctx = useContext(LibraryDataContext)
  if (!ctx) throw new Error('useLibraryDataContext must be used within a LibraryDataProvider')

  const { state, loadPage, getItemAsync, updateItem: updateItemCtx, removeItem: removeItemCtx } = ctx

  // Generate key internally
  const key = useMemo(() => {
    const parts: string[] = [context]
    if (contextId) parts.push(contextId)
    if (params) parts.push(params)
    return parts.join(':')
  }, [context, contextId, params])

  const shelf = state.shelves[key]
  const loadingRange = state.loadingRanges[key]
  const loadingPages = useMemo(() => loadingRange || new Set<number>(), [loadingRange])

  // Automatically fetch initial data if shelf is missing
  useEffect(() => {
    // Only fetch if shelf is undefined (never loaded) and not currently loading page 0
    if (autoLoad && !shelf && !loadingPages.has(0)) {
      loadPage(key, { context, contextId, libraryId, params }, 0, FETCH_ALL)
    }
  }, [shelf, loadingPages, key, loadPage, context, contextId, libraryId, params, autoLoad])

  const load = useCallback(
    (page: number, limit: number) => {
      return loadPage(key, { context, contextId, libraryId, params }, page, limit)
    },
    [loadPage, key, context, contextId, libraryId, params]
  )

  const getItem = useCallback(
    (index: number) => {
      return getItemAsync(key, { context, contextId, libraryId, params }, index)
    },
    [getItemAsync, key, context, contextId, libraryId, params]
  )

  const getItemsArray = useCallback(
    () =>
      Object.entries(shelf?.items ?? {})
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, item]) => item as T),
    [shelf?.items]
  )

  const updateItem = useCallback(
    (item: T) => {
      updateItemCtx(key, item)
    },
    [updateItemCtx, key]
  )

  const removeItem = useCallback(
    (itemId: string) => {
      removeItemCtx(key, itemId)
    },
    [removeItemCtx, key]
  )

  const error = state.errors[key] ?? null

  return useMemo(
    () => ({
      items: (shelf ? shelf.items : {}) as Record<number, T>,
      total: shelf ? shelf.total : 0,
      isLoading: loadingPages.size > 0,
      loadingPages,
      error,
      load,
      getItem: getItem as (index: number) => Promise<T | null>,
      getItemsArray,
      updateItem,
      removeItem
    }),
    [shelf, loadingPages, error, load, getItem, getItemsArray, updateItem, removeItem]
  )
}
