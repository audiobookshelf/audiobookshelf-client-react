'use client'

import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { LibraryItem } from '@/types/api'
import PlayerModals from './PlayerModals'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTransportControls from './PlayerTransportControls'
import { usePlayerControlsState } from './usePlayerControlsState'

interface PlayerControlsProps {
  playerHandler: PlayerHandler
  streamLibraryItem: LibraryItem
}

/** Desktop layout: transport centered with secondary toolbar on the right. */
export default function PlayerControls({ playerHandler, streamLibraryItem }: PlayerControlsProps) {
  const controlsState = usePlayerControlsState(playerHandler, streamLibraryItem)

  return (
    <>
      <div className="mt-10 flex items-center">
        <div className="min-w-0 flex-1" />
        <PlayerTransportControls controls={controlsState} />
        <div className="flex min-w-0 flex-1 justify-end">
          <PlayerSecondaryToolbar controls={controlsState} />
        </div>
      </div>
      <PlayerModals controls={controlsState} />
    </>
  )
}
