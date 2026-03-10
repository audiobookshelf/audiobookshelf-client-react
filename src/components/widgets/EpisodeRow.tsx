import Checkbox from '@/components/ui/Checkbox'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog, { type ConfirmState } from '@/components/widgets/ConfirmDialog'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { elapsedPretty } from '@/lib/timeUtils'
import { MediaProgress, PodcastEpisode } from '@/types/api'
import { useMemo, useState } from 'react'

/** Fixed height of a single episode row (px). Used by EpisodeTable virtualizer and minHeight. */
export const EPISODE_ROW_HEIGHT_PX = 176

export interface EpisodeRowProps {
  episode: PodcastEpisode
  libraryItemId: string
  sortKey: string
  progress: MediaProgress | null
  isSelected: boolean
  isSelectionMode: boolean
  userCanUpdate: boolean
  userCanDelete: boolean
  userCanDownload: boolean
  dateFormat: string
  locale: string
  onPlay: (episode: PodcastEpisode) => void
  onView: (episode: PodcastEpisode) => void
  onToggleFinished: (episode: PodcastEpisode) => void
  onSelect: (episode: PodcastEpisode, isSelected: boolean) => void
  onEdit?: (episode: PodcastEpisode) => void
  onRemove?: (episode: PodcastEpisode, hardDelete: boolean) => void
  onDownload?: (episode: PodcastEpisode) => void
  onAddToPlaylist?: (episode: PodcastEpisode) => void
  isStreamingThisEpisode: boolean
  isDownloading: boolean
  isQueued: boolean
  rowIndex: number
}

