'use client'

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
  isFullscreen: boolean
  isLandscapeCompact?: boolean
  onActivate: () => void
}

export default function PlayerCover({ streamLibraryItem, coverAspectRatio, isFullscreen, isLandscapeCompact = false, onActivate }: PlayerCoverProps) {
  const t = useTypeSafeTranslations()

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isFullscreen) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onActivate()
      }
    },
    [isFullscreen, onActivate]
  )

  return (
    <div
      className={mergeClasses(
        'player-cover',
        isFullscreen ? mergeClasses(PLAYER_COVER_FULLSCREEN_CLASS, isLandscapeCompact && PLAYER_COVER_LANDSCAPE_CLASS) : PLAYER_COVER_MINI_CLASS
      )}
      data-cy="player-cover"
      role={isFullscreen ? undefined : 'button'}
      tabIndex={isFullscreen ? undefined : 0}
      aria-label={isFullscreen ? undefined : t('LabelExpandPlayer')}
      onClick={isFullscreen ? undefined : onActivate}
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
