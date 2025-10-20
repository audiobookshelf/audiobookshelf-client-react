'use client'

import { getMetadataProvidersAction } from '@/app/actions/providerActions'
import { MetadataProvider as MetadataProviderType } from '@/types/api'
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useSocketEvent } from './SocketContext'

interface MetadataState {
  bookProviders: MetadataProviderType[]
  podcastProviders: MetadataProviderType[]
  bookCoverProviders: MetadataProviderType[]
  podcastCoverProviders: MetadataProviderType[]
  providersLoaded: boolean
  isLoading: boolean
}

interface MetadataContextType extends MetadataState {
  ensureProvidersLoaded: () => Promise<void>
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
    providersLoaded: false,
    isLoading: false
  })

  // Fetch all providers (internal method)
  const fetchProviders = useCallback(
    async (force = false) => {
      // Only fetch if not already loaded (unless forced)
      if (state.providersLoaded && !force) {
        return
      }

      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const result = await getMetadataProvidersAction()

        if (result.error) {
          console.error('Failed to fetch providers:', result.error)
          setState((prev) => ({ ...prev, isLoading: false }))
          return
        }

        if (result.data?.providers) {
          setState({
            bookProviders: result.data.providers.books || [],
            podcastProviders: result.data.providers.podcasts || [],
            bookCoverProviders: result.data.providers.booksCovers || [],
            // Use same as podcasts for podcast covers per Vue client pattern
            podcastCoverProviders: result.data.providers.podcasts || [],
            providersLoaded: true,
            isLoading: false
          })
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error)
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [state.providersLoaded]
  )

  // Ensure providers are loaded (lazy load on first use)
  const ensureProvidersLoaded = useCallback(async () => {
    await fetchProviders(false)
  }, [fetchProviders])

  // Force refresh providers (for socket events and manual refresh)
  const refreshProviders = useCallback(async () => {
    // Only refresh if providers were already loaded
    if (!state.providersLoaded) {
      return
    }
    await fetchProviders(true)
  }, [fetchProviders, state.providersLoaded])

  // Handle custom metadata provider added
  const handleProviderAdded = useCallback(
    (event: CustomMetadataProviderEvent) => {
      if (!event?.id) return

      console.log('[Metadata] Custom metadata provider added:', event)
      // Force refresh all providers
      refreshProviders()
    },
    [refreshProviders]
  )

  // Handle custom metadata provider removed
  const handleProviderRemoved = useCallback(
    (event: CustomMetadataProviderEvent) => {
      if (!event?.id) return

      console.log('[Metadata] Custom metadata provider removed:', event)
      // Force refresh all providers
      refreshProviders()
    },
    [refreshProviders]
  )

  // Setup websocket listeners
  useSocketEvent<CustomMetadataProviderEvent>('custom_metadata_provider_added', handleProviderAdded)
  useSocketEvent<CustomMetadataProviderEvent>('custom_metadata_provider_removed', handleProviderRemoved)

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<MetadataContextType>(
    () => ({
      ...state,
      ensureProvidersLoaded,
      refreshProviders
    }),
    [state, ensureProvidersLoaded, refreshProviders]
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
