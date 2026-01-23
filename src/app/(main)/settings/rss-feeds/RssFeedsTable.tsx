'use client'

import DataTable, { DataTableColumn } from '@/components/ui/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate, formatJsDatetime } from '@/lib/datefns'
import { RssFeed, UserLoginResponse } from '@/types/api'

interface RssFeedsTableProps {
  rssFeeds: RssFeed[]
  currentUser: UserLoginResponse
}

export default function RssFeedsTable({ rssFeeds, currentUser }: RssFeedsTableProps) {
  const t = useTypeSafeTranslations()
  const serverSettings = currentUser.serverSettings
  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

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
        <div className="w-12">
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
        </div>
      ),
      cellClassName: 'py-1'
    },
    {
      label: t('LabelTitle'),
      accessor: (rssFeed) => (
        <div className="max-w-64">
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
      )
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
      headerClassName: 'text-center'
    },
    {
      label: t('LabelLastUpdate'),
      accessor: (rssFeed) => {
        return (
          <Tooltip text={formatJsDatetime(new Date(rssFeed.entityUpdatedAt), dateFormat, timeFormat)} position="top">
            <span className="text-xs whitespace-nowrap">{formatJsDate(new Date(rssFeed.entityUpdatedAt), dateFormat)}</span>
          </Tooltip>
        )
      }
    }
  ]
  return <DataTable data={rssFeeds} columns={columns} getRowKey={(rssFeed) => rssFeed.id} />
}
