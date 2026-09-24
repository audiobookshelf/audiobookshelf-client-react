'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import PlayerMarqueeAuthorLine from './PlayerMarqueeAuthorLine'
import PlayerMarqueeTitle from './PlayerMarqueeTitle'

const PLAYER_TITLE_AUTHOR_MINI_CLASS =
  'absolute z-3 flex min-h-(--cover-image-height-collapsed) min-w-0 flex-col justify-center gap-0.5 text-start start-(--title-ps) end-(--title-pe) top-(--player-mini-content-top) lg:w-auto lg:max-w-none lg:justify-start'

const PLAYER_TITLE_AUTHOR_FULLSCREEN_CLASS = mergeClasses(
  'static flex w-full min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 text-center lg:w-3/4 lg:max-w-3xl',
  'pslc:grid pslc:grid-cols-[minmax(0,1fr)_auto] pslc:grid-rows-[auto_auto] pslc:items-center pslc:gap-x-2 pslc:gap-y-0.5 pslc:overflow-hidden pslc:text-center'
)

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
    <div className={mergeClasses('player-title-author', isFullscreen ? PLAYER_TITLE_AUTHOR_FULLSCREEN_CLASS : PLAYER_TITLE_AUTHOR_MINI_CLASS)}>
      <PlayerMarqueeTitle
        href={`/library/${libraryId}/item/${streamLibraryItem.id}`}
        text={displayTitle}
        isFullscreen={isFullscreen}
        onNavigate={handleNavigate}
      />
      <div
        className={mergeClasses(
          'player-author text-foreground-muted flex max-w-full min-w-0 items-center overflow-hidden',
          compact && 'hidden',
          isFullscreen
            ? 'pslc:col-start-1 pslc:row-start-2 pslc:min-w-0 pslc:max-w-full pslc:justify-self-stretch pslc:overflow-hidden pslc:text-start text-base'
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
              ? 'pslc:col-start-2 pslc:row-start-2 pslc:justify-self-end pslc:whitespace-nowrap text-base'
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
