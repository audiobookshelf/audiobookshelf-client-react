'use client'

import { fetchLibraryFilterDataAction } from '@/app/actions/libraryActions'
import { isBookLibraryItem, isPodcastLibraryItem, LibraryFilterData, LibraryItem } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'

/**
 * Add unique strings to an array and sort alphabetically.
 * Returns a new sorted array if items were added, otherwise returns the original.
 */
function addUniqueStrings(
  existing: string[],
  newItems: string[] | undefined,
  sortFn: (a: string, b: string) => number = (a, b) => a.localeCompare(b)
): string[] {
  if (!newItems?.length) return existing
  const itemsToAdd = newItems.filter((item) => !existing.includes(item))
  if (itemsToAdd.length === 0) return existing
  return [...existing, ...itemsToAdd].sort(sortFn)
}

/**
 * Add unique objects by id to an array and sort by name.
 * Returns a new sorted array if items were added, otherwise returns the original.
 */
function addUniqueById<T extends { id: string; name: string }>(existing: T[], newItems: T[] | undefined): T[] {
  if (!newItems?.length) return existing
  const existingIds = new Set(existing.map((item) => item.id))
  const itemsToAdd = newItems.filter((item) => !existingIds.has(item.id))
  if (itemsToAdd.length === 0) return existing
  return [...existing, ...itemsToAdd].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

/**
 * Hook to fetch and manage library filter data.
 * Provides filter data for populating filter dropdown menus,
 * and utility functions for updating filter data based on socket events.
 */
export function useFilterData(libraryId: string | undefined) {
  const [filterData, setFilterData] = useState<LibraryFilterData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch filter data when library changes
  useEffect(() => {
    if (!libraryId) {
      setFilterData(null)
      return
    }

    let cancelled = false

    async function fetchFilterData() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchLibraryFilterDataAction(libraryId!)
        if (!cancelled) {
          setFilterData(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch filter data'))
          console.error('Failed to fetch filter data:', err)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchFilterData()

    return () => {
      cancelled = true
    }
  }, [libraryId])

  /**
   * Update filter data incrementally when a library item is added or updated.
   * Adds any new authors/series/genres/etc. that don't already exist.
   */
  const updateFilterDataWithItem = useCallback(
    (libraryItem: LibraryItem) => {
      setFilterData((prev) => {
        if (!prev || libraryItem.libraryId !== libraryId) return prev

        const updated = { ...prev }

        if (isBookLibraryItem(libraryItem)) {
          const { metadata, tags } = libraryItem.media

          // Add/update authors and series (objects with id/name)
          updated.authors = addUniqueById(updated.authors, metadata.authors)
          updated.series = addUniqueById(updated.series, metadata.series)

          // Add string arrays
          updated.genres = addUniqueStrings(updated.genres, metadata.genres)
          updated.tags = addUniqueStrings(updated.tags, tags)
          updated.narrators = addUniqueStrings(updated.narrators, metadata.narrators)
          updated.publishers = addUniqueStrings(updated.publishers, metadata.publisher ? [metadata.publisher] : undefined)
          updated.languages = addUniqueStrings(updated.languages, metadata.language ? [metadata.language] : undefined)

          // Add published decade (special sorting)
          if (metadata.publishedYear && !isNaN(parseInt(metadata.publishedYear, 10))) {
            const year = parseInt(metadata.publishedYear, 10)
            const decade = (Math.floor(year / 10) * 10).toString()
            updated.publishedDecades = addUniqueStrings(updated.publishedDecades, [decade], (a, b) => parseInt(a, 10) - parseInt(b, 10))
          }
        } else if (isPodcastLibraryItem(libraryItem)) {
          const { metadata, tags } = libraryItem.media

          // Add string arrays
          updated.genres = addUniqueStrings(updated.genres, metadata.genres)
          updated.tags = addUniqueStrings(updated.tags, tags)
          updated.languages = addUniqueStrings(updated.languages, metadata.language ? [metadata.language] : undefined)
        }

        return updated
      })
    },
    [libraryId]
  )

  /**
   * Remove a series from filter data when it's deleted.
   */
  const removeSeriesFromFilterData = useCallback((seriesId: string) => {
    setFilterData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        series: prev.series.filter((s) => s.id !== seriesId)
      }
    })
  }, [])

  return {
    filterData,
    isLoading,
    error,
    updateFilterDataWithItem,
    removeSeriesFromFilterData
  }
}
