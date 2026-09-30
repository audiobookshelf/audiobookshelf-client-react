'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import PlayerMarqueeAuthorLine from './PlayerMarqueeAuthorLine'
import PlayerMarqueeText from './PlayerMarqueeText'
import { layoutClass, playerShellVariant, type LayoutClasses } from './playerShellClasses'

const TITLE_AUTHOR: LayoutClasses = {
  mini: 'z-3 flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-start',
  fullscreen: 'static flex w-full min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 text-center lg:w-3/4 lg:max-w-3xl',
  /* The landscape column clips overflow, and this block is flush with its top edge. */
  landscape: 'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-0.5 pt-1 text-center'
}
const TITLE: LayoutClasses = {
  /* Flex so the scrolling marquee's outline padding does not grow this row. */
  root: 'flex min-w-0',
  mini: 'w-max max-w-full min-w-0 self-start text-sm leading-snug lg:text-lg',
  fullscreen: 'w-full max-w-full min-w-0 self-stretch text-xl',
  /* Start padding keeps the scrolling outline inside the landscape column, which clips overflow. */
  landscape: 'col-span-full ps-1'
}
const AUTHOR: LayoutClasses = {
  root: 'text-foreground-muted flex max-w-full min-w-0 items-center',
  mini: 'w-auto max-w-full self-start text-xs leading-tight lg:text-sm',
  fullscreen: 'text-base',
  landscape: 'col-start-1 row-start-2 min-w-0 max-w-full justify-self-stretch text-start'
}
const DURATION: LayoutClasses = {
  root: 'text-foreground-muted flex shrink-0 items-center gap-1',
  mini: 'self-start text-xs leading-tight lg:text-sm',
  fullscreen: 'text-base',
  landscape: 'col-start-2 row-start-2 justify-self-end whitespace-nowrap'
}

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
  const layout = playerShellVariant(isPlayerFullscreen, isLandscapeCompact)
  const { displayTitle, bookAuthors, podcastAuthor, durationLabel } = metadata
  const libraryId = streamLibraryItem.libraryId

  const handleNavigate = isPlayerFullscreen ? onNavigateAway : undefined
  const hasAuthorLine = Boolean(podcastAuthor || bookAuthors.length > 0)

  return (
    <div className={mergeClasses('player-title-author', layoutClass(TITLE_AUTHOR, layout))}>
      <div className={layoutClass(TITLE, layout)}>
        <PlayerMarqueeText href={`/library/${libraryId}/item/${streamLibraryItem.id}`} text={displayTitle} onNavigate={handleNavigate} />
      </div>
      <div className={mergeClasses('player-author', layoutClass(AUTHOR, layout), compact && 'hidden')}>
        <span className="material-symbols shrink-0 text-sm">person</span>
        {hasAuthorLine ? (
          <PlayerMarqueeAuthorLine libraryId={libraryId} bookAuthors={bookAuthors} podcastAuthor={podcastAuthor} onNavigate={handleNavigate} />
        ) : (
          <span className="shrink-0 ps-1">{t('LabelUnknown')}</span>
        )}
      </div>
      {durationLabel && (
        <div className={mergeClasses('player-duration', layoutClass(DURATION, layout), compact && 'hidden')}>
          <span className="material-symbols text-foreground-muted shrink-0 text-xs">schedule</span>
          <span className="ps-0.5 font-mono">{durationLabel}</span>
        </div>
      )}
    </div>
  )
}
