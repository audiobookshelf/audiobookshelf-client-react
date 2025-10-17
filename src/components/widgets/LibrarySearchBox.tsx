'use client'

import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import TextInput from '@/components/ui/TextInput'
import { useLibrarySearch } from '@/hooks/useLibrarySearch'
import { BookLibraryItem, Library, PodcastLibraryItem } from '@/types/api'
import { useEffect } from 'react'

interface LibrarySearchBoxProps {
  mediaTypes?: ('book' | 'podcast')[]
  onBookSelect?: (book: BookLibraryItem | null) => void
  onPodcastSelect?: (podcast: PodcastLibraryItem | null) => void
  onClear?: () => void
  className?: string
}

export function LibrarySearchBox({ mediaTypes = ['book', 'podcast'], onBookSelect, onPodcastSelect, onClear, className = '' }: LibrarySearchBoxProps) {
  const {
    libraries,
    selectedLibraryId,
    searchQuery,
    searchResults,
    isLoading,
    loadError,
    isSearching,
    searchError,
    selectedBook,
    selectedPodcast,
    setSelectedLibraryId,
    setSearchQuery,
    handleSearch,
    clearSelection
  } = useLibrarySearch({
    autoSelectFirst: true,
    mediaTypes
  })

  // Notify parent components when items are selected or cleared
  useEffect(() => {
    if (onBookSelect) {
      onBookSelect(selectedBook)
    }
  }, [selectedBook, onBookSelect])

  useEffect(() => {
    if (onPodcastSelect) {
      onPodcastSelect(selectedPodcast)
    }
  }, [selectedPodcast, onPodcastSelect])

  const handleClear = () => {
    clearSelection()
    if (onClear) {
      onClear()
    }
  }

  if (isLoading) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-gray-400">Loading libraries...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={`p-4 border-2 border-error rounded-lg ${className}`}>
        <h3 className="text-xl font-semibold mb-4 text-error">Error Loading Libraries</h3>
        <p className="text-gray-400">{loadError}</p>
      </div>
    )
  }

  if (!Array.isArray(libraries) || libraries.length === 0) {
    return (
      <div className={`p-4 border-2 border-dashed border-gray-600 rounded-lg ${className}`}>
        <p className="text-gray-400">No libraries available. Please create a library first.</p>
      </div>
    )
  }

  const libraryItems = libraries.map((lib: Library) => ({
    text: lib.name,
    value: lib.id
  }))

  return (
    <div className={`mb-6 p-4 bg-bg/50 rounded-lg border border-primary/10 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Search Library Items</h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="w-full sm:w-52 sm:flex-shrink-0">
            <label className="text-sm font-medium mb-1 block">Library</label>
            <Dropdown items={libraryItems} value={selectedLibraryId} onChange={(value) => setSelectedLibraryId(String(value))} size="small" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Search Query</label>
            <TextInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Enter book title, author, podcast name, or keywords..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
            />
          </div>
          <Btn onClick={handleSearch} disabled={!searchQuery.trim() || isSearching} size="medium" className="w-full sm:w-auto">
            {isSearching ? 'Searching...' : 'Search'}
          </Btn>
        </div>

        {searchError && <div className="text-error text-sm">Error: {searchError}</div>}

        {searchResults && (
          <div className="text-sm text-gray-400">
            Found {searchResults.book?.length || 0} book(s), {searchResults.podcast?.length || 0} podcast(s)
            {(selectedBook || selectedPodcast) && (
              <span className="ml-2">
                • Selected: <strong>{selectedBook?.media.metadata.title || selectedPodcast?.media.metadata.title}</strong>
              </span>
            )}
          </div>
        )}

        {(selectedBook || selectedPodcast) && (
          <div className="flex justify-end">
            <Btn onClick={handleClear} size="small">
              Clear Selection
            </Btn>
          </div>
        )}
      </div>
    </div>
  )
}
