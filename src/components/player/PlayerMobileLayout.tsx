'use client'

import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LibraryItem } from '@/types/api'
import IconBtn from '../ui/IconBtn'
import PlayerDetailsPanel from './PlayerDetailsPanel'
import PlayerMetadataBlock, { type PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerModals from './PlayerModals'
import PlayerTrackBar from './PlayerTrackBar'
import PlayerTransportControls from './PlayerTransportControls'
import { usePlayerControlsState } from './usePlayerControlsState'

interface PlayerMobileLayoutProps {
  playerHandler: PlayerHandler
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  onClose: () => void
}

export default function PlayerMobileLayout({ playerHandler, streamLibraryItem, metadata, onClose }: PlayerMobileLayoutProps) {
  const t = useTypeSafeTranslations()
  const coverAspectRatio = useBookCoverAspectRatio()
  const { isPlayerDetailsExpanded, setPlayerDetailsExpanded } = useMediaContext()
  const controlsState = usePlayerControlsState(playerHandler, streamLibraryItem)

  const toggleDetails = () => setPlayerDetailsExpanded(!isPlayerDetailsExpanded)

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <PlayerMetadataBlock streamLibraryItem={streamLibraryItem} metadata={metadata} coverAspectRatio={coverAspectRatio} coverWidth={56} compact />
          <div className="flex shrink-0 items-center gap-0.5">
            <IconBtn
              size="small"
              borderless
              iconClass="text-3xl"
              onClick={toggleDetails}
              ariaLabel={isPlayerDetailsExpanded ? t('LabelLess') : t('LabelMoreInfo')}
            >
              {isPlayerDetailsExpanded ? 'expand_less' : 'expand_more'}
            </IconBtn>
            <IconBtn size="small" borderless iconClass="text-2xl" onClick={onClose} ariaLabel={t('LabelClosePlayer')}>
              close
            </IconBtn>
          </div>
        </div>

        <PlayerTransportControls controls={controlsState} compact />

        <div className="mt-2">
          <PlayerTrackBar playerHandler={playerHandler} variant="mobile-collapsed" />
        </div>

        <PlayerDetailsPanel controls={controlsState} isExpanded={isPlayerDetailsExpanded} playerHandler={playerHandler} />
      </div>
      <PlayerModals controls={controlsState} />
    </>
  )
}
