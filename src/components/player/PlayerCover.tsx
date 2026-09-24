'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import { useCallback } from 'react'
import PreviewCover from '../covers/PreviewCover'

const COVER_MINI =
  'absolute z-2 cursor-pointer overflow-hidden rounded-[3px] start-(--cover-ps) top-(--mini-content-top) h-(--cover-h-mini) w-(--cover-w-mini) *:pointer-events-none *:h-full *:w-full'

const COVER_FS =
  'relative z-2 row-start-1 max-w-full flex-none cursor-default self-center justify-self-center overflow-hidden rounded-2xl h-(--cover-h) w-(--cover-w)'
const COVER_LANDSCAPE = 'col-start-1 row-start-1 flex-none self-center justify-self-start'

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
      className={mergeClasses('player-cover', isPlayerFullscreen ? mergeClasses(COVER_FS, isLandscapeCompact && COVER_LANDSCAPE) : COVER_MINI)}
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
