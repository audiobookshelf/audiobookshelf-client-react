'use client'

import { getCollectionsAction, getPlaylistsAction, searchLibraryAction } from '@/app/actions/searchActions'
import { useSocketEvent } from '@/contexts/SocketContext'
import { Author, BookLibraryItem, Collection, LibraryItem, Playlist, PodcastLibraryItem, SearchLibraryResponse, Series } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'

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

type EntityCache<T> = {
  items: T[]
  hasFetched: boolean
  generation: number
}

function createEntityCache<T>(): EntityCache<T> {
  return { items: [], hasFetched: false, generation: 0 }
}

function invalidateEntityCache<T>(cache: EntityCache<T>, clearItems = false) {
  cache.generation += 1
  cache.hasFetched = false
  if (clearItems) cache.items = []
}

async function fetchEntityCache<T>(
  cache: EntityCache<T>,
  libraryId: string,
  load: (libraryId: string) => Promise<{ results?: T[] } | null | undefined>,
  label: string
): Promise<boolean> {
  if (cache.hasFetched || !libraryId) return true

  const generation = cache.generation
  try {
    const response = await load(libraryId)
    if (generation !== cache.generation) return false
    cache.items = response?.results || []
    cache.hasFetched = true
    return true
  } catch (error) {
    if (generation !== cache.generation) return false
    // Silently fail - collections/playlists are supplementary search data
    console.error(`Failed to fetch ${label}:`, error)
    cache.items = []
    cache.hasFetched = true // Don't retry on failure
    return true
  }
}

function filterEntitiesByName<T extends { name: string }>(items: T[], query: string): T[] {
  const queryLower = query.trim().toLowerCase()
  return items.filter((item) => item.name.toLowerCase().includes(queryLower))
}

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
  const collectionsCacheRef = useRef(createEntityCache<Collection>())
  const playlistsCacheRef = useRef(createEntityCache<Playlist>())
  const searchQueryRef = useRef(searchQuery)
  searchQueryRef.current = searchQuery

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

  // Reset caches when library changes
  useEffect(() => {
    if (selectedLibraryId) {
      invalidateEntityCache(collectionsCacheRef.current, true)
      invalidateEntityCache(playlistsCacheRef.current, true)
    }
  }, [selectedLibraryId])

  const fetchCollections = useCallback(async () => {
    return fetchEntityCache(collectionsCacheRef.current, selectedLibraryId, getCollectionsAction, 'collections')
  }, [selectedLibraryId])

  const fetchPlaylists = useCallback(async () => {
    return fetchEntityCache(playlistsCacheRef.current, selectedLibraryId, getPlaylistsAction, 'playlists')
  }, [selectedLibraryId])

  const handleCollectionsUpdated = useCallback(
    (collection: Collection) => {
      if (collection.libraryId !== selectedLibraryId) return
      invalidateEntityCache(collectionsCacheRef.current)

      const query = searchQueryRef.current.trim()
      if (!query) return

      void (async () => {
        const committed = await fetchCollections()
        if (!committed || searchQueryRef.current.trim() !== query) return

        const collections = filterEntitiesByName(collectionsCacheRef.current.items, query)
        setSearchResults((prev) => (prev ? { ...prev, collections } : prev))
      })()
    },
    [selectedLibraryId, fetchCollections]
  )

  const handlePlaylistsUpdated = useCallback(
    (playlist: Playlist) => {
      if (playlist.libraryId !== selectedLibraryId) return
      invalidateEntityCache(playlistsCacheRef.current)

      const query = searchQueryRef.current.trim()
      if (!query) return

      void (async () => {
        const committed = await fetchPlaylists()
        if (!committed || searchQueryRef.current.trim() !== query) return

        const playlists = filterEntitiesByName(playlistsCacheRef.current.items, query)
        setSearchResults((prev) => (prev ? { ...prev, playlists } : prev))
      })()
    },
    [selectedLibraryId, fetchPlaylists]
  )

  useSocketEvent<Collection>('collection_added', handleCollectionsUpdated, [handleCollectionsUpdated])
  useSocketEvent<Collection>('collection_updated', handleCollectionsUpdated, [handleCollectionsUpdated])
  useSocketEvent<Collection>('collection_removed', handleCollectionsUpdated, [handleCollectionsUpdated])
  useSocketEvent<Playlist>('playlist_added', handlePlaylistsUpdated, [handlePlaylistsUpdated])
  useSocketEvent<Playlist>('playlist_updated', handlePlaylistsUpdated, [handlePlaylistsUpdated])
  useSocketEvent<Playlist>('playlist_removed', handlePlaylistsUpdated, [handlePlaylistsUpdated])

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
      // Fetch collections and playlists on-demand if not yet fetched
      await Promise.all([fetchCollections(), fetchPlaylists()])

      const result = await searchLibraryAction(selectedLibraryId, searchQuery.trim(), 10)

      if (result) {
        // Client-side filter collections and playlists by name
        const filteredCollections = filterEntitiesByName(collectionsCacheRef.current.items, searchQuery)
        const filteredPlaylists = filterEntitiesByName(playlistsCacheRef.current.items, searchQuery)

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
  }, [searchQuery, selectedLibraryId, autoSelectFirst, mediaTypes, fetchCollections, fetchPlaylists])

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
