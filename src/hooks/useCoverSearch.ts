import { useSocket, useSocketEmit, useSocketEvent } from '@/contexts/SocketContext'
import { useCallback, useRef, useState } from 'react'

interface CoverSearchResultData {
  requestId: string
  covers: string[]
}

interface CoverSearchCompleteData {
  requestId: string
}

interface CoverSearchErrorData {
  requestId: string
  error: string
}

interface CoverSearchProviderErrorData {
  requestId: string
  provider: string
  error: string
}

interface CoverSearchCancelledData {
  requestId: string
}

interface SearchCoversParams {
  title: string
  author: string
  provider: string
  podcast: boolean
}

interface SearchCoversRequest extends SearchCoversParams {
  requestId: string
}

interface UseCoverSearchReturn {
  coversFound: string[]
  searchInProgress: boolean
  hasSearched: boolean
  searchCovers: (params: SearchCoversParams) => void
  cancelSearch: () => void
  resetSearch: () => void
}

/**
 * Hook to manage cover search via WebSocket
 */
export function useCoverSearch(onError: (message: string) => void): UseCoverSearchReturn {
  const { isConnected } = useSocket()
  const { emit } = useSocketEmit()
  const [coversFound, setCoversFound] = useState<string[]>([])
  const [searchInProgress, setSearchInProgress] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const currentSearchRequestIdRef = useRef<string | null>(null)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  // Generate unique request ID
  const generateRequestId = useCallback(() => {
    return `cover-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const clearActiveSearch = useCallback(() => {
    currentSearchRequestIdRef.current = null
    setSearchInProgress(false)
  }, [])

  // Socket event handlers — use ref for request ID so handlers stay stable and
  // always read the latest value (avoids stale closures during long-running searches).
  const handleSearchResult = useCallback((data: CoverSearchResultData) => {
    if (data.requestId !== currentSearchRequestIdRef.current) return

    setCoversFound((prev) => {
      const newCovers = data.covers.filter((cover) => !prev.includes(cover))
      return [...prev, ...newCovers]
    })
  }, [])

  const handleSearchComplete = useCallback(
    (data: CoverSearchCompleteData) => {
      if (data.requestId !== currentSearchRequestIdRef.current) return
      clearActiveSearch()
    },
    [clearActiveSearch]
  )

  const handleSearchError = useCallback(
    (data: CoverSearchErrorData) => {
      if (data.requestId !== currentSearchRequestIdRef.current) return

      console.error('[Cover Search] Search error:', data.error)
      onErrorRef.current('Cover search failed')
      clearActiveSearch()
    },
    [clearActiveSearch]
  )

  const handleProviderError = useCallback((data: CoverSearchProviderErrorData) => {
    if (data.requestId !== currentSearchRequestIdRef.current) return

    console.warn(`[Cover Search] Provider ${data.provider} failed:`, data.error)
  }, [])

  const handleSearchCancelled = useCallback(
    (data: CoverSearchCancelledData) => {
      if (data.requestId !== currentSearchRequestIdRef.current) return
      clearActiveSearch()
    },
    [clearActiveSearch]
  )

  const handleSocketDisconnect = useCallback(() => {
    if (currentSearchRequestIdRef.current) {
      clearActiveSearch()
    }
  }, [clearActiveSearch])

  // Setup socket listeners using useSocketEvent
  useSocketEvent<CoverSearchResultData>('cover_search_result', handleSearchResult)
  useSocketEvent<CoverSearchCompleteData>('cover_search_complete', handleSearchComplete)
  useSocketEvent<CoverSearchErrorData>('cover_search_error', handleSearchError)
  useSocketEvent<CoverSearchProviderErrorData>('cover_search_provider_error', handleProviderError)
  useSocketEvent<CoverSearchCancelledData>('cover_search_cancelled', handleSearchCancelled)
  useSocketEvent('disconnect', handleSocketDisconnect)

  // Cancel current search — always reset UI immediately, then notify server
  const cancelSearch = useCallback(() => {
    const requestId = currentSearchRequestIdRef.current
    clearActiveSearch()

    if (requestId && isConnected) {
      emit<string>('cancel_cover_search', requestId)
    }
  }, [isConnected, emit, clearActiveSearch])

  // Start a new search
  const searchCovers = useCallback(
    (params: SearchCoversParams) => {
      if (!isConnected) {
        console.error('[Cover Search] Socket not connected')
        onErrorRef.current('Connection not available')
        return
      }

      // Cancel any existing search on the server without clearing the in-progress UI
      const previousRequestId = currentSearchRequestIdRef.current
      if (previousRequestId) {
        emit<string>('cancel_cover_search', previousRequestId)
      }

      setCoversFound([])
      setHasSearched(true)
      setSearchInProgress(true)

      const requestId = generateRequestId()
      currentSearchRequestIdRef.current = requestId

      emit<SearchCoversRequest>('search_covers', {
        requestId,
        title: params.title,
        author: params.author,
        provider: params.provider,
        podcast: params.podcast
      })
    },
    [isConnected, generateRequestId, emit]
  )

  // Reset search state
  const resetSearch = useCallback(() => {
    setCoversFound([])
    setHasSearched(false)
    currentSearchRequestIdRef.current = null
    setSearchInProgress(false)
  }, [])

  return {
    coversFound,
    searchInProgress,
    hasSearched,
    searchCovers,
    cancelSearch,
    resetSearch
  }
}
