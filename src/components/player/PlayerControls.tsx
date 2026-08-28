'use client'

import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerControlsProps {
  controls: PlayerControlsState
}

/** Desktop layout: transport centered with secondary toolbar on the right. */
export default function PlayerControls({ controls }: PlayerControlsProps) {
  return (
    <div className="mt-10 flex items-center">
      <div className="min-w-0 flex-1" />
      <PlayerTransportControls controls={controls} />
      <div className="flex min-w-0 flex-1 justify-end">
        <PlayerSecondaryToolbar controls={controls} />
      </div>
    </div>
  )
}
