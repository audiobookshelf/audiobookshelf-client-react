'use client'

import { fetchRecentEpisodesAction } from '@/app/actions/libraryActions'
import SquareGridGroupCover from '@/components/widgets/media-card/SquareGridGroupCover'
import RecentEpisodeRow, { RecentEpisodeRowDivider } from '@/components/widgets/RecentEpisodeRow'
import RecentEpisodesLoadMore from '@/components/widgets/RecentEpisodesLoadMore'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useListVirtualizer, type VirtualListItem } from '@/hooks/useListVirtualizer'
import { useRecentEpisodesPagination } from '@/hooks/useRecentEpisodesPagination'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getUniqueCoverLibraryItems } from '@/lib/recentEpisodes'
import type { RecentPodcastEpisode } from '@/types/api'
import { useCallback, useMemo } from 'react'

interface LatestClientProps {
  libraryId: string
  initialEpisodes: RecentPodcastEpisode[]
}

const ESTIMATED_EPISODE_ROW_HEIGHT = 240

interface VirtualRecentEpisodeRowProps {
  virtualItem: VirtualListItem
  episodes: RecentPodcastEpisode[]
  measureElement: (index: number, node: HTMLElement | null) => void
}

function VirtualRecentEpisodeRow({ virtualItem, episodes, measureElement }: VirtualRecentEpisodeRowProps) {
  const { index, start } = virtualItem
  const episode = episodes[index]
  const setRowRef = useCallback((node: HTMLDivElement | null) => measureElement(index, node), [index, measureElement])

  return (
    <div ref={setRowRef} cy-id="recent-episode-row" className="absolute top-0 left-0 w-full" style={{ transform: `translateY(${start}px)` }}>
      <RecentEpisodeRow episode={episode} episodeIndex={index} episodes={episodes} />
      {index < episodes.length - 1 && <RecentEpisodeRowDivider />}
    </div>
  )
}

export default function LatestClient({ libraryId, initialEpisodes }: LatestClientProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const coverAspectRatio = useBookCoverAspectRatio()

  const fetchPage = useCallback((page: number) => fetchRecentEpisodesAction(libraryId, page), [libraryId])
  const handleLoadError = useCallback(
    (error: unknown) => {
      console.error('Failed to load recent episodes', error)
      showToast(t('ToastFailedToLoadData'), { type: 'error' })
    },
    [showToast, t]
  )

  const { episodes, hasMore, autoLoadEnabled, isLoading, loadMore } = useRecentEpisodesPagination({
    initialEpisodes,
    fetchPage,
    onError: handleLoadError
  })
  const { virtualItems, totalHeight, listContainerRef, measureElement } = useListVirtualizer(episodes.length, ESTIMATED_EPISODE_ROW_HEIGHT)

  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  const coverItems = useMemo(() => getUniqueCoverLibraryItems(episodes), [episodes])

  const episodeList = (
    <div className="min-w-0 px-2 py-2 md:px-0">
      {!episodes.length && <p className="text-foreground text-center text-xl">{t('MessageNoEpisodes')}</p>}
      {episodes.length > 0 && (
        <div ref={listContainerRef} className="relative w-full" style={{ height: `${totalHeight}px` }}>
          {virtualItems.map((virtualItem) => (
            <VirtualRecentEpisodeRow key={episodes[virtualItem.index].id} virtualItem={virtualItem} episodes={episodes} measureElement={measureElement} />
          ))}
        </div>
      )}
      {hasMore && <RecentEpisodesLoadMore isLoading={isLoading} autoLoadEnabled={autoLoadEnabled} onLoadMore={loadMore} />}
    </div>
  )

  return (
    <div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 md:flex-row md:items-start md:gap-10">
        {coverItems.length > 0 && <SquareGridGroupCover libraryItems={coverItems} width={coverWidth * 2} height={coverHeight * 2} emptyLabel="" />}
        <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
          <h1 className="text-foreground min-w-0 px-2 text-2xl font-bold break-words md:px-0">{t('HeaderLatestEpisodes')}</h1>
          {episodeList}
        </div>
      </div>
    </div>
  )
}
