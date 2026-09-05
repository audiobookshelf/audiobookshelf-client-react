'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import Link from 'next/link'
import PlayerMarqueeTitle from './PlayerMarqueeTitle'

export interface PlayerMetadataDisplay {
  displayTitle: string
  bookAuthors: { id: string; name: string }[]
  podcastAuthor: string | null
  durationLabel: string | null
}

interface PlayerTitleAuthorProps {
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  isFullscreen: boolean
  onNavigateAway: () => void
  compact?: boolean
}

export default function PlayerTitleAuthor({ streamLibraryItem, metadata, isFullscreen, onNavigateAway, compact = false }: PlayerTitleAuthorProps) {
  const t = useTypeSafeTranslations()
  const { displayTitle, bookAuthors, podcastAuthor, durationLabel } = metadata

  const handleNavigate = isFullscreen ? onNavigateAway : undefined

  return (
    <div className={mergeClasses('player-title-author', compact && 'player-title-author--compact')}>
      <PlayerMarqueeTitle href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`} text={displayTitle} onNavigate={handleNavigate} />
      <div className="player-author text-foreground-muted flex min-w-0 items-center">
        <span className="material-symbols text-sm">person</span>
        {podcastAuthor ? (
          <span className="truncate ps-1">{podcastAuthor}</span>
        ) : bookAuthors.length > 0 ? (
          <div className="truncate ps-1">
            {bookAuthors.map((author, index) => (
              <span key={author.id}>
                <Link
                  href={`/library/${streamLibraryItem.libraryId}/authors/${author.id}`}
                  className="text-foreground-muted link-underline"
                  onClick={handleNavigate}
                >
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
        <div className="player-duration text-foreground-muted flex items-center gap-1">
          <span className="material-symbols text-foreground-muted text-xs">schedule</span>
          <span className="ps-0.5 font-mono">{durationLabel}</span>
        </div>
      )}
    </div>
  )
}
