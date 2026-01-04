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
  const { jumpBackward, jumpForward, playPause } = playerHandler.controls
  const playerState = playerHandler.state.playerState
  const isPlaying = playerState === PlayerState.PLAYING
  const isLoading = playerState === PlayerState.LOADING

  // TODO: Setup when jump times are implemented
  const jumpBackwardTooltipText = 'Temp placeholder'
  const jumpForwardTooltipText = 'Temp placeholder'

  return (
    <div className="flex items-center gap-4">
      {/* previous chapter */}
      <Tooltip text={t('ButtonPreviousChapter')} position="top">
        <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={jumpBackward}>
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
        <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={jumpForward}>
          last_page
        </IconBtn>
      </Tooltip>
    </div>
  )
}
