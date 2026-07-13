'use client'

import { mergeClasses } from '@/lib/merge-classes'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerDetailsPanelProps {
  controls: PlayerControlsState
  isExpanded: boolean
}

export default function PlayerDetailsPanel({ controls, isExpanded }: PlayerDetailsPanelProps) {
  const { sleepTimer } = controls
  const { sleepTimerSet, remainingString } = sleepTimer

  return (
    <div className={mergeClasses('grid transition-[grid-template-rows] duration-200 ease-out', isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
      <div className="overflow-hidden">
        <div className="flex flex-col gap-2 pt-2 pb-1">
          <PlayerSecondaryToolbar controls={controls} />
          {sleepTimerSet && (
            <div className="flex justify-end">
              <span className="text-warning text-xs font-semibold">{remainingString}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
