import { appendUniqueRecentEpisodes, RECENT_EPISODES_PAGE_SIZE } from '@/lib/recentEpisodes'
import type { GetRecentEpisodesResponse, RecentPodcastEpisode } from '@/types/api'
import { useCallback, useRef, useState, useTransition } from 'react'

type FetchRecentEpisodesPage = (page: number) => Promise<GetRecentEpisodesResponse>

interface UseRecentEpisodesPaginationProps {
  initialEpisodes: RecentPodcastEpisode[]
  fetchPage: FetchRecentEpisodesPage
  onError: (error: unknown) => void
}

export function useRecentEpisodesPagination({ initialEpisodes, fetchPage, onError }: UseRecentEpisodesPaginationProps) {
  const [episodes, setEpisodes] = useState(() => appendUniqueRecentEpisodes([], initialEpisodes))
  const [hasMore, setHasMore] = useState(initialEpisodes.length >= RECENT_EPISODES_PAGE_SIZE)
  const [isPending, startTransition] = useTransition()
  const nextPageRef = useRef(1)
  const hasMoreRef = useRef(hasMore)
  // Ref-based guard because isPending is not synchronously true before the first
  // await, so two rapid calls would both pass the check without this.
  const inFlightRef = useRef(false)

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !hasMoreRef.current) return

    inFlightRef.current = true
    startTransition(async () => {
      try {
        const page = nextPageRef.current
        const response = await fetchPage(page)
        const incoming = response.episodes ?? []

        setEpisodes((current) => appendUniqueRecentEpisodes(current, incoming))
        nextPageRef.current = page + 1

        const nextHasMore = incoming.length >= RECENT_EPISODES_PAGE_SIZE
        hasMoreRef.current = nextHasMore
        setHasMore(nextHasMore)
      } catch (error) {
        onError(error)
      } finally {
        inFlightRef.current = false
      }
    })
  }, [fetchPage, onError, startTransition])

  return {
    episodes,
    hasMore,
    isLoading: isPending,
    loadMore
  }
}
