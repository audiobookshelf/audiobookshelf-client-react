'use client'

import { useRef } from 'react'
import PlayerFullscreenArtwork, { TITLE_BLOCK_RESERVE, useFittedCoverWidth, type JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenTitle from './PlayerFullscreenTitle'
import PlayerFullscreenTrackStack from './PlayerFullscreenTrackStack'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

/** Centered fullscreen controls column — track stack, transport and title share this width */
const FULLSCREEN_CONTROLS_COLUMN_CLASS = 'mx-auto w-full max-w-[35rem] min-w-0'

interface PlayerFullscreenDesktopLayoutProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  coverSrc: string
  coverAspectRatio: number
  jumpBurst: JumpBurst | null
  onMinimize: () => void
}

export default function PlayerFullscreenDesktopLayout({
  controls,
  metadata,
  coverSrc,
  coverAspectRatio,
  jumpBurst,
  onMinimize
}: PlayerFullscreenDesktopLayoutProps) {
  const { playerHandler, streamLibraryItem } = controls

  const stageRef = useRef<HTMLDivElement>(null)
  const coverWidth = useFittedCoverWidth(stageRef, coverAspectRatio, TITLE_BLOCK_RESERVE)

  return (
    <>
      <div ref={stageRef} className="relative z-10 flex min-h-0 grow flex-col items-center justify-center gap-5 overflow-hidden px-6 pt-16 pb-2">
        <PlayerFullscreenArtwork coverSrc={coverSrc} coverWidth={coverWidth} coverAspectRatio={coverAspectRatio} jumpBurst={jumpBurst} />

        <div className={FULLSCREEN_CONTROLS_COLUMN_CLASS}>
          <PlayerFullscreenTitle streamLibraryItem={streamLibraryItem} metadata={metadata} onNavigate={onMinimize} />
        </div>
      </div>

      <div className="bg-black-700 relative z-10 shrink-0 px-10 pt-3 pb-6">
        {/* One centered column: the secondary toolbar carries speed, sleep timer and the rest,
            so there is no second copy of those controls anywhere in the view */}
        <div className={FULLSCREEN_CONTROLS_COLUMN_CLASS}>
          <PlayerFullscreenTrackStack playerHandler={playerHandler} />
          <div className="mt-3">
            <PlayerTransportControls controls={controls} hero />
          </div>
          <div className="mt-3">
            <PlayerSecondaryToolbar controls={controls} />
          </div>
        </div>
      </div>
    </>
  )
}
