import type { UsePlayerHandlerReturn } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { PlayerState } from '@/types/api'
import { useState } from 'react'
import IconBtn from '../ui/IconBtn'
import Tooltip from '../ui/Tooltip'
import PlaybackRateWidget from './PlaybackRateWidget'
import PlayerSettingsModal from './PlayerSettingsModal'

interface PlayerControlsProps {
  playerHandler: UsePlayerHandlerReturn
}

export default function PlayerControls({ playerHandler }: PlayerControlsProps) {
  const t = useTypeSafeTranslations()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const { jumpBackward, jumpForward, playPause, seek } = playerHandler.controls
  const { nextChapter, previousChapter, currentChapter, playerState, currentTime, settings } = playerHandler.state

  const isPlaying = playerState === PlayerState.PLAYING
  const isLoading = playerState === PlayerState.LOADING

  const getJumpTooltipText = (prefix: string, jumpTime: number) => {
    const timeText = jumpTime <= 60 ? t('LabelTimeDurationXSeconds', { 0: jumpTime }) : t('LabelTimeDurationXMinutes', { 0: jumpTime / 60 })
    return `${prefix} - ${timeText}`
  }

  const jumpBackwardTooltipText = getJumpTooltipText(t('ButtonJumpBackward'), settings.jumpBackwardAmount)
  const jumpForwardTooltipText = getJumpTooltipText(t('ButtonJumpForward'), settings.jumpForwardAmount)

  const handleNextChapter = () => {
    if (nextChapter) {
      seek(nextChapter.start)
    } else {
      // TODO: Implement next in queue
    }
  }

  const handlePreviousChapter = () => {
    if (previousChapter) {
      // if time in current chapter is less than 3 seconds then seek to start of previous chapter
      // otherwise seek to start of current chapter
      const currentChapterStart = currentChapter?.start ?? 0
      const timeInCurrentChapter = currentTime - currentChapterStart
      if (timeInCurrentChapter <= 3) {
        seek(previousChapter.start)
      } else {
        seek(currentChapterStart)
      }
    } else {
      seek(0)
    }
  }

  return (
    <>
      <div className="flex items-center mt-10">
        {/* Left spacer */}
        <div className="flex-1 min-w-0" />

        {/* Center - play controls */}
        <div className="flex items-center gap-4 shrink-0">
          {/* previous chapter */}
          <Tooltip text={t('ButtonPreviousChapter')} position="top">
            <IconBtn borderless size="custom" className="w-10 text-3xl cursor-pointer" onClick={handlePreviousChapter}>
              first_page
            </IconBtn>
          </Tooltip>
          {/* jump backward */}
          <Tooltip text={jumpBackwardTooltipText} position="top">
            <IconBtn borderless size="custom" className="w-10 text-3xl cursor-pointer" onClick={jumpBackward}>
              replay
            </IconBtn>
          </Tooltip>
          {/* play/pause */}
          <IconBtn
            borderless
            size="custom"
            loading={isLoading}
            outlined={false}
            className="w-10 h-10 bg-accent text-primary hover:text-primary hover:not-disabled:text-primary rounded-full text-2xl cursor-pointer"
            onClick={playPause}
          >
            {isPlaying ? 'pause' : 'play_arrow'}
          </IconBtn>
          {/* jump forward */}
          <Tooltip text={jumpForwardTooltipText} position="top">
            <IconBtn borderless size="custom" className="w-10 text-3xl cursor-pointer" onClick={jumpForward}>
              forward_media
            </IconBtn>
          </Tooltip>
          {/* next chapter */}
          <Tooltip text={t('ButtonNextChapter')} position="top">
            <IconBtn borderless size="custom" className="w-10 text-3xl cursor-pointer" onClick={handleNextChapter}>
              last_page
            </IconBtn>
          </Tooltip>
        </div>

        {/* Right section settings buttons */}
        <div className="flex-1 min-w-0 flex justify-end">
          <div className="flex items-center gap-4">
            {/* playback rate widget */}
            <PlaybackRateWidget playerHandler={playerHandler} />
            {/* player settings button */}
            <Tooltip text={t('LabelViewPlayerSettings')} position="top">
              <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={() => setIsSettingsModalOpen(true)} ariaLabel={t('LabelViewPlayerSettings')}>
                settings_slow_motion
              </IconBtn>
            </Tooltip>
          </div>
        </div>
      </div>
      <PlayerSettingsModal
        isOpen={isSettingsModalOpen}
        settings={playerHandler.state.settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateSettings={playerHandler.controls.updateSettings}
      />
    </>
  )
}
