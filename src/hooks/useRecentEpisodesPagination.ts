import { appendUniqueRecentEpisodes, RECENT_EPISODES_PAGE_SIZE } from '@/lib/recentEpisodes'
import type { GetRecentEpisodesResponse, RecentPodcastEpisode } from '@/types/api'
import { useCallback, useRef, useState } from 'react'

type FetchRecentEpisodesPage = (page: number, limit: number) => Promise<GetRecentEpisodesResponse>

interface UseRecentEpisodesPaginationProps {
  initialEpisodes: RecentPodcastEpisode[]
  fetchPage: FetchRecentEpisodesPage
  onError: (error: unknown) => void
}

export function useRecentEpisodesPagination({ initialEpisodes, fetchPage, onError }: UseRecentEpisodesPaginationProps) {
  const [episodes, setEpisodes] = useState(() => appendUniqueRecentEpisodes([], initialEpisodes))
  const [hasMore, setHasMore] = useState(initialEpisodes.length >= RECENT_EPISODES_PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(false)
  const nextPageRef = useRef(1)
  const hasMoreRef = useRef(hasMore)
  const inFlightRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !hasMoreRef.current) return false

    inFlightRef.current = true
    setIsLoading(true)

    try {
      const page = nextPageRef.current
      const response = await fetchPage(page, RECENT_EPISODES_PAGE_SIZE)
      const incoming = response.episodes ?? []

      setEpisodes((current) => appendUniqueRecentEpisodes(current, incoming))
      nextPageRef.current = page + 1

      const nextHasMore = incoming.length >= RECENT_EPISODES_PAGE_SIZE
      hasMoreRef.current = nextHasMore
      setHasMore(nextHasMore)
      return true
    } catch (error) {
      onError(error)
      return false
    } finally {
      inFlightRef.current = false
      setIsLoading(false)
    }
  }, [fetchPage, onError])

  return {
    episodes,
    hasMore,
    isLoading,
    loadMore
  }
}
