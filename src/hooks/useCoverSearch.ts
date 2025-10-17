import { useSocket, useSocketEmit, useSocketEvent } from '@/contexts/SocketContext'
import { useCallback, useState } from 'react'

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
  const [currentSearchRequestId, setCurrentSearchRequestId] = useState<string | null>(null)

  // Generate unique request ID
  const generateRequestId = useCallback(() => {
    return `cover-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Socket event handlers
  const handleSearchResult = useCallback(
    (data: CoverSearchResultData) => {
      if (data.requestId !== currentSearchRequestId) return

      // Add new covers to the list (avoiding duplicates)
      setCoversFound((prev) => {
        const newCovers = data.covers.filter((cover) => !prev.includes(cover))
        return [...prev, ...newCovers]
      })
    },
    [currentSearchRequestId]
  )

  const handleSearchComplete = useCallback(
    (data: CoverSearchCompleteData) => {
      if (data.requestId !== currentSearchRequestId) return

      setSearchInProgress(false)
      setCurrentSearchRequestId(null)
    },
    [currentSearchRequestId]
  )

  const handleSearchError = useCallback(
    (data: CoverSearchErrorData) => {
      if (data.requestId !== currentSearchRequestId) return

      console.error('[Cover Search] Search error:', data.error)
      onError('Cover search failed')
      setSearchInProgress(false)
      setCurrentSearchRequestId(null)
    },
    [currentSearchRequestId, onError]
  )

  const handleProviderError = useCallback(
    (data: CoverSearchProviderErrorData) => {
      if (data.requestId !== currentSearchRequestId) return

      console.warn(`[Cover Search] Provider ${data.provider} failed:`, data.error)
    },
    [currentSearchRequestId]
  )

  const handleSearchCancelled = useCallback(
    (data: CoverSearchCancelledData) => {
      if (data.requestId !== currentSearchRequestId) return

      setSearchInProgress(false)
      setCurrentSearchRequestId(null)
    },
    [currentSearchRequestId]
  )

  const handleSocketDisconnect = useCallback(() => {
    // If we were in the middle of a search, cancel it (server can't send results anymore)
    if (searchInProgress && currentSearchRequestId) {
      setSearchInProgress(false)
      setCurrentSearchRequestId(null)
    }
  }, [searchInProgress, currentSearchRequestId])

  // Setup socket listeners using useSocketEvent
  useSocketEvent<CoverSearchResultData>('cover_search_result', handleSearchResult)
  useSocketEvent<CoverSearchCompleteData>('cover_search_complete', handleSearchComplete)
  useSocketEvent<CoverSearchErrorData>('cover_search_error', handleSearchError)
  useSocketEvent<CoverSearchProviderErrorData>('cover_search_provider_error', handleProviderError)
  useSocketEvent<CoverSearchCancelledData>('cover_search_cancelled', handleSearchCancelled)
  useSocketEvent('disconnect', handleSocketDisconnect)

  // Cancel current search
  const cancelSearch = useCallback(() => {
    if (!currentSearchRequestId || !isConnected) {
      console.error('[Cover Search] Socket not connected')
      onError('Connection not available')
      return
    }

    console.log('cancelSearch: Cancelling search', currentSearchRequestId)
    emit('cancel_cover_search', currentSearchRequestId)
    setCurrentSearchRequestId(null)
    setSearchInProgress(false)
  }, [currentSearchRequestId, isConnected, emit, onError])

  // Start a new search
  const searchCovers = useCallback(
    (params: SearchCoversParams) => {
      if (!isConnected) {
        console.error('[Cover Search] Socket not connected')
        onError('Connection not available')
        return
      }

      // Cancel any existing search
      if (searchInProgress && currentSearchRequestId) {
        cancelSearch()
      }

      // Clear previous results
      setCoversFound([])
      setHasSearched(true)
      setSearchInProgress(true)

      // Generate unique request ID
      const requestId = generateRequestId()
      setCurrentSearchRequestId(requestId)

      // Emit search request via WebSocket
      emit('search_covers', {
        requestId,
        title: params.title,
        author: params.author,
        provider: params.provider,
        podcast: params.podcast
      })
    },
    [isConnected, searchInProgress, currentSearchRequestId, cancelSearch, generateRequestId, emit, onError]
  )

  // Reset search state
  const resetSearch = useCallback(() => {
    setCoversFound([])
    setHasSearched(false)
    setSearchInProgress(false)
    setCurrentSearchRequestId(null)
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
