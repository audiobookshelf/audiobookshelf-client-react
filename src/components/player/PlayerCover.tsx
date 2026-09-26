'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import { CSSProperties, useCallback, useState } from 'react'
import PreviewCover from '../covers/PreviewCover'

const COVER_MINI = 'z-2 shrink-0 cursor-pointer overflow-hidden rounded-sm h-(--cover-h-mini) w-(--cover-w-mini) *:pointer-events-none *:h-full *:w-full'

const COVER_FS = 'relative z-2 max-w-full flex-none cursor-default overflow-hidden rounded-2xl *:h-full *:w-full'
const COVER_LANDSCAPE = 'col-start-1 row-start-2 self-center justify-self-start'
const COVER_SLOT_FS =
  'player-cover-slot relative z-2 row-start-1 flex h-full min-h-0 w-full min-w-0 items-center justify-center self-stretch justify-self-center lg:w-3/4 lg:max-w-3xl'

interface PlayerCoverProps {
  streamLibraryItem: LibraryItem
  coverAspectRatio: number
  onActivate: () => void
}

interface CoverNaturalSize {
  width: number
  height: number
}

export default function PlayerCover({ streamLibraryItem, coverAspectRatio, onActivate }: PlayerCoverProps) {
  const t = useTypeSafeTranslations()
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const [naturalSize, setNaturalSize] = useState<CoverNaturalSize | null>(null)
  const coverSrc = getLibraryItemCoverSrc(streamLibraryItem, getPlaceholderCoverUrl())
  const isExpandable = !isPlayerFullscreen

  const handleNaturalSize = useCallback((width: number, height: number) => {
    setNaturalSize((prev) => {
      if (width <= 0 || height <= 0) return null
      if (prev?.width === width && prev?.height === height) return prev
      return { width, height }
    })
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onActivate()
      }
    },
    [onActivate]
  )

  const coverStyle = naturalSize
    ? ({
        '--cover-nat-w': `${naturalSize.width}px`,
        '--cover-nat-h': `${naturalSize.height}px`
      } as CSSProperties)
    : undefined

  return (
    <div className={isPlayerFullscreen && !isLandscapeCompact ? COVER_SLOT_FS : 'contents'}>
      <div
        className={mergeClasses('player-cover', isPlayerFullscreen ? COVER_FS : COVER_MINI, isPlayerFullscreen && isLandscapeCompact && COVER_LANDSCAPE)}
        data-cy="player-cover"
        style={coverStyle}
        role={isExpandable ? 'button' : undefined}
        tabIndex={isExpandable ? 0 : undefined}
        aria-label={isExpandable ? t('LabelExpandPlayer') : undefined}
        onClick={isExpandable ? onActivate : undefined}
        onKeyDown={isExpandable ? handleKeyDown : undefined}
      >
        <PreviewCover src={coverSrc} bookCoverAspectRatio={coverAspectRatio} showResolution={false} fill onNaturalSize={handleNaturalSize} />
      </div>
    </div>
  )
}
