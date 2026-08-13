'use client'

import { useRef } from 'react'
import PlayerFullscreenArtwork, { useFittedCoverWidth, type JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenTitle from './PlayerFullscreenTitle'
import PlayerFullscreenTrackStack from './PlayerFullscreenTrackStack'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenLandscapeLayoutProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  coverSrc: string
  coverAspectRatio: number
  jumpBurst: JumpBurst | null
  onMinimize: () => void
}

/**
 * A phone held sideways has roughly a third of the vertical room, so stacking artwork over a
 * control bar clips the top and starves the middle. Here the two sit side by side instead:
 * the artwork takes the height it can get, and everything else lives in a scrollable column
 * next to it with no separate bottom bar to eat the remaining space.
 */
export default function PlayerFullscreenLandscapeLayout({
  controls,
  metadata,
  coverSrc,
  coverAspectRatio,
  jumpBurst,
  onMinimize
}: PlayerFullscreenLandscapeLayoutProps) {
  const { playerHandler, streamLibraryItem } = controls

  // Nothing sits under the artwork in this layout, so the whole column height is available
  const stageRef = useRef<HTMLDivElement>(null)
  const coverWidth = useFittedCoverWidth(stageRef, coverAspectRatio, 0)

  return (
    <div
      className="player-fullscreen-pane relative z-10 flex min-h-0 grow items-stretch gap-4 pt-12 pb-3"
      // Landscape puts the notch and the home indicator on the sides, not the top
      style={{
        paddingInlineStart: 'calc(env(safe-area-inset-left) + 1rem)',
        paddingInlineEnd: 'calc(env(safe-area-inset-right) + 1rem)'
      }}
    >
      {/* basis-0 on both columns: the artwork column must not size itself from the artwork it
          is measuring for, or the measurement feeds back into its own input */}
      <div ref={stageRef} className="flex min-w-0 flex-1 basis-0 items-center justify-center">
        <PlayerFullscreenArtwork coverSrc={coverSrc} coverWidth={coverWidth} coverAspectRatio={coverAspectRatio} jumpBurst={jumpBurst} />
      </div>

      <div className="flex min-w-0 flex-1 basis-0 flex-col justify-center gap-2 overflow-y-auto">
        <PlayerFullscreenTitle streamLibraryItem={streamLibraryItem} metadata={metadata} onNavigate={onMinimize} compact />
        <PlayerFullscreenTrackStack playerHandler={playerHandler} />
        <PlayerTransportControls controls={controls} />
        <PlayerSecondaryToolbar controls={controls} />
      </div>
    </div>
  )
}
