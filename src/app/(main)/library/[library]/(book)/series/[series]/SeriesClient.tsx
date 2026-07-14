'use client'

import BookshelfClient from '@/app/(main)/library/[library]/[entityType]/BookshelfClient'
import { markSeriesFinishedAction, readdSeriesToContinueListeningAction } from '@/app/actions/mediaActions'
import RssFeedOpenCloseModal from '@/components/modals/RssFeedOpenCloseModal'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { filterEncode } from '@/lib/filterUtils'
import { computeIsSeriesFinished } from '@/lib/mediaProgress'
import { RssFeed, Series } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useTransition } from 'react'

interface SeriesClientProps {
  series: Series
}

export default function SeriesClient({ series: seriesProp }: SeriesClientProps) {
  const router = useRouter()
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { library, collapseBookSeries, showSubtitles, updateSetting, setDetailToolbarTitle, setContextMenuItems, setContextMenuActionHandler } = useLibrary()
  const { user, userIsAdminOrUp } = useUser()

  const seriesBooksQuery = useMemo(() => {
    const params = new URLSearchParams()
    params.set('filter', `series.${filterEncode(seriesProp.id)}`)
    if (collapseBookSeries) {
      params.set('collapseseries', '1')
    }

    return params.toString()
  }, [seriesProp.id, collapseBookSeries])

  const [series, setSeries] = useState(seriesProp)
  const [markSeriesConfirmOpen, setMarkSeriesConfirmOpen] = useState(false)

  useEffect(() => {
    setSeries(seriesProp)
  }, [seriesProp])

  const [isReaddingSeries, startReaddSeriesTransition] = useTransition()
  const [isMarkingSeriesFinished, startMarkSeriesFinishedTransition] = useTransition()
  const isSeriesRemovedFromContinueListening = user.seriesHideFromContinueListening.includes(series.id)

  const seriesLibraryItemIds = useMemo(() => series.progress?.libraryItemIds ?? [], [series.progress?.libraryItemIds])
  const isSeriesFinished = useMemo(() => computeIsSeriesFinished(user.mediaProgress, seriesLibraryItemIds), [seriesLibraryItemIds, user.mediaProgress])

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

    return () => {
      setDetailToolbarTitle(null)
      setContextMenuItems([])
    }
  }, [series.name, setContextMenuItems, setDetailToolbarTitle])

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

  const openMarkSeriesFinishedConfirm = useCallback(() => {
    if (isMarkingSeriesFinished || seriesLibraryItemIds.length === 0) return
    setMarkSeriesConfirmOpen(true)
  }, [isMarkingSeriesFinished, seriesLibraryItemIds.length])

  const confirmMarkSeriesFinished = useCallback(() => {
    if (isMarkingSeriesFinished || seriesLibraryItemIds.length === 0) return

    const newIsFinished = !isSeriesFinished

    startMarkSeriesFinishedTransition(async () => {
      try {
        await markSeriesFinishedAction(
          library.id,
          series.id,
          seriesLibraryItemIds.map((libraryItemId) => ({
            libraryItemId,
            isFinished: newIsFinished
          }))
        )

        showToast(t('ToastSeriesUpdateSuccess'), { type: 'success' })
        setMarkSeriesConfirmOpen(false)
      } catch (error) {
        console.error('Failed to batch update series finished state', error)
        showToast(t('ToastSeriesUpdateFailed'), { type: 'error' })
      }
    })
  }, [isMarkingSeriesFinished, isSeriesFinished, library.id, series.id, seriesLibraryItemIds, showToast, t])

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
      } else if (action === 'collapse-sub-series') {
        updateSetting('collapseBookSeries', true)
      } else if (action === 'expand-sub-series') {
        updateSetting('collapseBookSeries', false)
      } else if (action === 'mark-series-finished') {
        openMarkSeriesFinishedConfirm()
      }
    },
    [openMarkSeriesFinishedConfirm, openRssModal, reAddSeriesToContinueListening, updateSetting]
  )

  useEffect(() => {
    const menuItems: { text: string; action: string }[] = []

    if (seriesLibraryItemIds.length > 0) {
      menuItems.push({
        text: t(isSeriesFinished ? 'MessageMarkAsNotFinished' : 'MessageMarkAsFinished'),
        action: 'mark-series-finished'
      })
    }

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
  }, [
    collapseBookSeries,
    isSeriesFinished,
    isSeriesRemovedFromContinueListening,
    library.mediaType,
    rssFeed,
    seriesLibraryItemIds.length,
    setContextMenuItems,
    showSubtitles,
    t,
    userIsAdminOrUp
  ])

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
    <div className="h-full w-full">
      <BookshelfClient entityType="items" queryOverride={seriesBooksQuery} registerToolbar={false} />

      <RssFeedOpenCloseModal
        isOpen={rssFeedModalOpen}
        onClose={() => setRssFeedModalOpen(false)}
        entity={rssModalEntity}
        onFeedChange={(feed) => {
          setRssFeed(feed)
          router.refresh()
        }}
      />

      <ConfirmDialog
        isOpen={markSeriesConfirmOpen}
        message={t(isSeriesFinished ? 'MessageConfirmMarkSeriesNotFinished' : 'MessageConfirmMarkSeriesFinished')}
        processing={isMarkingSeriesFinished}
        onClose={() => setMarkSeriesConfirmOpen(false)}
        onConfirm={confirmMarkSeriesFinished}
      />
    </div>
  )
}
