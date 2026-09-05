'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerTransportControlsProps {
  controls: PlayerControlsState
  /** Mobile mini bar: jump back + play only, beside the title row. */
  variant?: 'mini' | 'full'
}

export default function PlayerTransportControls({ controls, variant = 'full' }: PlayerTransportControlsProps) {
  const {
    isLoading,
    isPlaying,
    hasNext,
    handlePreviousChapter,
    handleNextChapter,
    jumpBackward,
    jumpForward,
    playPause,
    jumpBackwardTooltipText,
    jumpForwardTooltipText,
    nextButtonTooltipText,
    previousButtonTooltipText
  } = controls

  const isMini = variant === 'mini'

  return (
    <div className={isMini ? 'player-transport player-transport--mini' : 'player-transport'}>
      {!isMini && (
        <div className="player-chapter-slot">
          <Tooltip text={previousButtonTooltipText} position="top">
            <IconBtn borderless size="custom" className="player-jump-btn cursor-pointer" onClick={handlePreviousChapter}>
              first_page
            </IconBtn>
          </Tooltip>
        </div>
      )}
      <Tooltip text={jumpBackwardTooltipText} position="top">
        <IconBtn borderless size="custom" className="player-jump-btn player-transport-jump-back cursor-pointer" onClick={jumpBackward}>
          replay
        </IconBtn>
      </Tooltip>
      <IconBtn
        borderless
        size="custom"
        loading={isLoading}
        outlined={false}
        className="player-play-btn bg-accent text-primary hover:text-primary hover:not-disabled:text-primary cursor-pointer rounded-full"
        onClick={playPause}
      >
        {isPlaying ? 'pause' : 'play_arrow'}
      </IconBtn>
      {!isMini && (
        <>
          <Tooltip text={jumpForwardTooltipText} position="top">
            <IconBtn borderless size="custom" className="player-jump-btn cursor-pointer" onClick={jumpForward}>
              forward_media
            </IconBtn>
          </Tooltip>
          <div className="player-chapter-slot">
            <Tooltip text={nextButtonTooltipText} position="top">
              <IconBtn borderless size="custom" className="player-jump-btn cursor-pointer" disabled={!hasNext} onClick={handleNextChapter}>
                last_page
              </IconBtn>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  )
}
