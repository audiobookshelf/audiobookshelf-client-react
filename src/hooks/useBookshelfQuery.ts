import { LibrarySettingKey, useLibrary } from '@/contexts/LibraryContext'
import { EntityType } from '@/types/api'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'

export function useBookshelfQuery(entityType: EntityType) {
  const {
    library,
    orderBy,
    orderDesc,
    filterBy,
    collapseSeries,
    seriesSortBy,
    seriesSortDesc,
    seriesFilterBy,
    authorSortBy,
    authorSortDesc,
    updateSetting,
    isSettingsLoaded
  } = useLibrary()

  const searchParams = useSearchParams()

  const isPodcastLibrary = library.mediaType === 'podcast'

  // Sync Settings <-> URL
  // 1. Initialize settings from URL on mount
  useEffect(() => {
    if (!isSettingsLoaded) return

    const params = searchParams
    const hasParams = params.size > 0

    // Only override if params are present. If empty, we keep localStorage settings.
    if (!hasParams) return

    // Helper to safely set setting if param exists
    const syncSetting = (paramKey: string, settingKey: LibrarySettingKey, isBool: boolean = false) => {
      const val = params.get(paramKey)
      if (val !== null) {
        // Convert '1'/'0' to boolean if needed
        const parsedVal = isBool ? val === '1' : val
        updateSetting(settingKey, parsedVal)
      }
    }

    if (entityType === 'items') {
      syncSetting('sort', 'orderBy')
      syncSetting('desc', 'orderDesc', true)
      syncSetting('filter', 'filterBy')
      if (!isPodcastLibrary) {
        syncSetting('collapseseries', 'collapseSeries', true)
      }
    } else if (entityType === 'series') {
      syncSetting('sort', 'seriesSortBy')
      syncSetting('desc', 'seriesSortDesc', true)
      syncSetting('filter', 'seriesFilterBy')
    } else if (entityType === 'authors') {
      syncSetting('sort', 'authorSortBy')
      syncSetting('desc', 'authorSortDesc', true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsLoaded]) // Run once when settings are loaded

  // 2. Update URL when settings change
  useEffect(() => {
    if (!isSettingsLoaded) return

    const params = new URLSearchParams()

    const setParam = (key: string, value: string) => params.set(key, value)

    if (entityType === 'items') {
      if (orderBy) {
        setParam('sort', orderBy)
        setParam('desc', orderDesc ? '1' : '0')
      }
      if (filterBy && filterBy !== 'all') {
        setParam('filter', filterBy)
      }
      if (collapseSeries && !isPodcastLibrary) {
        setParam('collapseseries', '1')
      }
    } else if (entityType === 'series') {
      if (seriesSortBy) {
        setParam('sort', seriesSortBy)
        setParam('desc', seriesSortDesc ? '1' : '0')
      }
      if (seriesFilterBy && seriesFilterBy !== 'all') {
        setParam('filter', seriesFilterBy)
      }
    } else if (entityType === 'authors') {
      if (authorSortBy) {
        setParam('sort', authorSortBy)
        setParam('desc', authorSortDesc ? '1' : '0')
      }
    }

    const newQueryString = params.toString()
    const currentQueryString = searchParams.toString()

    if (newQueryString !== currentQueryString) {
      // Use window.history.replaceState to update URL without triggering a Next.js navigation/re-render
      // This prevents potential unmounting/remounting loops while still keeping the URL shareable
      const newUrl = `${window.location.pathname}?${newQueryString}`
      window.history.replaceState(null, '', newUrl)
    }
  }, [
    entityType,
    orderBy,
    orderDesc,
    filterBy,
    collapseSeries,
    isPodcastLibrary,
    seriesSortBy,
    seriesSortDesc,
    seriesFilterBy,
    authorSortBy,
    authorSortDesc,
    isSettingsLoaded,
    searchParams
  ])

  // Build query string for API (separate from URL params, but often similar)
  const query = useMemo(() => {
    const params = new URLSearchParams()

    switch (entityType) {
      case 'items':
        if (orderBy) {
          params.set('sort', orderBy)
          params.set('desc', orderDesc ? '1' : '0')
        }
        if (filterBy && filterBy !== 'all') {
          params.set('filter', filterBy)
        }
        if (collapseSeries && !isPodcastLibrary) {
          params.set('collapseseries', '1')
        }
        break
      case 'series':
        if (seriesSortBy) {
          params.set('sort', seriesSortBy)
          params.set('desc', seriesSortDesc ? '1' : '0')
        }
        if (seriesFilterBy && seriesFilterBy !== 'all') {
          params.set('filter', seriesFilterBy)
        }
        break
      case 'authors':
        if (authorSortBy) {
          params.set('sort', authorSortBy)
          params.set('desc', authorSortDesc ? '1' : '0')
        }
        break
    }
    return params.toString()
  }, [entityType, orderBy, orderDesc, filterBy, collapseSeries, isPodcastLibrary, seriesSortBy, seriesSortDesc, seriesFilterBy, authorSortBy, authorSortDesc])

  return { query }
}
