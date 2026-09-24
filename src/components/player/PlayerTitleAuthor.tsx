'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import PlayerMarqueeAuthorLine from './PlayerMarqueeAuthorLine'
import PlayerMarqueeTitle from './PlayerMarqueeTitle'

const PLAYER_TITLE_AUTHOR_MINI_CLASS =
  'absolute z-3 flex min-h-(--cover-image-height-collapsed) min-w-0 flex-col justify-center gap-0.5 text-start start-(--title-ps) end-(--title-pe) top-(--player-mini-content-top) lg:w-auto lg:max-w-none lg:justify-start'

const PLAYER_TITLE_AUTHOR_FULLSCREEN_CLASS = 'static flex w-full min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 text-center lg:w-3/4 lg:max-w-3xl'
const PLAYER_TITLE_AUTHOR_LANDSCAPE_CLASS =
  'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-0.5 overflow-hidden text-center'
const PLAYER_AUTHOR_FULLSCREEN_CLASS = 'text-base'
const PLAYER_AUTHOR_LANDSCAPE_CLASS = 'col-start-1 row-start-2 min-w-0 max-w-full justify-self-stretch overflow-hidden text-start'
const PLAYER_DURATION_FULLSCREEN_CLASS = 'text-base'
const PLAYER_DURATION_LANDSCAPE_CLASS = 'col-start-2 row-start-2 justify-self-end whitespace-nowrap'

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
  isLandscapeCompact?: boolean
  onNavigateAway: () => void
  compact?: boolean
}

export default function PlayerTitleAuthor({
  streamLibraryItem,
  metadata,
  isFullscreen,
  isLandscapeCompact = false,
  onNavigateAway,
  compact = false
}: PlayerTitleAuthorProps) {
  const t = useTypeSafeTranslations()
  const { displayTitle, bookAuthors, podcastAuthor, durationLabel } = metadata
  const libraryId = streamLibraryItem.libraryId

  const handleNavigate = isFullscreen ? onNavigateAway : undefined
  const hasAuthorLine = Boolean(podcastAuthor || bookAuthors.length > 0)

  return (
    <div
      className={mergeClasses(
        'player-title-author',
        isFullscreen
          ? mergeClasses(PLAYER_TITLE_AUTHOR_FULLSCREEN_CLASS, isLandscapeCompact && PLAYER_TITLE_AUTHOR_LANDSCAPE_CLASS)
          : PLAYER_TITLE_AUTHOR_MINI_CLASS
      )}
    >
      <PlayerMarqueeTitle
        href={`/library/${libraryId}/item/${streamLibraryItem.id}`}
        text={displayTitle}
        isFullscreen={isFullscreen}
        isLandscapeCompact={isLandscapeCompact}
        onNavigate={handleNavigate}
      />
      <div
        className={mergeClasses(
          'player-author text-foreground-muted flex max-w-full min-w-0 items-center overflow-hidden',
          compact && 'hidden',
          isFullscreen
            ? mergeClasses(PLAYER_AUTHOR_FULLSCREEN_CLASS, isLandscapeCompact && PLAYER_AUTHOR_LANDSCAPE_CLASS)
            : 'w-auto max-w-full self-start text-xs leading-tight lg:text-sm'
        )}
      >
        <span className="material-symbols shrink-0 text-sm">person</span>
        {hasAuthorLine ? (
          <PlayerMarqueeAuthorLine
            libraryId={libraryId}
            bookAuthors={bookAuthors}
            podcastAuthor={podcastAuthor}
            isFullscreen={isFullscreen}
            onNavigate={handleNavigate}
          />
        ) : (
          <span className="shrink-0 ps-1">{t('LabelUnknown')}</span>
        )}
      </div>
      {durationLabel && (
        <div
          className={mergeClasses(
            'player-duration text-foreground-muted flex shrink-0 items-center gap-1',
            compact && 'hidden',
            isFullscreen
              ? mergeClasses(PLAYER_DURATION_FULLSCREEN_CLASS, isLandscapeCompact && PLAYER_DURATION_LANDSCAPE_CLASS)
              : 'self-start text-xs leading-tight lg:text-sm'
          )}
        >
          <span className="material-symbols text-foreground-muted shrink-0 text-xs">schedule</span>
          <span className="ps-0.5 font-mono">{durationLabel}</span>
        </div>
      )}
    </div>
  )
}
