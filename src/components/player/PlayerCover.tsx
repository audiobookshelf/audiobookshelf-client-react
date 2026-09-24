'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import { useCallback } from 'react'
import PreviewCover from '../covers/PreviewCover'

const PLAYER_COVER_MINI_CLASS =
  'absolute z-2 cursor-pointer overflow-hidden rounded-[3px] start-(--cover-ps) top-(--player-mini-content-top) h-(--cover-image-height-collapsed) w-(--cover-image-width-collapsed) *:pointer-events-none *:h-full *:w-full'

const PLAYER_COVER_FULLSCREEN_CLASS =
  'relative z-2 row-start-1 max-w-full flex-none cursor-default self-center justify-self-center overflow-hidden rounded-2xl h-(--cover-image-height) w-(--cover-image-width)'
const PLAYER_COVER_LANDSCAPE_CLASS = 'col-start-1 row-start-1 flex-none self-center justify-self-start'

interface PlayerCoverProps {
  streamLibraryItem: LibraryItem
  coverAspectRatio: number
  onActivate: () => void
}

export default function PlayerCover({ streamLibraryItem, coverAspectRatio, onActivate }: PlayerCoverProps) {
  const t = useTypeSafeTranslations()
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isPlayerFullscreen) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onActivate()
      }
    },
    [isPlayerFullscreen, onActivate]
  )

  return (
    <div
      className={mergeClasses(
        'player-cover',
        isPlayerFullscreen ? mergeClasses(PLAYER_COVER_FULLSCREEN_CLASS, isLandscapeCompact && PLAYER_COVER_LANDSCAPE_CLASS) : PLAYER_COVER_MINI_CLASS
      )}
      data-cy="player-cover"
      role={isPlayerFullscreen ? undefined : 'button'}
      tabIndex={isPlayerFullscreen ? undefined : 0}
      aria-label={isPlayerFullscreen ? undefined : t('LabelExpandPlayer')}
      onClick={isPlayerFullscreen ? undefined : onActivate}
      onKeyDown={handleKeyDown}
    >
      <PreviewCover
        src={getLibraryItemCoverSrc(streamLibraryItem, getPlaceholderCoverUrl())}
        bookCoverAspectRatio={coverAspectRatio}
        showResolution={false}
        fill
      />
    </div>
  )
}
