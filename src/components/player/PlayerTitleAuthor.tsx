'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import PlayerMarqueeAuthorLine from './PlayerMarqueeAuthorLine'
import PlayerMarqueeText from './PlayerMarqueeText'

const TITLE_MINI = 'z-3 flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-start'

const TITLE_FS = 'static flex w-full min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 text-center lg:w-3/4 lg:max-w-3xl'
const TITLE_LANDSCAPE = 'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-0.5 overflow-hidden text-center'
const AUTHOR_FS = 'text-base'
const AUTHOR_LANDSCAPE = 'col-start-1 row-start-2 min-w-0 max-w-full justify-self-stretch overflow-hidden text-start'
const DURATION_FS = 'text-base'
const DURATION_LANDSCAPE = 'col-start-2 row-start-2 justify-self-end whitespace-nowrap'

export interface PlayerMetadataDisplay {
  displayTitle: string
  bookAuthors: { id: string; name: string }[]
  podcastAuthor: string | null
  durationLabel: string | null
}

interface PlayerTitleAuthorProps {
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  onNavigateAway: () => void
  compact?: boolean
}

export default function PlayerTitleAuthor({ streamLibraryItem, metadata, onNavigateAway, compact = false }: PlayerTitleAuthorProps) {
  const t = useTypeSafeTranslations()
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const { displayTitle, bookAuthors, podcastAuthor, durationLabel } = metadata
  const libraryId = streamLibraryItem.libraryId

  const handleNavigate = isPlayerFullscreen ? onNavigateAway : undefined
  const hasAuthorLine = Boolean(podcastAuthor || bookAuthors.length > 0)

  return (
    <div className={mergeClasses('player-title-author', isPlayerFullscreen ? mergeClasses(TITLE_FS, isLandscapeCompact && TITLE_LANDSCAPE) : TITLE_MINI)}>
      <PlayerMarqueeText href={`/library/${libraryId}/item/${streamLibraryItem.id}`} text={displayTitle} onNavigate={handleNavigate} />
      <div
        className={mergeClasses(
          'player-author text-foreground-muted flex max-w-full min-w-0 items-center overflow-hidden',
          compact && 'hidden',
          isPlayerFullscreen ? mergeClasses(AUTHOR_FS, isLandscapeCompact && AUTHOR_LANDSCAPE) : 'w-auto max-w-full self-start text-xs leading-tight lg:text-sm'
        )}
      >
        <span className="material-symbols shrink-0 text-sm">person</span>
        {hasAuthorLine ? (
          <PlayerMarqueeAuthorLine libraryId={libraryId} bookAuthors={bookAuthors} podcastAuthor={podcastAuthor} onNavigate={handleNavigate} />
        ) : (
          <span className="shrink-0 ps-1">{t('LabelUnknown')}</span>
        )}
      </div>
      {durationLabel && (
        <div
          className={mergeClasses(
            'player-duration text-foreground-muted flex shrink-0 items-center gap-1',
            compact && 'hidden',
            isPlayerFullscreen ? mergeClasses(DURATION_FS, isLandscapeCompact && DURATION_LANDSCAPE) : 'self-start text-xs leading-tight lg:text-sm'
          )}
        >
          <span className="material-symbols text-foreground-muted shrink-0 text-xs">schedule</span>
          <span className="ps-0.5 font-mono">{durationLabel}</span>
        </div>
      )}
    </div>
  )
}
