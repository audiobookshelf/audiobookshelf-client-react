'use client'

import LazyTruncatingTooltipText from '@/components/ui/LazyTruncatingTooltipText'
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

function QueueTableRow({ item, libraryId }: { item: PodcastEpisodeDownload; libraryId: string }) {
  const publishedDateLabel = item.publishedAt ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true }) : null

  return (
    <tr>
      <td dir="auto" className="px-4">
        <div className="flex items-center">
          <Link
            href={`/library/${libraryId}/item/${item.libraryItemId}`}
            className="text-foreground-muted hover:text-foreground text-start text-sm hover:underline"
          >
            {item.podcastTitle}
          </Link>
          {item.podcastExplicit && <ExplicitIndicator className="ms-1 shrink-0" />}
        </div>
      </td>
      <td>
        <EpisodeNumberAndType item={item} />
      </td>
      <td dir="auto" className="px-4">
        {item.episodeDisplayTitle}
      </td>
      <td className="text-xs">
        <div className="flex items-center">{publishedDateLabel && <p>{publishedDateLabel}</p>}</div>
      </td>
    </tr>
  )
}

function MobileEpisodeRow({ item }: { item: PodcastEpisodeDownload }) {
  const title = item.episodeDisplayTitle ?? ''

  return (
    <tr>
      <td className="w-12 shrink-0 px-2 py-2 align-middle">
        <EpisodeNumberAndType item={item} />
      </td>
      <td dir="auto" className="max-w-0 min-w-0 px-2 py-2 align-middle">
        {title ? <LazyTruncatingTooltipText text={title} className="text-sm" position="top" /> : null}
      </td>
    </tr>
  )
}

export default function PodcastDownloadQueueTable({ queue }: PodcastDownloadQueueTableProps) {
  const t = useTypeSafeTranslations()
  const { library } = useLibrary()

  const groupedQueue = useMemo(() => groupQueueByPodcast(queue), [queue])

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
                    <LazyTruncatingTooltipText text={group.podcastTitle} className="text-foreground text-sm font-semibold" position="top" />
                  </div>
                ) : null}
                {group.podcastExplicit && <ExplicitIndicator className="shrink-0" />}
                <span className="text-foreground-subdued shrink-0 font-mono text-xs">({group.items.length})</span>
              </div>
              <table className="tracksTable w-full min-w-0 table-fixed text-sm">
                <thead>
                  <tr>
                    <th className="w-12 px-2 text-left">#</th>
                    <th className="min-w-0 px-2 text-left">{t('LabelEpisodeTitle')}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <MobileEpisodeRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      {/* Desktop: full table */}
      <div className="hidden w-full md:block">
        <table className="tracksTable text-sm">
          <thead>
            <tr>
              <th className="min-w-48 px-4 text-left">{t('LabelPodcast')}</th>
              <th className="w-32 min-w-32 text-left">{t('LabelEpisode')}</th>
              <th className="px-4 text-left">{t('LabelEpisodeTitle')}</th>
              <th className="w-48 px-4 text-left">{t('LabelPubDate')}</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <QueueTableRow key={item.id} item={item} libraryId={library.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
