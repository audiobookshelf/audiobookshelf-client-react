'use client'

import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem } from '@/types/api'
import IconBtn from '../ui/IconBtn'
import PlayerMetadataBlock, { type PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTrackBar from './PlayerTrackBar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerMobileLayoutProps {
  controls: PlayerControlsState
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  onClose: () => void
  onCoverActivate: () => void
}

export default function PlayerMobileLayout({ controls, streamLibraryItem, metadata, onClose, onCoverActivate }: PlayerMobileLayoutProps) {
  const t = useTypeSafeTranslations()
  const coverAspectRatio = useBookCoverAspectRatio()
  const { isPlayerDetailsExpanded, setPlayerDetailsExpanded } = useMediaContext()

  const toggleDetails = () => setPlayerDetailsExpanded(!isPlayerDetailsExpanded)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        {/* Tapping the artwork opens fullscreen — a 56px-wide target instead of a 36px icon */}
        <PlayerMetadataBlock
          streamLibraryItem={streamLibraryItem}
          metadata={metadata}
          coverAspectRatio={coverAspectRatio}
          coverWidth={56}
          compact
          onCoverActivate={onCoverActivate}
        />
        <div className="flex shrink-0 items-center">
          <IconBtn
            size="custom"
            borderless
            className="h-11 w-11"
            iconClass="text-3xl"
            onClick={toggleDetails}
            ariaLabel={isPlayerDetailsExpanded ? t('LabelLess') : t('LabelMoreInfo')}
          >
            {isPlayerDetailsExpanded ? 'expand_less' : 'expand_more'}
          </IconBtn>
          <IconBtn size="custom" borderless className="h-11 w-11" iconClass="text-2xl" onClick={onClose} ariaLabel={t('LabelClosePlayer')}>
            close
          </IconBtn>
        </div>
      </div>

      <PlayerTransportControls controls={controls} />

      <div className="mt-2">
        <PlayerTrackBar playerHandler={controls.playerHandler} variant="mobile-collapsed" />
      </div>

      <div
        className={mergeClasses('grid transition-[grid-template-rows] duration-200 ease-out', isPlayerDetailsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2 pt-2 pb-1">
            <PlayerSecondaryToolbar controls={controls} />
          </div>
        </div>
      </div>
    </div>
  )
}
