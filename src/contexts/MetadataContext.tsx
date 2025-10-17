'use client'

import {
  getAuthorProvidersAction,
  getBookCoverProvidersAction,
  getBookProvidersAction,
  getChapterProvidersAction,
  getPodcastCoverProvidersAction,
  getPodcastProvidersAction
} from '@/app/actions/providerActions'
import { MetadataProvider as MetadataProviderType } from '@/types/api'
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSocketEvent } from './SocketContext'

interface MetadataState {
  bookProviders: MetadataProviderType[]
  podcastProviders: MetadataProviderType[]
  bookCoverProviders: MetadataProviderType[]
  podcastCoverProviders: MetadataProviderType[]
  authorProviders: MetadataProviderType[]
  chapterProviders: MetadataProviderType[]
  isLoading: boolean
}

interface MetadataContextType extends MetadataState {
  refreshProviders: () => Promise<void>
}

interface CustomMetadataProviderEvent {
  id: string
  mediaType: 'book' | 'podcast'
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined)

interface MetadataProviderProps {
  children: ReactNode
}

export function MetadataProvider({ children }: MetadataProviderProps) {
  const [state, setState] = useState<MetadataState>({
    bookProviders: [],
    podcastProviders: [],
    bookCoverProviders: [],
    podcastCoverProviders: [],
    authorProviders: [],
    chapterProviders: [],
    isLoading: true
  })

  // Fetch all providers
  const fetchAllProviders = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const [bookResult, podcastResult, bookCoverResult, podcastCoverResult, authorResult, chapterResult] = await Promise.all([
        getBookProvidersAction(),
        getPodcastProvidersAction(),
        getBookCoverProvidersAction(),
        getPodcastCoverProvidersAction(),
        getAuthorProvidersAction(),
        getChapterProvidersAction()
      ])

      // Log errors but don't break the app
      if (bookResult.error) console.error('Failed to fetch book providers:', bookResult.error)
      if (podcastResult.error) console.error('Failed to fetch podcast providers:', podcastResult.error)
      if (bookCoverResult.error) console.error('Failed to fetch book cover providers:', bookCoverResult.error)
      if (podcastCoverResult.error) console.error('Failed to fetch podcast cover providers:', podcastCoverResult.error)
      if (authorResult.error) console.error('Failed to fetch author providers:', authorResult.error)
      if (chapterResult.error) console.error('Failed to fetch chapter providers:', chapterResult.error)

      setState({
        bookProviders: bookResult.data?.providers || [],
        podcastProviders: podcastResult.data?.providers || [],
        bookCoverProviders: bookCoverResult.data?.providers || [],
        podcastCoverProviders: podcastCoverResult.data?.providers || [],
        authorProviders: authorResult.data?.providers || [],
        chapterProviders: chapterResult.data?.providers || [],
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Fetch book-related providers
  const fetchBookProviders = useCallback(async () => {
    try {
      const [bookResult, bookCoverResult] = await Promise.all([getBookProvidersAction(), getBookCoverProvidersAction()])

      if (bookResult.error) console.error('Failed to fetch book providers:', bookResult.error)
      if (bookCoverResult.error) console.error('Failed to fetch book cover providers:', bookCoverResult.error)

      setState((prev) => ({
        ...prev,
        bookProviders: bookResult.data?.providers || prev.bookProviders,
        bookCoverProviders: bookCoverResult.data?.providers || prev.bookCoverProviders
      }))
    } catch (error) {
      console.error('Failed to refetch book providers:', error)
    }
  }, [])

  // Fetch podcast-related providers
  const fetchPodcastProviders = useCallback(async () => {
    try {
      const [podcastResult, podcastCoverResult] = await Promise.all([getPodcastProvidersAction(), getPodcastCoverProvidersAction()])

      if (podcastResult.error) console.error('Failed to fetch podcast providers:', podcastResult.error)
      if (podcastCoverResult.error) console.error('Failed to fetch podcast cover providers:', podcastCoverResult.error)

      setState((prev) => ({
        ...prev,
        podcastProviders: podcastResult.data?.providers || prev.podcastProviders,
        podcastCoverProviders: podcastCoverResult.data?.providers || prev.podcastCoverProviders
      }))
    } catch (error) {
      console.error('Failed to refetch podcast providers:', error)
    }
  }, [])

  // Handle custom metadata provider added
  const handleProviderAdded = useCallback(
    (event: CustomMetadataProviderEvent) => {
      if (!event?.id) return

      console.log('[Metadata] Custom metadata provider added:', event)

      if (event.mediaType === 'book') {
        fetchBookProviders()
      } else if (event.mediaType === 'podcast') {
        fetchPodcastProviders()
      }
    },
    [fetchBookProviders, fetchPodcastProviders]
  )

  // Handle custom metadata provider removed
  const handleProviderRemoved = useCallback(
    (event: CustomMetadataProviderEvent) => {
      if (!event?.id) return

      console.log('[Metadata] Custom metadata provider removed:', event)

      if (event.mediaType === 'book') {
        fetchBookProviders()
      } else if (event.mediaType === 'podcast') {
        fetchPodcastProviders()
      }
    },
    [fetchBookProviders, fetchPodcastProviders]
  )

  // Setup websocket listeners
  useSocketEvent<CustomMetadataProviderEvent>('custom_metadata_provider_added', handleProviderAdded)
  useSocketEvent<CustomMetadataProviderEvent>('custom_metadata_provider_removed', handleProviderRemoved)

  // Initial fetch on mount
  useEffect(() => {
    fetchAllProviders()
  }, [fetchAllProviders])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<MetadataContextType>(
    () => ({
      ...state,
      refreshProviders: fetchAllProviders
    }),
    [state, fetchAllProviders]
  )

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>
}

// Main hook to access all providers
export function useMetadata() {
  const context = useContext(MetadataContext)
  if (context === undefined) {
    throw new Error('useMetadata must be used within a MetadataProvider')
  }
  return context
}

// Convenience hooks for specific provider types
export function useBookProviders(): MetadataProviderType[] {
  const { bookProviders } = useMetadata()
  return useMemo(() => bookProviders, [bookProviders])
}

export function usePodcastProviders(): MetadataProviderType[] {
  const { podcastProviders } = useMetadata()
  return useMemo(() => podcastProviders, [podcastProviders])
}

export function useBookCoverProviders(): MetadataProviderType[] {
  const { bookCoverProviders } = useMetadata()
  return useMemo(() => bookCoverProviders, [bookCoverProviders])
}

export function usePodcastCoverProviders(): MetadataProviderType[] {
  const { podcastCoverProviders } = useMetadata()
  return useMemo(() => podcastCoverProviders, [podcastCoverProviders])
}

export function useAuthorProviders(): MetadataProviderType[] {
  const { authorProviders } = useMetadata()
  return useMemo(() => authorProviders, [authorProviders])
}

export function useChapterProviders(): MetadataProviderType[] {
  const { chapterProviders } = useMetadata()
  return useMemo(() => chapterProviders, [chapterProviders])
}
