import { useUpdateEffect } from '@/hooks/useUpdateEffect'
import { MediaProgress, PodcastEpisode } from '@/types/api'
import { useEffect, useMemo, useState } from 'react'

function compareSortValues(aVal: string | number, bVal: string | number): number {
  if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal
  return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
}

function episodeSortValue(episode: PodcastEpisode, key: string): string | number {
  if (key === 'publishedAt') return episode.publishedAt || Number.MAX_VALUE
  if (key === 'title') return episode.title || ''
  if (key === 'season') return episode.season || ''
  if (key === 'episode') return episode.episode || ''
  if (key === 'audioFile.metadata.filename') return episode.audioFile?.metadata?.filename || ''
  return episode.publishedAt || 0
}

interface UseEpisodeFilterAndSortReturn {
  libraryItemId: string
  episodes: PodcastEpisode[]
  getMediaItemProgress?: (mediaItemId: string) => MediaProgress | null
}

export function useEpisodeFilterAndSort({ libraryItemId, episodes, getMediaItemProgress }: UseEpisodeFilterAndSortReturn) {
  const storageKey = `episodeTable:${libraryItemId}`

  const [filterKey, setFilterKey] = useState<string>('incomplete')
  const [sortKey, setSortKey] = useState<string>('publishedAt')
  const [sortDesc, setSortDesc] = useState<boolean>(true)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.filterKey !== undefined) setFilterKey(parsed.filterKey)
        if (parsed.sortKey !== undefined) setSortKey(parsed.sortKey)
        if (parsed.sortDesc !== undefined) setSortDesc(parsed.sortDesc)
      }
    } catch {
      // ignore
    }
    setHasMounted(true)
  }, [storageKey])

  // Persist filter/sort prefs to localStorage whenever they change
  useEffect(() => {
    if (!hasMounted) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ filterKey, sortKey, sortDesc }))
    } catch {
      // ignore storage errors (e.g. private-browsing quota)
    }
  }, [storageKey, filterKey, sortKey, sortDesc, hasMounted])

  const [search, setSearch] = useState('')
  const [searchText, setSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useUpdateEffect(() => {
    setIsSearching(true)
    const timeout = setTimeout(() => {
      setSearchText(search.toLowerCase().trim())
      setIsSearching(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  // Filtered and sorted episodes
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes]

    // Apply filter
    if (filterKey !== 'all') {
      result = result.filter((ep) => {
        const progress = getMediaItemProgress?.(ep.id)
        if (filterKey === 'incomplete') return !progress || !progress.isFinished
        if (filterKey === 'complete') return progress?.isFinished
        return progress && !progress.isFinished && progress.currentTime > 0 // in_progress
      })
    }

    // Apply search
    if (searchText) {
      result = result.filter((ep) => ep.title?.toLowerCase().includes(searchText) || ep.subtitle?.toLowerCase().includes(searchText))
    }

    // Apply sort. Descending reverses every step, matching Vue.
    result.sort((a, b) => {
      const left = sortDesc ? b : a
      const right = sortDesc ? a : b

      const primaryCompare = compareSortValues(episodeSortValue(left, sortKey), episodeSortValue(right, sortKey))
      if (primaryCompare !== 0 || sortKey === 'publishedAt') return primaryCompare

      if (sortKey === 'season') {
        const episodeCompare = compareSortValues(left.episode || '', right.episode || '')
        if (episodeCompare !== 0) return episodeCompare
      }

      return compareSortValues(left.publishedAt || Number.MAX_VALUE, right.publishedAt || Number.MAX_VALUE)
    })

    return result
  }, [episodes, filterKey, sortKey, sortDesc, searchText, getMediaItemProgress])

  return {
    filterKey,
    setFilterKey,
    sortKey,
    setSortKey,
    sortDesc,
    setSortDesc,
    search,
    setSearch,
    isSearching,
    filteredEpisodes,
    hasMounted
  }
}
