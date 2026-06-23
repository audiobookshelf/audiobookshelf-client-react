'use client'

import RssFeedOpenCloseModal from '@/components/modals/RssFeedOpenCloseModal'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryItemUpdated } from '@/hooks/useLibraryItemUpdated'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { applyLibraryItemUpdateToList } from '@/lib/libraryItemUpdatedUtils'
import { BookshelfView, GetLibraryItemsResponse, RssFeed, Series } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'

interface SeriesClientProps {
  series: Series
  libraryItems: GetLibraryItemsResponse
}

export default function SeriesClient({ series, libraryItems }: SeriesClientProps) {
  const router = useRouter()
  const t = useTypeSafeTranslations()
  const { library, setItemCount, setDetailToolbarTitle, setContextMenuItems, setContextMenuActionHandler } = useLibrary()
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

  const handleToolbarMenuAction = useCallback(
    (action: string) => {
      if (action === 'openRssFeed') openRssModal()
    },
    [openRssModal]
  )

  useEffect(() => {
    if (!userIsAdminOrUp && !rssFeed) {
      setContextMenuItems([])
      return
    }
    setContextMenuItems([{ text: t('LabelOpenRSSFeed'), action: 'openRssFeed' }])
  }, [rssFeed, setContextMenuItems, t, userIsAdminOrUp])

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
        {items.map((libraryItem) => {
          const entityProgress = libraryItem.media?.id ? getMediaItemProgress(libraryItem.media.id) : undefined
          return (
            <BookMediaCard
              key={libraryItem.id}
              libraryItem={libraryItem}
              bookshelfView={BookshelfView.DETAIL}
              dateFormat={serverSettings.dateFormat}
              timeFormat={serverSettings.timeFormat}
              userPermissions={user.permissions}
              ereaderDevices={ereaderDevices}
              showSubtitles={true}
              mediaProgress={entityProgress}
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
