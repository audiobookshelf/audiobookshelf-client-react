'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import { useCallback, useLayoutEffect, useRef } from 'react'
import PreviewCover from '../covers/PreviewCover'

const COVER_MINI =
  'absolute z-2 cursor-pointer overflow-hidden rounded-[3px] start-(--cover-ps) top-(--mini-content-top) h-(--cover-h-mini) w-(--cover-w-mini) *:pointer-events-none *:h-full *:w-full'

const COVER_FS = 'relative z-2 max-w-full flex-none cursor-default overflow-hidden rounded-2xl *:h-full *:w-full'
const COVER_LANDSCAPE = 'col-start-1 row-start-1 self-center justify-self-start'
const COVER_SLOT_FS =
  'player-cover-slot relative z-2 row-start-1 flex h-full min-h-0 w-full min-w-0 items-center justify-center self-stretch justify-self-center lg:w-3/4 lg:max-w-3xl'

interface PlayerCoverProps {
  streamLibraryItem: LibraryItem
  coverAspectRatio: number
  onActivate: () => void
}

function applyCoverNaturalSize(cover: HTMLElement) {
  const img = cover.querySelector('img')
  if (!(img instanceof HTMLImageElement) || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    cover.style.removeProperty('--cover-nat-w')
    cover.style.removeProperty('--cover-nat-h')
    return
  }
  cover.style.setProperty('--cover-nat-w', `${img.naturalWidth}px`)
  cover.style.setProperty('--cover-nat-h', `${img.naturalHeight}px`)
}

export default function PlayerCover({ streamLibraryItem, coverAspectRatio, onActivate }: PlayerCoverProps) {
  const t = useTypeSafeTranslations()
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const coverRef = useRef<HTMLDivElement>(null)
  const coverSrc = getLibraryItemCoverSrc(streamLibraryItem, getPlaceholderCoverUrl())

  useLayoutEffect(() => {
    const cover = coverRef.current
    if (!cover) return
    const img = cover.querySelector('img')
    applyCoverNaturalSize(cover)
    if (!(img instanceof HTMLImageElement)) return
    const apply = () => applyCoverNaturalSize(cover)
    img.addEventListener('load', apply)
    return () => img.removeEventListener('load', apply)
  }, [coverSrc])

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

  const cover = (
    <div
      ref={coverRef}
      className={mergeClasses('player-cover', isPlayerFullscreen ? mergeClasses(COVER_FS, isLandscapeCompact && COVER_LANDSCAPE) : COVER_MINI)}
      data-cy="player-cover"
      role={isPlayerFullscreen ? undefined : 'button'}
      tabIndex={isPlayerFullscreen ? undefined : 0}
      aria-label={isPlayerFullscreen ? undefined : t('LabelExpandPlayer')}
      onClick={isPlayerFullscreen ? undefined : onActivate}
      onKeyDown={handleKeyDown}
    >
      <PreviewCover src={coverSrc} bookCoverAspectRatio={coverAspectRatio} showResolution={false} fill />
    </div>
  )

  if (isPlayerFullscreen && !isLandscapeCompact) {
    return <div className={COVER_SLOT_FS}>{cover}</div>
  }

  return cover
}
