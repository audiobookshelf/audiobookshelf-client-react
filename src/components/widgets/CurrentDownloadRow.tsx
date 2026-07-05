'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import BonusIndicator from '@/components/widgets/BonusIndicator'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import TrailerIndicator from '@/components/widgets/TrailerIndicator'
import { useBookCoverAspectRatio, useLibrary } from '@/contexts/LibraryContext'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import type { PodcastEpisodeDownload } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useMemo } from 'react'

interface CurrentDownloadRowProps {
  episode: PodcastEpisodeDownload
}

export default function CurrentDownloadRow({ episode }: CurrentDownloadRowProps) {
  const { library } = useLibrary()
  const bookCoverAspectRatio = useBookCoverAspectRatio()

  const coverSrc = useMemo(() => getLibraryItemCoverUrl(episode.libraryItemId), [episode.libraryItemId])
  const itemHref = `/library/${library.id}/item/${episode.libraryItemId}`
  const publishedDateLabel = episode.publishedAt
    ? formatDistanceToNow(new Date(episode.publishedAt), { addSuffix: true })
    : null

  return (
    <div className="relative flex py-5">
      <div className="hidden shrink-0 md:block">
        <PreviewCover src={coverSrc} width={96} bookCoverAspectRatio={bookCoverAspectRatio} showResolution={false} />
      </div>

      <div className="max-w-2xl grow ps-4">
        <div className="mb-2 flex md:hidden">
          <PreviewCover src={coverSrc} width={48} bookCoverAspectRatio={bookCoverAspectRatio} showResolution={false} />
          <div className="grow px-2">
            <div className="flex items-center">
              <Link href={itemHref} className="text-foreground-muted hover:text-foreground text-sm hover:underline">
                {episode.podcastTitle}
              </Link>
              {episode.podcastExplicit && <ExplicitIndicator className="ms-1 shrink-0" />}
            </div>
            {publishedDateLabel && <p className="text-foreground-subdued mb-1 text-xs">{publishedDateLabel}</p>}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="flex items-center">
            <Link href={itemHref} className="text-foreground-muted hover:text-foreground text-sm hover:underline">
              {episode.podcastTitle}
            </Link>
            {episode.podcastExplicit && <ExplicitIndicator className="ms-1 shrink-0" />}
          </div>
          {publishedDateLabel && <p className="text-foreground-subdued mb-1 text-xs">{publishedDateLabel}</p>}
        </div>

        {(episode.season || episode.episode) && (
          <div className="text-foreground flex items-center font-semibold">
            <span>#</span>
            {episode.season && <span>{episode.season}x</span>}
            {episode.episode && <span>{episode.episode}</span>}
          </div>
        )}

        <div className="mb-2 flex items-center">
          <span className="text-foreground text-sm font-semibold md:text-base">{episode.episodeDisplayTitle}</span>
          {episode.episodeType === 'bonus' && <BonusIndicator className="ms-1 shrink-0" />}
          {episode.episodeType === 'trailer' && <TrailerIndicator className="ms-1 shrink-0" />}
        </div>
      </div>
    </div>
  )
}
