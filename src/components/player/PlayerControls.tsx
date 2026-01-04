import type { UsePlayerHandlerReturn } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { PlayerState } from '@/types/api'
import IconBtn from '../ui/IconBtn'
import Tooltip from '../ui/Tooltip'

interface PlayerControlsProps {
  playerHandler: UsePlayerHandlerReturn
}

export default function PlayerControls({ playerHandler }: PlayerControlsProps) {
  const t = useTypeSafeTranslations()
  const { jumpBackward, jumpForward, playPause, seek } = playerHandler.controls
  const { nextChapter, previousChapter, currentChapter, playerState, currentTime } = playerHandler.state

  const isPlaying = playerState === PlayerState.PLAYING
  const isLoading = playerState === PlayerState.LOADING

  // TODO: Setup when jump times are implemented
  const jumpBackwardTooltipText = 'Temp placeholder'
  const jumpForwardTooltipText = 'Temp placeholder'

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
    <div className="flex items-center gap-4">
      {/* previous chapter */}
      <Tooltip text={t('ButtonPreviousChapter')} position="top">
        <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={handlePreviousChapter}>
          first_page
        </IconBtn>
      </Tooltip>
      {/* jump backward */}
      <Tooltip text={jumpBackwardTooltipText} position="top">
        <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={jumpBackward}>
          replay
        </IconBtn>
      </Tooltip>
      {/* play/pause */}
      <IconBtn borderless size="custom" loading={isLoading} className="w-10 h-10 text-3xl" onClick={playPause}>
        {isPlaying ? 'pause' : 'play_arrow'}
      </IconBtn>
      {/* jump forward */}
      <Tooltip text={jumpForwardTooltipText} position="top">
        <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={jumpForward}>
          forward_media
        </IconBtn>
      </Tooltip>
      {/* next chapter */}
      <Tooltip text={t('ButtonNextChapter')} position="top">
        <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={handleNextChapter}>
          last_page
        </IconBtn>
      </Tooltip>
    </div>
  )
}
