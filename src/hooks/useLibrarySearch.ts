'use client'

import { getCurrentUserAction, getLibrariesAction, searchLibraryAction } from '@/app/actions/searchActions'
import { useSocketEvent } from '@/contexts/SocketContext'
import { BookLibraryItem, Library, LibraryItem, PodcastLibraryItem, SearchLibraryResponse, User } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'

export interface UseLibrarySearchOptions {
  autoSelectFirst?: boolean
  mediaTypes?: ('book' | 'podcast')[]
}

export interface UseLibrarySearchReturn {
  // Data
  user: User | null
  libraries: Library[]
  searchResults: SearchLibraryResponse | null

  // State
  isLoading: boolean
  loadError: string | null
  isSearching: boolean
  searchError: string | null
  processing: boolean

  // Search params
  selectedLibraryId: string
  searchQuery: string

  // Selected items
  selectedBook: BookLibraryItem | null
  selectedPodcast: PodcastLibraryItem | null

  // Actions
  setSelectedLibraryId: (id: string) => void
  setSearchQuery: (query: string) => void
  handleSearch: () => Promise<void>
  setProcessing: (processing: boolean) => void
  clearSelection: () => void
}

export function useLibrarySearch(options: UseLibrarySearchOptions = {}): UseLibrarySearchReturn {
  const { autoSelectFirst = true, mediaTypes = ['book', 'podcast'] } = options

  // Data fetching state
  const [user, setUser] = useState<User | null>(null)
  const [libraries, setLibraries] = useState<Library[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Search state
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchLibraryResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Selected items
  const [selectedBook, setSelectedBook] = useState<BookLibraryItem | null>(null)
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastLibraryItem | null>(null)

  // Listen for item updates via WebSocket
  const handleItemUpdated = useCallback(
    (updatedItem: LibraryItem) => {
      if (selectedBook && updatedItem.id === selectedBook.id) {
        setSelectedBook(updatedItem as BookLibraryItem)
      }
      if (selectedPodcast && updatedItem.id === selectedPodcast.id) {
        setSelectedPodcast(updatedItem as PodcastLibraryItem)
      }
    },
    [selectedBook, selectedPodcast]
  )

  useSocketEvent<LibraryItem>('item_updated', handleItemUpdated)

  // Fetch user and libraries on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [userData, librariesData] = await Promise.all([getCurrentUserAction(), getLibrariesAction()])

        if (userData.error) {
          setLoadError(userData.error)
          return
        }

        if (userData.data?.user) {
          setUser(userData.data.user)
        }

        const libs = librariesData.data?.libraries || []
        setLibraries(libs)
        if (libs.length > 0) {
          setSelectedLibraryId(libs[0].id)
        }

        if (librariesData.error) {
          setLoadError(librariesData.error)
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !selectedLibraryId) return

    setIsSearching(true)
    setSearchError(null)
    // Clear current selection when starting a new search
    setSelectedBook(null)
    setSelectedPodcast(null)

    try {
      const result = await searchLibraryAction(selectedLibraryId, searchQuery.trim(), 10)

      if (result.error) {
        setSearchError(result.error)
        setSearchResults(null)
      } else if (result.data) {
        setSearchResults(result.data)

        // Auto-select first item based on media types
        if (autoSelectFirst) {
          const firstBook = result.data.book?.[0]?.libraryItem as BookLibraryItem | undefined
          const firstPodcast = result.data.podcast?.[0]?.libraryItem as PodcastLibraryItem | undefined

          if (mediaTypes.includes('book') && firstBook) {
            setSelectedBook(firstBook)
            setSelectedPodcast(null)
          } else if (mediaTypes.includes('podcast') && firstPodcast) {
            setSelectedPodcast(firstPodcast)
            setSelectedBook(null)
          } else {
            setSelectedBook(null)
            setSelectedPodcast(null)
          }
        } else {
          setSelectedBook(null)
          setSelectedPodcast(null)
        }
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to search')
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, selectedLibraryId, autoSelectFirst, mediaTypes])

  const clearSelection = useCallback(() => {
    setSelectedBook(null)
    setSelectedPodcast(null)
    setSearchResults(null)
    setSearchQuery('')
  }, [])

  return {
    // Data
    user,
    libraries,
    searchResults,

    // State
    isLoading,
    loadError,
    isSearching,
    searchError,
    processing,

    // Search params
    selectedLibraryId,
    searchQuery,

    // Selected items
    selectedBook,
    selectedPodcast,

    // Actions
    setSelectedLibraryId,
    setSearchQuery,
    handleSearch,
    setProcessing,
    clearSelection
  }
}
