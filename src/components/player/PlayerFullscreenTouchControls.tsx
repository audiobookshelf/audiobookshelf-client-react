'use client'

import type { ReactNode } from 'react'
import PlayerFullscreenTrackStack from './PlayerFullscreenTrackStack'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenTouchControlsProps {
  controls: PlayerControlsState
  /**
   * Landscape: size the track bar to the transport row instead of the full controls column,
   * which is wider for the secondary toolbar.
   */
  narrowTrackToTransport?: boolean
  /** Landscape: sits above the track stack and inherits its width */
  titleSlot?: ReactNode
}

/** Track bar, hero transport and lg secondary toolbar — shared by portrait and landscape fullscreen. */
export default function PlayerFullscreenTouchControls({ controls, narrowTrackToTransport = false, titleSlot }: PlayerFullscreenTouchControlsProps) {
  const { playerHandler } = controls

  const trackAndTransport = (
    <>
      <PlayerFullscreenTrackStack playerHandler={playerHandler} />
      <div className="mt-4">
        <PlayerTransportControls controls={controls} hero />
      </div>
    </>
  )

  const toolbar = (
    <div className="mx-auto mt-3">
      <PlayerSecondaryToolbar controls={controls} />
    </div>
  )

  if (narrowTrackToTransport) {
    return (
      <>
        <div className="mx-auto inline-grid max-w-full grid-cols-1">
          {titleSlot ? (
            // w-0 min-w-full: column width comes from the transport row below, not the title text
            <div className="col-start-1 row-start-1 w-0 min-w-full overflow-hidden">{titleSlot}</div>
          ) : null}
          <div className="col-start-1 row-start-2 min-w-0">{trackAndTransport}</div>
        </div>
        {toolbar}
      </>
    )
  }

  return (
    <>
      {trackAndTransport}
      {toolbar}
    </>
  )
}
