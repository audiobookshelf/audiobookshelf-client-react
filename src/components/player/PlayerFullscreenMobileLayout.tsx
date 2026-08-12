'use client'

import { useRef } from 'react'
import PlayerFullscreenArtwork, { TITLE_BLOCK_RESERVE, useFittedCoverWidth, type JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenTitle from './PlayerFullscreenTitle'
import PlayerFullscreenTrackStack from './PlayerFullscreenTrackStack'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenMobileLayoutProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  coverSrc: string
  coverAspectRatio: number
  jumpBurst: JumpBurst | null
  onMinimize: () => void
}

/**
 * Touch-first fullscreen layout: nothing here is revealed by hover, and every control is a
 * real target in the flow rather than an overlay pinned to the artwork.
 */
export default function PlayerFullscreenMobileLayout({
  controls,
  metadata,
  coverSrc,
  coverAspectRatio,
  jumpBurst,
  onMinimize
}: PlayerFullscreenMobileLayoutProps) {
  const { playerHandler, streamLibraryItem } = controls

  const stageRef = useRef<HTMLDivElement>(null)
  const coverWidth = useFittedCoverWidth(stageRef, coverAspectRatio, TITLE_BLOCK_RESERVE)

  return (
    <>
      <div ref={stageRef} className="relative z-10 flex min-h-0 grow flex-col items-center justify-center gap-5 px-5 pt-16 pb-2">
        <PlayerFullscreenArtwork coverSrc={coverSrc} coverWidth={coverWidth} coverAspectRatio={coverAspectRatio} jumpBurst={jumpBurst} />
        <PlayerFullscreenTitle streamLibraryItem={streamLibraryItem} metadata={metadata} onNavigate={onMinimize} />
      </div>

      {/* Inset on the bar itself, not the overlay root, so its background still reaches the
          bottom edge of the screen rather than leaving a strip of backdrop below it */}
      <div className="bg-black-700 relative z-10 shrink-0 px-4 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}>
        <PlayerFullscreenTrackStack playerHandler={playerHandler} />
        <PlayerTransportControls controls={controls} size="hero" className="mt-4" />
        {/* Same toolbar the mini player uses, so nothing reachable there is missing here */}
        <PlayerSecondaryToolbar controls={controls} size="lg" className="mx-auto mt-3 max-w-[26rem]" />
      </div>
    </>
  )
}