export default function EpisodeRow({
  episode,
  sortKey,
  progress,
  isSelected,
  isSelectionMode,
  userCanUpdate,
  userCanDelete,
  userCanDownload,
  dateFormat,
  locale,
  isStreamingThisEpisode,
  isDownloading,
  isQueued,
  onPlay,
  onView,
  onToggleFinished,
  onSelect,
  onEdit,
  onRemove,
  onDownload,
  onAddToPlaylist,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rowIndex
}: EpisodeRowProps) {
  const t = useTypeSafeTranslations()
  const [isHovering, setIsHovering] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const closeConfirm = () => setConfirmState(null)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmState({
      isOpen: true,
      message: t('MessageConfirmDeleteEpisode', { 0: episode.title }),
      checkboxLabel: t('LabelDeleteFromFileSystemCheckbox'),
      yesButtonText: t('ButtonDelete'),
      yesButtonClassName: 'bg-error',
      onConfirm: (hardDelete?: boolean) => {
        setConfirmState(null)
        onRemove?.(episode, !!hardDelete)
      }
    })
  }

  const userIsFinished = progress?.isFinished || false
  const progressPercent = progress?.progress || 0
  const streamIsPlaying = isStreamingThisEpisode

  const timeRemaining = useMemo(() => {
    if (streamIsPlaying) return t('ButtonPlaying')
    if (!progress) return elapsedPretty(episode.audioTrack?.duration || 0, locale)
    if (userIsFinished) return t('LabelFinished')

    const duration = progress.duration || episode.audioTrack?.duration || 0
    const remaining = Math.floor(duration - (progress.currentTime || 0))
    return t('LabelTimeLeft', { 0: elapsedPretty(remaining, locale) })
  }, [streamIsPlaying, progress, userIsFinished, episode.audioTrack?.duration, t, locale])

  const publishedDate = episode.publishedAt ? formatJsDate(new Date(episode.publishedAt), dateFormat) : ''

  // Stamp tabindex="-1" and pointer-events:none on all anchor tags in the raw HTML
  // before injection. A post-mount effect is unreliable with virtual scrolling (row reuse).
  const descriptionHtml = (episode.subtitle || episode.description || '').replace(/<a\b/gi, '<a tabindex="-1" style="pointer-events:none"')

  const handleRowClick = () => {
    onView(episode)
  }

  return (
    <>
      <div
        className="w-full h-44 overflow-hidden px-2 py-2 border-b border-white/10 relative hover:bg-white/5 transition-colors"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Main content — keep onClick for mouse users, but let children dictate keyboard tab index */}
        <div className="flex h-full rounded-sm" onClick={handleRowClick}>
          <div className="grow min-w-0 flex flex-col justify-start">
            {/* Title - serves as the primary keyboard target for opening the row */}
            <div dir="auto" className="flex items-center break-words whitespace-normal relative pe-2 flex-shrink-0 w-full">
              <button
                id={`btn-episode-${episode.id}`}
                type="button"
                className={`text-sm font-semibold leading-tight line-clamp-2 text-start cursor-pointer focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-4 rounded-sm ${userIsFinished ? 'text-foreground-muted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRowClick()
                }}
              >
                {episode.title}
              </button>
            </div>

            {/* Subtitle/Description - This must shrink if title is 2 lines */}
            <div className="flex items-start mt-1 mb-0.5 overflow-hidden relative flex-1 min-h-0">
              <div
                dir="auto"
                className="text-sm text-gray-200 line-clamp-2 leading-snug break-words whitespace-normal w-full"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                onClick={(e) => {
                  // If a link within the description was clicked, don't open the modal
                  if ((e.target as HTMLElement).tagName.toLowerCase() === 'a') {
                    e.stopPropagation()
                  }
                }}
              />
            </div>

            {/* Metadata row */}
            <div className="flex items-center h-7 w-full flex-shrink-0">
              {sortKey === 'audioFile.metadata.filename' ? (
                <p className="text-sm text-gray-300 truncate font-light">
                  <strong className="font-bold">{t('LabelFilename')}</strong>: {episode.audioFile?.metadata?.filename}
                </p>
              ) : (
                <div className="inline-flex justify-start overflow-hidden gap-x-4">
                  {episode.season && <p className="text-sm text-gray-300 whitespace-nowrap">{t('LabelSeasonNumber', { 0: episode.season })}</p>}
                  {episode.episode && <p className="text-sm text-gray-300 whitespace-nowrap">{t('LabelEpisodeNumber', { 0: episode.episode })}</p>}
                  {publishedDate && <p className="text-sm text-gray-300 whitespace-nowrap">{t('LabelPublishedDate', { 0: publishedDate })}</p>}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center pt-2 gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 -mb-1 pb-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPlay(episode)
                }}
                className={`h-8 px-4 border border-white/20 hover:bg-white/10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 ${userIsFinished ? 'text-white/40' : ''}`}
              >
                <span className={`material-symbols fill text-2xl ${streamIsPlaying ? '' : 'text-success'}`}>{streamIsPlaying ? 'pause' : 'play_arrow'}</span>
                <span className="pl-2 pr-1 text-sm font-semibold whitespace-nowrap" suppressHydrationWarning>
                  {timeRemaining}
                </span>
              </button>

              <Tooltip position="top" text={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')}>
                <div onClick={(e) => e.stopPropagation()}>
                  <ReadIconBtn borderless isRead={userIsFinished} onClick={() => onToggleFinished(episode)} />
                </div>
              </Tooltip>

              <Tooltip position="top" text="Add to Playlist">
                <IconBtn
                  borderless
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToPlaylist?.(episode)
                  }}
                >
                  playlist_add
                </IconBtn>
              </Tooltip>

              {/* Download button */}
              {userCanDownload && !episode.audioFile && (
                <Tooltip text={isDownloading ? 'Downloading' : isQueued ? 'Queued' : t('LabelDownload')}>
                  <IconBtn
                    borderless
                    disabled={isDownloading || isQueued}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload?.(episode)
                    }}
                    className={isDownloading || isQueued ? 'text-warning' : ''}
                  >
                    {isDownloading || isQueued ? 'downloading' : 'download'}
                  </IconBtn>
                </Tooltip>
              )}

              {userCanUpdate && (
                <IconBtn
                  borderless
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(episode)
                  }}
                >
                  edit
                </IconBtn>
              )}

              {userCanDelete && (
                <IconBtn borderless onClick={handleDeleteClick}>
                  delete
                </IconBtn>
              )}
            </div>
          </div>

          {/* Selection checkbox area */}
          <div
            className={`flex items-center justify-center flex-shrink-0 transition-opacity ${isHovering || isSelected || isSelectionMode ? 'opacity-100' : 'opacity-100 md:opacity-0 has-[:focus-visible]:opacity-100 md:has-[:focus-visible]:opacity-100'}`}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation()
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox value={isSelected} onChange={(checked) => onSelect(episode, checked)} />
          </div>
        </div>

        {/* Progress bar */}
        {!userIsFinished && progressPercent > 0 && <div className="absolute bottom-0 left-0 h-0.5 bg-warning" style={{ width: `${progressPercent * 100}%` }} />}
      </div>

      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          message={confirmState.message}
          checkboxLabel={confirmState.checkboxLabel}
          yesButtonText={confirmState.yesButtonText}
          yesButtonClassName={confirmState.yesButtonClassName}
          onClose={closeConfirm}
          onConfirm={(value) => {
            confirmState.onConfirm(value)
          }}
        />
      )}
    </>
  )
}
