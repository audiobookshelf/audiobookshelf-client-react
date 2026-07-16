'use client'

import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import SimpleDataTable, { DataTableColumn } from '@/components/ui/SimpleDataTable'
import BonusIndicator from '@/components/widgets/BonusIndicator'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import TrailerIndicator from '@/components/widgets/TrailerIndicator'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { PodcastEpisodeDownload } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useMemo } from 'react'

interface PodcastDownloadQueueTableProps {
  queue: PodcastEpisodeDownload[]
}

interface PodcastQueueGroup {
  libraryItemId: string
  podcastTitle?: string
  podcastExplicit?: boolean
  items: PodcastEpisodeDownload[]
}

function groupQueueByPodcast(queue: PodcastEpisodeDownload[]): PodcastQueueGroup[] {
  const groups = new Map<string, PodcastQueueGroup>()

  for (const item of queue) {
    const existing = groups.get(item.libraryItemId)
    if (existing) {
      existing.items.push(item)
    } else {
      groups.set(item.libraryItemId, {
        libraryItemId: item.libraryItemId,
        podcastTitle: item.podcastTitle,
        podcastExplicit: item.podcastExplicit,
        items: [item]
      })
    }
  }

  return Array.from(groups.values())
}

function EpisodeNumberAndType({ item }: { item: PodcastEpisodeDownload }) {
  return (
    <div className="flex shrink-0 items-center">
      {item.season && <span>{item.season}x</span>}
      {item.episode && <span>{item.episode}</span>}
      {item.episodeType === 'bonus' && <BonusIndicator className="ms-1 shrink-0" />}
      {item.episodeType === 'trailer' && <TrailerIndicator className="ms-1 shrink-0" />}
    </div>
  )
}

export default function PodcastDownloadQueueTable({ queue }: PodcastDownloadQueueTableProps) {
  const t = useTypeSafeTranslations()
  const { library } = useLibrary()

  const groupedQueue = useMemo(() => groupQueueByPodcast(queue), [queue])

  const desktopColumns = useMemo<DataTableColumn<PodcastEpisodeDownload>[]>(
    () => [
      {
        label: t('LabelPodcast'),
        accessor: (item) => (
          <div className="flex items-center">
            <Link
              href={`/library/${library.id}/item/${item.libraryItemId}`}
              className="text-foreground-muted hover:text-foreground text-start text-sm hover:underline"
            >
              {item.podcastTitle}
            </Link>
            {item.podcastExplicit && <ExplicitIndicator className="ms-1 shrink-0" />}
          </div>
        ),
        headerClassName: 'min-w-48 px-4',
        cellClassName: 'px-4'
      },
      {
        label: t('LabelEpisode'),
        accessor: (item) => <EpisodeNumberAndType item={item} />,
        headerClassName: 'w-32 min-w-32',
        cellClassName: ''
      },
      {
        label: t('LabelEpisodeTitle'),
        accessor: (item) => item.episodeDisplayTitle,
        headerClassName: 'px-4',
        cellClassName: 'px-4'
      },
      {
        label: t('LabelPubDate'),
        accessor: (item) => {
          const publishedDateLabel = item.publishedAt ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true }) : null
          return publishedDateLabel ? <p>{publishedDateLabel}</p> : null
        },
        headerClassName: 'w-48 px-4',
        cellClassName: 'text-xs px-4'
      }
    ],
    [t, library.id]
  )

  const mobileColumns = useMemo<DataTableColumn<PodcastEpisodeDownload>[]>(
    () => [
      {
        label: '#',
        accessor: (item) => <EpisodeNumberAndType item={item} />,
        headerClassName: 'w-12 px-2',
        cellClassName: 'w-12 shrink-0 px-2 align-middle'
      },
      {
        label: t('LabelEpisodeTitle'),
        accessor: (item) => {
          const title = item.episodeDisplayTitle ?? ''
          return title ? <TruncatingTooltipText lazy text={title} className="text-sm" position="top" /> : null
        },
        headerClassName: 'min-w-0 px-2',
        cellClassName: 'max-w-0 min-w-0 px-2 align-middle'
      }
    ],
    [t]
  )

  return (
    <div className="my-2 w-full min-w-0">
      <div className="bg-primary flex w-full items-center px-4 py-2 md:px-6">
        <p className="pe-2 md:pe-4">{t('HeaderDownloadQueue')}</p>
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 md:h-7 md:w-7">
          <span className="font-mono text-sm">{queue.length}</span>
        </div>
      </div>

      {/* Mobile: grouped subtables with # and episode title columns */}
      <div className="w-full min-w-0 md:hidden">
        {groupedQueue.map((group) => {
          return (
            <div key={group.libraryItemId} className="w-full min-w-0">
              <div className="bg-primary/50 flex w-full min-w-0 items-center gap-1 px-4 py-2">
                {group.podcastTitle ? (
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <TruncatingTooltipText lazy text={group.podcastTitle} className="text-foreground text-sm font-semibold" position="top" />
                  </div>
                ) : null}
                {group.podcastExplicit && <ExplicitIndicator className="shrink-0" />}
                <span className="text-foreground-subdued shrink-0 font-mono text-xs">({group.items.length})</span>
              </div>
              <SimpleDataTable data={group.items} columns={mobileColumns} getRowKey={(item) => item.id} tableClassName="table-fixed" className="min-w-0" />
            </div>
          )
        })}
      </div>

      {/* Desktop: full table */}
      <div className="hidden w-full md:block">
        <SimpleDataTable data={queue} columns={desktopColumns} getRowKey={(item) => item.id} />
      </div>
    </div>
  )
}
