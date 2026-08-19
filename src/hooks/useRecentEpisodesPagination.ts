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
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(true)
  const [isPending, startTransition] = useTransition()
  const nextPageRef = useRef(1)
  const hasMoreRef = useRef(hasMore)
  const autoLoadEnabledRef = useRef(autoLoadEnabled)
  const episodesRef = useRef(episodes)
  // Ref-based guard because isPending is not synchronously true before the first
  // await, so two rapid calls would both pass the check without this.
  const inFlightRef = useRef(false)

  episodesRef.current = episodes
  autoLoadEnabledRef.current = autoLoadEnabled

  const loadMore = useCallback(
    (options?: { manual?: boolean }) => {
      if (inFlightRef.current || !hasMoreRef.current) return
      if (!options?.manual && !autoLoadEnabledRef.current) return

      if (options?.manual) {
        autoLoadEnabledRef.current = true
        setAutoLoadEnabled(true)
      }

      inFlightRef.current = true
      startTransition(async () => {
        try {
          while (hasMoreRef.current) {
            const page = nextPageRef.current
            const response = await fetchPage(page)
            const incoming = response.episodes ?? []

            const nextEpisodes = appendUniqueRecentEpisodes(episodesRef.current, incoming)
            const addedCount = nextEpisodes.length - episodesRef.current.length
            episodesRef.current = nextEpisodes
            setEpisodes(nextEpisodes)
            nextPageRef.current = page + 1

            const nextHasMore = incoming.length >= RECENT_EPISODES_PAGE_SIZE
            hasMoreRef.current = nextHasMore
            setHasMore(nextHasMore)

            // A full page that dedupes to nothing leaves the sentinel intersecting
            // without a layout change, so keep paging until we find new rows.
            if (!nextHasMore || addedCount > 0) break
          }

          autoLoadEnabledRef.current = true
          setAutoLoadEnabled(true)
        } catch (error) {
          autoLoadEnabledRef.current = false
          setAutoLoadEnabled(false)
          onError(error)
        } finally {
          inFlightRef.current = false
        }
      })
    },
    [fetchPage, onError, startTransition]
  )

  return {
    episodes,
    hasMore,
    autoLoadEnabled,
    isLoading: isPending,
    loadMore
  }
}
