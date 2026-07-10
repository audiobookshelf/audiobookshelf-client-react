'use client'

import { readdSeriesToContinueListeningAction } from '@/app/actions/mediaActions'
import RssFeedOpenCloseModal from '@/components/modals/RssFeedOpenCloseModal'
import SelectableShelfMediaCard from '@/components/widgets/media-card/SelectableShelfMediaCard'
import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryItemUpdated } from '@/hooks/useLibraryItemUpdated'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { applyLibraryItemUpdateToList } from '@/lib/libraryItemUpdatedUtils'
import { BookshelfView, GetLibraryItemsResponse, RssFeed, Series } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useTransition } from 'react'

interface SeriesClientProps {
  series: Series
  libraryItems: GetLibraryItemsResponse
}

export default function SeriesClient({ series, libraryItems }: SeriesClientProps) {
  const router = useRouter()
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { library, collapseBookSeries, showSubtitles, updateSetting, setItemCount, setDetailToolbarTitle, setContextMenuItems, setContextMenuActionHandler } =
    useLibrary()
  const { user, serverSettings, ereaderDevices, getMediaItemProgress, userIsAdminOrUp } = useUser()

  const [items, setItems] = useState(libraryItems.results)

  useEffect(() => {
    setItems(libraryItems.results)
  }, [libraryItems.results])

  useLibraryItemUpdated(
    library.id,
    useCallback((updatedItem) => {
      setItems((prev) => applyLibraryItemUpdateToList(prev, updatedItem))
    }, [])
  )
  const [isReaddingSeries, startReaddSeriesTransition] = useTransition()
  const isSeriesRemovedFromContinueListening = user.seriesHideFromContinueListening.includes(series.id)

  const bookTotal = libraryItems.total ?? items.length

  const [rssFeed, setRssFeed] = useState<RssFeed | null>(series.rssFeed ?? null)
  const [rssFeedModalOpen, setRssFeedModalOpen] = useState(false)

  useEffect(() => {
    setRssFeed(series.rssFeed ?? null)
  }, [series.rssFeed])

  const handleRssFeedOpen = useCallback(
    (data: RssFeed) => {
      if (data.entityId === series.id) setRssFeed(data)
    },
    [series.id]
  )

  const handleRssFeedClosed = useCallback(
    (data: RssFeed) => {
      if (data.entityId === series.id) setRssFeed(null)
    },
    [series.id]
  )

  useSocketEvent<RssFeed>('rss_feed_open', handleRssFeedOpen, [series.id])
  useSocketEvent<RssFeed>('rss_feed_closed', handleRssFeedClosed, [series.id])

  useLayoutEffect(() => {
    setDetailToolbarTitle(series.name)
    setItemCount(bookTotal)

    return () => {
      setDetailToolbarTitle(null)
      setItemCount(null)
      setContextMenuItems([])
    }
  }, [bookTotal, series.name, setContextMenuItems, setDetailToolbarTitle, setItemCount])

  const openRssModal = useCallback(() => {
    setRssFeedModalOpen(true)
  }, [])

  const reAddSeriesToContinueListening = useCallback(() => {
    if (isReaddingSeries) return

    startReaddSeriesTransition(async () => {
      try {
        await readdSeriesToContinueListeningAction(series.id)
        showToast(t('ToastItemUpdateSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to re-add series to continue listening', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }, [isReaddingSeries, series.id, showToast, t])

  const handleToolbarMenuAction = useCallback(
    (action: string) => {
      if (action === 'openRssFeed') {
        openRssModal()
      } else if (action === 'reAddSeriesToContinueListening') {
        reAddSeriesToContinueListening()
      } else if (action === 'show-subtitles') {
        updateSetting('showSubtitles', true)
      } else if (action === 'hide-subtitles') {
        updateSetting('showSubtitles', false)
      } else if (action === 'collapse-sub-series' || action === 'expand-sub-series') {
        showToast('Not implemented', { type: 'warning' })
      } else if (action === 'mark-series-finished') {
        showToast('Not implemented', { type: 'warning' })
      }
    },
    [openRssModal, reAddSeriesToContinueListening, showToast, updateSetting]
  )

  useEffect(() => {
    const menuItems: { text: string; action: string }[] = [
      {
        text: t('MessageMarkAsFinished'),
        action: 'mark-series-finished'
      }
    ]

    if (userIsAdminOrUp || rssFeed) {
      menuItems.push({ text: t('LabelOpenRSSFeed'), action: 'openRssFeed' })
    }

    if (isSeriesRemovedFromContinueListening) {
      menuItems.push({ text: t('LabelReAddSeriesToContinueListening'), action: 'reAddSeriesToContinueListening' })
    }

    if (library.mediaType === 'book') {
      menuItems.push({
        text: t(showSubtitles ? 'LabelHideSubtitles' : 'LabelShowSubtitles'),
        action: showSubtitles ? 'hide-subtitles' : 'show-subtitles'
      })
      menuItems.push({
        text: t(collapseBookSeries ? 'LabelExpandSubSeries' : 'LabelCollapseSubSeries'),
        action: collapseBookSeries ? 'expand-sub-series' : 'collapse-sub-series'
      })
    }

    setContextMenuItems(menuItems)
  }, [collapseBookSeries, isSeriesRemovedFromContinueListening, library.mediaType, rssFeed, setContextMenuItems, showSubtitles, t, userIsAdminOrUp])

  useEffect(() => {
    setContextMenuActionHandler(handleToolbarMenuAction)
    return () => setContextMenuActionHandler(() => {})
  }, [handleToolbarMenuAction, setContextMenuActionHandler])

  const rssModalEntity = useMemo(
    () => ({
      id: series.id,
      name: series.name,
      type: 'series' as const,
      feed: rssFeed
    }),
    [rssFeed, series.id, series.name]
  )

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {items.map((libraryItem, entityIndex) => {
          const entityProgress = libraryItem.media?.id ? getMediaItemProgress(libraryItem.media.id) : undefined
          return (
            <SelectableShelfMediaCard
              key={libraryItem.id}
              scopeId={`series:${series.id}`}
              libraryItem={libraryItem}
              cardType="book"
              bookshelfView={BookshelfView.DETAIL}
              dateFormat={serverSettings.dateFormat}
              timeFormat={serverSettings.timeFormat}
              userPermissions={user.permissions}
              ereaderDevices={ereaderDevices}
              showSubtitles={showSubtitles}
              mediaProgress={entityProgress}
              shelfEntities={items}
              entityIndex={entityIndex}
            />
          )
        })}
      </div>

      <RssFeedOpenCloseModal
        isOpen={rssFeedModalOpen}
        onClose={() => setRssFeedModalOpen(false)}
        entity={rssModalEntity}
        onFeedChange={(feed) => {
          setRssFeed(feed)
          router.refresh()
        }}
      />
    </div>
  )
}
