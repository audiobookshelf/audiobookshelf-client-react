'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { LibraryItem } from '@/types/api'
import { useCallback } from 'react'
import PreviewCover from '../covers/PreviewCover'

interface PlayerCoverProps {
  streamLibraryItem: LibraryItem
  coverAspectRatio: number
  isFullscreen: boolean
  onActivate: () => void
}

export default function PlayerCover({ streamLibraryItem, coverAspectRatio, isFullscreen, onActivate }: PlayerCoverProps) {
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
      className="player-cover"
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
