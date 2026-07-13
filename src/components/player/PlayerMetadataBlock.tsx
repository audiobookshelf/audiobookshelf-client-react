'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { LibraryItem } from '@/types/api'
import Link from 'next/link'
import PreviewCover from '../covers/PreviewCover'

export interface PlayerMetadataDisplay {
  displayTitle: string
  bookAuthors: { id: string; name: string }[]
  podcastAuthor: string | null
  durationLabel: string | null
}

interface PlayerMetadataBlockProps {
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  coverAspectRatio: number
  coverWidth?: number
  /** Smaller text for mobile collapsed bar */
  compact?: boolean
}

export default function PlayerMetadataBlock({ streamLibraryItem, metadata, coverAspectRatio, coverWidth = 77, compact = false }: PlayerMetadataBlockProps) {
  const t = useTypeSafeTranslations()
  const { displayTitle, bookAuthors, podcastAuthor, durationLabel } = metadata

  return (
    <div className="flex min-w-0 flex-1 items-start gap-2">
      <PreviewCover
        src={getLibraryItemCoverUrl(streamLibraryItem.id, streamLibraryItem.updatedAt)}
        bookCoverAspectRatio={coverAspectRatio}
        showResolution={false}
        width={coverWidth}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`}
          className={
            compact
              ? 'text-foreground block truncate text-sm font-medium hover:underline'
              : 'text-foreground block truncate text-lg font-medium hover:underline'
          }
        >
          {displayTitle}
        </Link>
        <div className={compact ? 'text-foreground-muted flex items-center text-xs' : 'text-foreground-muted flex items-center text-sm'}>
          <span className="material-symbols text-sm">person</span>
          {podcastAuthor ? (
            <span className="truncate ps-1">{podcastAuthor}</span>
          ) : bookAuthors.length > 0 ? (
            <div className="truncate ps-1">
              {bookAuthors.map((author, index) => (
                <span key={author.id}>
                  <Link href={`/library/${streamLibraryItem.libraryId}/authors/${author.id}`} className="text-foreground-muted hover:underline">
                    {author.name}
                  </Link>
                  {index < bookAuthors.length - 1 && <span className="text-foreground-muted">, </span>}
                </span>
              ))}
            </div>
          ) : (
            <span className="ps-1">{t('LabelUnknown')}</span>
          )}
        </div>
        {durationLabel && (
          <div className={compact ? 'text-foreground-muted flex items-center gap-1 text-xs' : 'text-foreground-muted flex items-center gap-1 text-sm'}>
            <span className="material-symbols text-foreground-muted text-xs">schedule</span>
            <span className="ps-0.5 font-mono">{durationLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}
