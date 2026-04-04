import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog, { type ConfirmState } from '@/components/widgets/ConfirmDialog'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { formatDuration } from '@/lib/formatDuration'
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
  dateFormat: string
  onPlay: (episode: PodcastEpisode) => void
  onView: (episode: PodcastEpisode) => void
  onToggleFinished: (episode: PodcastEpisode) => void
  onSelect: (episode: PodcastEpisode, isSelected: boolean) => void
  onEdit?: (episode: PodcastEpisode) => void
  onRemove?: (episode: PodcastEpisode, hardDelete: boolean) => void
  onDownloadFile?: (episode: PodcastEpisode) => void
  onShowMoreInfo?: (episode: PodcastEpisode) => void
  onAddToPlaylist?: (episode: PodcastEpisode) => void
  isPlayingThisEpisode: boolean
  rowIndex: number
}

export default function EpisodeRow({
  episode,
  sortKey,
  progress,
  isSelected,
  isSelectionMode,
  dateFormat,
  isPlayingThisEpisode,
  onPlay,
  onView,
  onToggleFinished,
  onSelect,
  onEdit,
  onRemove,
  onDownloadFile,
  onShowMoreInfo,
  onAddToPlaylist,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rowIndex
}: EpisodeRowProps) {
  const t = useTypeSafeTranslations()
  const { userCanUpdate, userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const [isHovering, setIsHovering] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const contextMenuItems = useMemo(() => {
    const items: ContextMenuDropdownItem[] = []
    if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
    if (userIsAdminOrUp && episode.audioFile) items.push({ text: t('LabelMoreInfo'), action: 'more' })
    return items
  }, [userCanDownload, userIsAdminOrUp, episode.audioFile, t])

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
  const streamIsPlaying = isPlayingThisEpisode

  const timeRemaining = useMemo(() => {
    if (streamIsPlaying) return t('ButtonPlaying')
    if (!progress) return formatDuration(episode.audioTrack?.duration || 0, t)
    if (userIsFinished) return t('LabelFinished')

    const duration = progress.duration || episode.audioTrack?.duration || 0
    const remaining = Math.floor(duration - (progress.currentTime || 0))
    return t('LabelTimeLeft', { 0: formatDuration(remaining, t) })
  }, [streamIsPlaying, progress, userIsFinished, episode.audioTrack?.duration, t])

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
        className="border-foreground/10 hover:bg-foreground/5 relative h-44 w-full overflow-hidden border-b px-2 py-2 transition-colors"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Main content — keep onClick for mouse users, but let children dictate keyboard tab index */}
        <div className="flex h-full flex-col rounded-sm" onClick={handleRowClick}>
          <div className="flex min-h-0 w-full flex-1">
            <div className="flex min-w-0 grow flex-col justify-start">
              {/* Title - serves as the primary keyboard target for opening the row */}
              <div dir="auto" className="relative flex h-10 w-full flex-shrink-0 items-center pe-2 break-words whitespace-normal">
                <button
                  id={`btn-episode-${episode.id}`}
                  type="button"
                  className={`focus-visible:outline-foreground-muted line-clamp-2 cursor-pointer rounded-sm text-start text-sm leading-tight font-semibold focus-visible:outline-1 focus-visible:outline-offset-4 ${userIsFinished ? 'text-foreground-muted' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRowClick()
                  }}
                >
                  {episode.title}
                </button>
              </div>

              {/* Subtitle/Description - This must shrink if title is 2 lines */}
              <div className="relative mt-1.5 mb-0.5 flex h-10 min-h-0 items-start overflow-hidden pe-12">
                <div
                  dir="auto"
                  className="text-foreground-muted line-clamp-2 w-full text-sm leading-snug break-words whitespace-normal"
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
              <div className="flex h-7 w-full flex-shrink-0 items-center">
                {sortKey === 'audioFile.metadata.filename' ? (
                  <p className="text-foreground-muted truncate text-sm font-light">
                    <strong className="font-bold">{t('LabelFilename')}</strong>: {episode.audioFile?.metadata?.filename}
                  </p>
                ) : (
                  <div className="inline-flex w-full max-w-xl justify-between overflow-hidden pr-12">
                    {episode.season && <p className="text-foreground-muted text-sm whitespace-nowrap">{t('LabelSeasonNumber', { 0: episode.season })}</p>}
                    {episode.episode && <p className="text-foreground-muted text-sm whitespace-nowrap">{t('LabelEpisodeNumber', { 0: episode.episode })}</p>}
                    {publishedDate && <p className="text-foreground-muted text-sm whitespace-nowrap">{t('LabelPublishedDate', { 0: publishedDate })}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Selection checkbox area */}
            <div
              className={`absolute top-1/2 right-2 z-10 flex flex-shrink-0 -translate-y-1/2 items-center justify-center transition-opacity ${isHovering || isSelected || isSelectionMode ? 'opacity-100' : 'opacity-100 has-[:focus-visible]:opacity-100 md:opacity-0 md:has-[:focus-visible]:opacity-100'}`}
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

          {/* Action buttons */}
          <div className="@container mt-auto flex w-full items-center justify-between gap-1">
            <div className="flex w-full items-center gap-1">
              <Btn
                color="bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  onPlay(episode)
                }}
                className={`border-foreground/20 hover:bg-foreground/10 flex-nowrap px-2 ${userIsFinished ? 'text-foreground/40' : 'text-foreground'}`}
              >
                <span className={`material-symbols fill text-xl sm:text-2xl ${streamIsPlaying ? '' : 'text-success'}`}>
                  {streamIsPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span className="pe-1 text-xs font-semibold whitespace-nowrap sm:text-sm">{timeRemaining}</span>
              </Btn>

              <Tooltip position="top" text={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} className="flex-shrink-0">
                <div onClick={(e) => e.stopPropagation()}>
                  <ReadIconBtn borderless isRead={userIsFinished} onClick={() => onToggleFinished(episode)} />
                </div>
              </Tooltip>

              <Tooltip position="top" text={t('LabelAddToPlaylist')} className="flex-shrink-0">
                <IconBtn
                  borderless
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToPlaylist?.(episode)
                  }}
                >
                  playlist_add
                </IconBtn>
              </Tooltip>

              {userCanUpdate && (
                <IconBtn
                  borderless
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(episode)
                  }}
                >
                  edit
                </IconBtn>
              )}

              {userCanDelete && (
                <IconBtn borderless className="flex-shrink-0" onClick={handleDeleteClick}>
                  delete
                </IconBtn>
              )}

              {episode.audioFile && contextMenuItems.length > 0 && (
                <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                  <ContextMenuDropdown
                    items={contextMenuItems}
                    autoWidth
                    borderless
                    onAction={({ action }) => {
                      if (action === 'download') onDownloadFile?.(episode)
                      else if (action === 'more') onShowMoreInfo?.(episode)
                    }}
                    usePortal
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!userIsFinished && progressPercent > 0 && <div className="bg-warning absolute bottom-0 left-0 h-0.5" style={{ width: `${progressPercent * 100}%` }} />}
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
