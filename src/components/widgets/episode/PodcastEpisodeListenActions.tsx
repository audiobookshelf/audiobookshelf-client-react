import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import EpisodePlayButton from '@/components/widgets/episode/EpisodePlayButton'
import { EPISODE_ROW_ACTION_BTN_CLASS } from '@/lib/episode'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'

interface PodcastEpisodeListenActionsProps {
  playButtonLabel: string
  isPlaying: boolean
  isFinished: boolean
  isProcessingFinished?: boolean
  showQueueButton?: boolean
  isQueued?: boolean
  onPlay: (e: React.MouseEvent) => void
  onQueueToggle?: (e: React.MouseEvent) => void
  onToggleFinished: () => void
  onAddToPlaylist: (e: React.MouseEvent) => void
}

export default function PodcastEpisodeListenActions({
  playButtonLabel,
  isPlaying,
  isFinished,
  isProcessingFinished = false,
  showQueueButton = false,
  isQueued = false,
  onPlay,
  onQueueToggle,
  onToggleFinished,
  onAddToPlaylist
}: PodcastEpisodeListenActionsProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="flex items-center gap-1">
      <EpisodePlayButton label={playButtonLabel} isPlaying={isPlaying} isFinished={isFinished} onClick={onPlay} />

      {showQueueButton && onQueueToggle && (
        <Tooltip lazy position="top" text={isQueued ? t('MessageRemoveFromPlayerQueue') : t('MessageAddToPlayerQueue')}>
          <span onClick={(e) => e.stopPropagation()}>
            <IconBtn
              borderless
              className={mergeClasses(EPISODE_ROW_ACTION_BTN_CLASS, isQueued && 'text-success hover:not-disabled:text-success')}
              onClick={onQueueToggle}
            >
              {isQueued ? 'playlist_add_check' : 'playlist_play'}
            </IconBtn>
          </span>
        </Tooltip>
      )}

      <Tooltip lazy position="top" text={isFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')}>
        <span onClick={(e) => e.stopPropagation()}>
          <ReadIconBtn
            borderless
            disabled={isProcessingFinished}
            isRead={isFinished}
            size="custom"
            className={EPISODE_ROW_ACTION_BTN_CLASS}
            onClick={onToggleFinished}
          />
        </span>
      </Tooltip>

      <Tooltip lazy position="top" text={t('LabelAddToPlaylist')}>
        <span onClick={(e) => e.stopPropagation()}>
          <IconBtn borderless className={EPISODE_ROW_ACTION_BTN_CLASS} ariaLabel={t('LabelAddToPlaylist')} onClick={onAddToPlaylist}>
            playlist_add
          </IconBtn>
        </span>
      </Tooltip>
    </div>
  )
}
