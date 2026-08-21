'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerTransportControlsProps {
  controls: PlayerControlsState
  /** Fullscreen player — scales controls up beyond the mini player bar */
  hero?: boolean
}

export default function PlayerTransportControls({ controls, hero = false }: PlayerTransportControlsProps) {
  const {
    t,
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

  const jumpIconClass = hero ? 'text-4xl' : undefined
  const chapterIconClass = hero ? 'text-3xl' : undefined
  const jumpBtnClass = hero ? 'h-12 w-12' : undefined
  const chapterBtnClass = hero ? 'h-11 w-11' : undefined
  const playBtnClass = mergeClasses('bg-accent text-primary hover:text-primary hover:not-disabled:text-primary rounded-full', hero && 'h-16 w-16 text-4xl')

  return (
    <div className={mergeClasses('flex items-center justify-center gap-4', hero && 'sm:gap-6')}>
      {/* Tooltip only sets aria-describedby, so each button still needs its own label —
          the icon glyph is aria-hidden inside IconBtn */}
      <Tooltip text={previousButtonTooltipText} position="top">
        <IconBtn
          borderless
          size="large"
          iconClass={chapterIconClass}
          className={mergeClasses('cursor-pointer', chapterBtnClass)}
          onClick={handlePreviousChapter}
          ariaLabel={previousButtonTooltipText}
        >
          first_page
        </IconBtn>
      </Tooltip>
      <Tooltip text={jumpBackwardTooltipText} position="top">
        <IconBtn
          borderless
          size="large"
          iconClass={jumpIconClass}
          className={mergeClasses('cursor-pointer', jumpBtnClass)}
          onClick={jumpBackward}
          ariaLabel={jumpBackwardTooltipText}
        >
          replay
        </IconBtn>
      </Tooltip>
      <IconBtn
        borderless
        size={hero ? 'custom' : 'large'}
        loading={isLoading}
        outlined={false}
        className={mergeClasses('cursor-pointer', playBtnClass)}
        onClick={playPause}
        ariaLabel={isPlaying ? t('ButtonPause') : t('ButtonPlay')}
      >
        {isPlaying ? 'pause' : 'play_arrow'}
      </IconBtn>
      <Tooltip text={jumpForwardTooltipText} position="top">
        <IconBtn
          borderless
          size="large"
          iconClass={jumpIconClass}
          className={mergeClasses('cursor-pointer', jumpBtnClass)}
          onClick={jumpForward}
          ariaLabel={jumpForwardTooltipText}
        >
          forward_media
        </IconBtn>
      </Tooltip>
      <Tooltip text={nextButtonTooltipText} position="top">
        <IconBtn
          borderless
          size="large"
          iconClass={chapterIconClass}
          className={mergeClasses('cursor-pointer', chapterBtnClass)}
          disabled={!hasNext}
          onClick={handleNextChapter}
          ariaLabel={nextButtonTooltipText}
        >
          last_page
        </IconBtn>
      </Tooltip>
    </div>
  )
}
