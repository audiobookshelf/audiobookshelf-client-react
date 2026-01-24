'use client'

import DataTable, { DataTableColumn } from '@/components/ui/DataTable'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate, formatJsDatetime } from '@/lib/datefns'
import { RssFeed, UserLoginResponse } from '@/types/api'
import { useCallback, useRef, useState } from 'react'
import { closeRssFeed } from './actions'
import RssFeedModal from './RssFeedModal'

interface RssFeedsTableProps {
  rssFeeds: RssFeed[]
  currentUser: UserLoginResponse
}

export default function RssFeedsTable({ rssFeeds: initialFeeds, currentUser }: RssFeedsTableProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [rssFeeds, setRssFeeds] = useState(initialFeeds)
  const [selectedFeed, setSelectedFeed] = useState<RssFeed | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [closingFeedId, setClosingFeedId] = useState<string | null>(null)
  const closingFeedRef = useRef<RssFeed | null>(null)
  const serverSettings = currentUser.serverSettings
  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  const handleCloseClick = useCallback((rssFeed: RssFeed) => {
    closingFeedRef.current = rssFeed
    setShowConfirmDialog(true)
  }, [])

  const handleConfirmCloseFeed = useCallback(async () => {
    if (!closingFeedRef.current) return
    setShowConfirmDialog(false)

    const closingFeed = closingFeedRef.current
    setClosingFeedId(closingFeed.id)

    try {
      await closeRssFeed(closingFeed.id)
      setRssFeeds((prev) => prev.filter((feed) => feed.id !== closingFeed.id))
      showToast(t('ToastRSSFeedCloseSuccess'), { type: 'success' })
    } catch (error) {
      showToast(t('ToastRSSFeedCloseFailed'), { type: 'error' })
      console.error('Failed to close RSS feed:', error)
    } finally {
      setClosingFeedId(null)
      closingFeedRef.current = null
    }
  }, [showToast, t])

  function getEntityTypeLabel(entityType: string) {
    switch (entityType) {
      case 'libraryItem':
        return t('LabelItem')
      case 'series':
        return t('LabelSeries')
      case 'collection':
        return t('LabelCollection')
      default:
        return t('LabelUnknown')
    }
  }

  const columns: DataTableColumn<RssFeed>[] = [
    {
      label: '',
      accessor: (rssFeed) => (
        <>
          {rssFeed.coverPath ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/feed/${rssFeed.slug}/cover`} alt={t('LabelCover')} className="w-full h-auto" />
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/Logo.png" alt={t('LabelLogo')} className="w-full h-auto" />
            </>
          )}
        </>
      ),
      headerClassName: 'min-w-16 w-16',
      cellClassName: 'py-1 min-w-16 w-16'
    },
    {
      label: t('LabelTitle'),
      accessor: (rssFeed) => (
        <div className="max-w-40 sm:max-w-64">
          <p className="text-xs truncate" title={rssFeed.meta.title}>
            {rssFeed.meta.title}
          </p>
        </div>
      )
    },
    {
      label: t('LabelSlug'),
      accessor: (rssFeed) => (
        <div className="max-w-40">
          <p className="truncate text-xs" title={rssFeed.slug || '-'}>
            {rssFeed.slug || '-'}
          </p>
        </div>
      ),
      hiddenBelow: 'lg'
    },
    {
      label: t('LabelType'),
      accessor: (rssFeed) => getEntityTypeLabel(rssFeed.entityType),
      cellClassName: 'text-xs'
    },
    {
      label: t('HeaderEpisodes'),
      accessor: (rssFeed) => rssFeed.episodes?.length || 0,
      cellClassName: 'text-xs text-center',
      headerClassName: 'text-center'
    },
    {
      label: t('LabelRSSFeedPreventIndexing'),
      accessor: (rssFeed) =>
        rssFeed.meta.preventIndexing && (
          <div className="flex items-center justify-center">
            <span className="material-symbols text-xl leading-none" aria-hidden="true">
              check
            </span>
          </div>
        ),
      headerClassName: 'text-center',
      hiddenBelow: 'md'
    },
    {
      label: t('LabelLastUpdate'),
      accessor: (rssFeed) => {
        return (
          <Tooltip text={formatJsDatetime(new Date(rssFeed.entityUpdatedAt), dateFormat, timeFormat)} position="top">
            <span className="text-xs whitespace-nowrap">{formatJsDate(new Date(rssFeed.entityUpdatedAt), dateFormat)}</span>
          </Tooltip>
        )
      },
      hiddenBelow: 'sm'
    },
    {
      label: '',
      accessor: (rssFeed) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconBtn
            ariaLabel={t('ButtonCloseFeed')}
            borderless
            size="small"
            className="text-foreground-muted hover:not-disabled:text-foreground"
            loading={closingFeedId === rssFeed.id}
            onClick={() => handleCloseClick(rssFeed)}
          >
            close
          </IconBtn>
        </div>
      )
    }
  ]

  const handleRowClick = (rssFeed: RssFeed) => {
    setSelectedFeed(rssFeed)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <DataTable data={rssFeeds} columns={columns} getRowKey={(rssFeed) => rssFeed.id} onRowClick={handleRowClick} />
      <RssFeedModal isOpen={isModalOpen} onClose={handleCloseModal} rssFeed={selectedFeed} />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t('MessageConfirmCloseFeed')}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmCloseFeed}
      />
    </>
  )
}
