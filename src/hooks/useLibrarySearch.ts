'use client'

import { getCollectionsAction, getPlaylistsAction, searchLibraryAction } from '@/app/actions/searchActions'
import { useSocketEvent } from '@/contexts/SocketContext'
import { Author, BookLibraryItem, Collection, LibraryItem, Playlist, PodcastLibraryItem, SearchLibraryResponse, Series } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'

export interface UseLibrarySearchOptions {
  autoSelectFirst?: boolean
  mediaTypes?: ('book' | 'podcast')[]
  libraryId?: string
}

export interface UseLibrarySearchReturn {
  // Data
  searchResults: SearchLibraryResponse | null

  // State
  isSearching: boolean
  searchError: string | null
  processing: boolean

  // Search params
  selectedLibraryId: string
  searchQuery: string

  // Selected items
  selectedBook: BookLibraryItem | null
  selectedPodcast: PodcastLibraryItem | null
  selectedCollection: Collection | null
  selectedPlaylist: Playlist | null
  selectedSeries: { series: Series; books: LibraryItem[] } | null
  selectedAuthor: Author | null

  // Actions
  setSelectedLibraryId: (id: string) => void
  setSearchQuery: (query: string) => void
  handleSearch: () => Promise<void>
  setProcessing: (processing: boolean) => void
  clearSelection: () => void
  setSelectedCollection: (collection: Collection | null) => void
  setSelectedPlaylist: (playlist: Playlist | null) => void
  setSelectedSeries: (series: { series: Series; books: LibraryItem[] } | null) => void
  setSelectedAuthor: (author: Author | null) => void
}

const DEFAULT_MEDIA_TYPES: ('book' | 'podcast')[] = ['book', 'podcast']

export function useLibrarySearch(options: UseLibrarySearchOptions = {}): UseLibrarySearchReturn {
  const { autoSelectFirst = true, mediaTypes = DEFAULT_MEDIA_TYPES, libraryId } = options

  // Search state
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>(libraryId || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchLibraryResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Selected items
  const [selectedBook, setSelectedBook] = useState<BookLibraryItem | null>(null)
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastLibraryItem | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<{ series: Series; books: LibraryItem[] } | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)

  // Cached collections and playlists for client-side filtering
  const [cachedCollections, setCachedCollections] = useState<Collection[]>([])
  const [cachedPlaylists, setCachedPlaylists] = useState<Playlist[]>([])

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

  // Sync selectedLibraryId with libraryId prop if it changes
  useEffect(() => {
    if (libraryId) {
      setSelectedLibraryId(libraryId)
    }
  }, [libraryId])

  // Track if collections/playlists have been fetched for current library
  const [hasFetchedExtras, setHasFetchedExtras] = useState(false)

  // Reset fetch flag when library changes
  useEffect(() => {
    if (selectedLibraryId) {
      setHasFetchedExtras(false)
      setCachedCollections([])
      setCachedPlaylists([])
    }
  }, [selectedLibraryId])

  // Fetch collections and playlists on-demand (called before first search)
  const fetchCollectionsAndPlaylists = useCallback(async () => {
    if (hasFetchedExtras || !selectedLibraryId) return

    try {
      const [collectionsResponse, playlistsResponse] = await Promise.all([getCollectionsAction(selectedLibraryId), getPlaylistsAction(selectedLibraryId)])

      setCachedCollections(collectionsResponse?.results || [])
      setCachedPlaylists(playlistsResponse?.results || [])
      setHasFetchedExtras(true)
    } catch (error) {
      // Silently fail - collections/playlists are supplementary search data
      console.error('Failed to fetch collections/playlists:', error)
      setCachedCollections([])
      setCachedPlaylists([])
      setHasFetchedExtras(true) // Don't retry on failure
    }
  }, [selectedLibraryId, hasFetchedExtras])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !selectedLibraryId) return

    setIsSearching(true)
    setSearchError(null)
    // Clear current selection when starting a new search
    setSelectedBook(null)
    setSelectedPodcast(null)
    setSelectedCollection(null)
    setSelectedPlaylist(null)
    setSelectedSeries(null)
    setSelectedAuthor(null)

    try {
      // Fetch collections/playlists on-demand if not yet fetched
      await fetchCollectionsAndPlaylists()

      const result = await searchLibraryAction(selectedLibraryId, searchQuery.trim(), 10)

      if (result) {
        // Client-side filter collections and playlists by name
        const queryLower = searchQuery.trim().toLowerCase()
        const filteredCollections = cachedCollections.filter((c) => c.name.toLowerCase().includes(queryLower))
        const filteredPlaylists = cachedPlaylists.filter((p) => p.name.toLowerCase().includes(queryLower))

        // Merge server results with client-side filtered collections/playlists
        const mergedResults: SearchLibraryResponse = {
          ...result,
          collections: filteredCollections,
          playlists: filteredPlaylists
        }

        setSearchResults(mergedResults)

        // Auto-select first item based on media types
        if (autoSelectFirst) {
          const firstBook = result.book?.[0]?.libraryItem as BookLibraryItem | undefined
          const firstPodcast = result.podcast?.[0]?.libraryItem as PodcastLibraryItem | undefined

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

          // Auto-select first series, collection, and playlist if found
          const firstSeries = result.series?.[0]
          if (firstSeries) {
            setSelectedSeries(firstSeries)
          }

          const firstCollection = filteredCollections[0]
          if (firstCollection) {
            setSelectedCollection(firstCollection)
          }

          const firstPlaylist = filteredPlaylists[0]
          if (firstPlaylist) {
            setSelectedPlaylist(firstPlaylist)
          }

          const firstAuthor = result.authors?.[0]
          if (firstAuthor) {
            setSelectedAuthor(firstAuthor)
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
  }, [searchQuery, selectedLibraryId, autoSelectFirst, mediaTypes, cachedCollections, cachedPlaylists, fetchCollectionsAndPlaylists])

  const clearSelection = useCallback(() => {
    setSelectedBook(null)
    setSelectedPodcast(null)
    setSelectedCollection(null)
    setSelectedPlaylist(null)
    setSelectedSeries(null)
    setSelectedAuthor(null)
    setSearchResults(null)
    setSearchQuery('')
  }, [])

  return {
    // Data
    searchResults,

    // State
    isSearching,
    searchError,
    processing,

    // Search params
    selectedLibraryId,
    searchQuery,

    // Selected items
    selectedBook,
    selectedPodcast,
    selectedCollection,
    selectedPlaylist,
    selectedSeries,
    selectedAuthor,

    // Actions
    setSelectedLibraryId,
    setSearchQuery,
    handleSearch,
    setProcessing,
    clearSelection,
    setSelectedCollection,
    setSelectedPlaylist,
    setSelectedSeries,
    setSelectedAuthor
  }
}
