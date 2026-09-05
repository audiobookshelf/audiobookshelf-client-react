'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import PlayerAuthorLine from './PlayerAuthorLine'
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
  const libraryId = streamLibraryItem.libraryId

  const handleNavigate = isFullscreen ? onNavigateAway : undefined
  const hasAuthorLine = Boolean(podcastAuthor || bookAuthors.length > 0)

  return (
    <div className={mergeClasses('player-title-author', compact && 'player-title-author--compact')}>
      <PlayerMarqueeTitle href={`/library/${libraryId}/item/${streamLibraryItem.id}`} text={displayTitle} onNavigate={handleNavigate} />
      <div className="player-author text-foreground-muted flex min-w-0 items-center overflow-hidden">
        <span className="material-symbols shrink-0 text-sm">person</span>
        {hasAuthorLine ? (
          <PlayerAuthorLine libraryId={libraryId} bookAuthors={bookAuthors} podcastAuthor={podcastAuthor} onNavigate={handleNavigate} />
        ) : (
          <span className="shrink-0 ps-1">{t('LabelUnknown')}</span>
        )}
      </div>
      {durationLabel && (
        <div className="player-duration text-foreground-muted flex shrink-0 items-center gap-1">
          <span className="material-symbols text-foreground-muted shrink-0 text-xs">schedule</span>
          <span className="ps-0.5 font-mono">{durationLabel}</span>
        </div>
      )}
    </div>
  )
}
