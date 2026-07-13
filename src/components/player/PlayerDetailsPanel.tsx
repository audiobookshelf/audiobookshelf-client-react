'use client'

import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { mergeClasses } from '@/lib/merge-classes'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerDetailsPanelProps {
  controls: PlayerControlsState
  playerHandler: PlayerHandler
  isExpanded: boolean
}

export default function PlayerDetailsPanel({ controls, playerHandler, isExpanded }: PlayerDetailsPanelProps) {
  const { chapters, sleepTimer } = controls
  const { currentChapter, currentTime, duration, settings } = playerHandler.state
  const { useChapterTrack } = settings
  const { sleepTimerSet, remainingString } = sleepTimer

  const currentChapterDuration = currentChapter ? currentChapter.end - currentChapter.start : 0
  const currentChapterStart = currentChapter ? currentChapter.start : 0
  const effectiveDuration = useChapterTrack ? currentChapterDuration : duration
  const playedTime = useChapterTrack ? Math.max(0, currentTime - currentChapterStart) : currentTime
  const playedPercent = effectiveDuration ? Math.min(100, Math.round((playedTime / effectiveDuration) * 100)) : 0
  const currentChapterNumber = currentChapter ? chapters.findIndex((ch) => ch.id === currentChapter.id) + 1 : null

  return (
    <div className={mergeClasses('grid transition-[grid-template-rows] duration-200 ease-out', isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
      <div className="overflow-hidden">
        <div className="flex flex-col gap-2 pt-2 pb-1">
          <PlayerSecondaryToolbar controls={controls} />
          <div className="text-foreground-muted flex items-center justify-between gap-2 text-xs">
            {currentChapter ? (
              <div className="flex min-w-0 flex-1 items-center">
                <TruncatingTooltipText text={currentChapter.title} className="min-w-0 flex-1 text-xs" position="top" />
                {useChapterTrack && currentChapterNumber !== null && (
                  <span className="text-foreground-subdued shrink-0 pl-1">
                    ({currentChapterNumber} of {chapters.length})
                  </span>
                )}
              </div>
            ) : (
              <span className="flex-1" />
            )}
            <div className="flex shrink-0 items-center gap-2">
              {sleepTimerSet && <span className="text-warning font-semibold">{remainingString}</span>}
              <span className="font-mono">{playedPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
