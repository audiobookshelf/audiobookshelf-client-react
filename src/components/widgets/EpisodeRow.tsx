import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal'
import Checkbox from '@/components/ui/Checkbox'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog, { type ConfirmState } from '@/components/widgets/ConfirmDialog'
import EpisodePlayButton from '@/components/widgets/episode/EpisodePlayButton'
import { useUser } from '@/contexts/UserContext'
import { useEpisodeListenActions } from '@/hooks/usetEpisodeListenActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { sanitizeEpisodeDescriptionHtml } from '@/lib/episode'
import { PodcastEpisode } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

/** Fixed height of a single episode row (px). Used by EpisodeTable virtualizer and minHeight. */
export const EPISODE_ROW_HEIGHT_PX = 176

export interface EpisodeRowProps {
  episode: PodcastEpisode
  libraryItemId: string
  sortKey: string
  isSelected: boolean
  isSelectionMode: boolean
  dateFormat: string
  onView: (episode: PodcastEpisode) => void
  onSelect: (episode: PodcastEpisode, isSelected: boolean, shiftKey?: boolean, rowIndex?: number) => void
  onEdit?: (episode: PodcastEpisode) => void
  onMatch?: (episode: PodcastEpisode) => void
  onRemove?: (episode: PodcastEpisode, hardDelete: boolean) => void
  onDownloadFile?: (episode: PodcastEpisode) => void
  onShowMoreInfo?: (episode: PodcastEpisode) => void
  rowIndex: number
}

export default function EpisodeRow({
  episode,
  libraryItemId,
  sortKey,
  isSelected,
  isSelectionMode,
  dateFormat,
  onView,
  onSelect,
  onEdit,
  onMatch,
  onRemove,
  onDownloadFile,
  onShowMoreInfo,
  rowIndex
}: EpisodeRowProps) {
  const t = useTypeSafeTranslations()
  const { userCanUpdate, userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const [isHovering, setIsHovering] = useState(false)
  const [deleteConfirmState, setDeleteConfirmState] = useState<ConfirmState | null>(null)

  const getQueueItems = useCallback(() => [], [])

  const {
    userIsFinished,
    userProgressPercent,
    episodeIsPlaying,
    playButtonLabel,
    isProcessingFinished,
    playlistsModalOpen,
    confirmState: finishedConfirmState,
    handlePlay,
    handleToggleFinished,
    handleOpenPlaylist,
    closePlaylistsModal,
    closeConfirm: closeFinishedConfirm,
    libraryId
  } = useEpisodeListenActions({
    libraryItemId,
    episode,
    itemTitle: episode.title,
    getQueueItems
  })

  const contextMenuItems = useMemo(() => {
    const items: ContextMenuDropdownItem[] = []
    if (userCanUpdate && onMatch) items.push({ text: t('HeaderMatch'), action: 'match' })
    if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
    if (userIsAdminOrUp && episode.audioFile) items.push({ text: t('LabelMoreInfo'), action: 'more' })
    return items
  }, [userCanDownload, userCanUpdate, userIsAdminOrUp, episode.audioFile, onMatch, t])

  const closeDeleteConfirm = () => setDeleteConfirmState(null)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmState({
      isOpen: true,
      message: t('MessageConfirmDeleteEpisode', { 0: episode.title }),
      checkboxLabel: t('LabelDeleteFromFileSystemCheckbox'),
      yesButtonText: t('ButtonDelete'),
      yesButtonClassName: 'bg-error',
      onConfirm: (hardDelete?: boolean) => {
        setDeleteConfirmState(null)
        onRemove?.(episode, !!hardDelete)
      }
    })
  }

  const publishedDate = episode.publishedAt ? formatJsDate(new Date(episode.publishedAt), dateFormat) : ''

  const descriptionHtml = sanitizeEpisodeDescriptionHtml(episode.subtitle || episode.description || '')

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
        <div className="flex h-full flex-col rounded-sm" onClick={handleRowClick}>
          <div className="flex min-h-0 w-full flex-1">
            <div className="flex min-w-0 grow flex-col justify-start">
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

              <div className="relative mt-1.5 mb-0.5 flex h-10 min-h-0 items-start overflow-hidden pe-12">
                <div
                  dir="auto"
                  className="text-foreground-muted line-clamp-2 w-full text-sm leading-snug break-words whitespace-normal"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName.toLowerCase() === 'a') {
                      e.stopPropagation()
                    }
                  }}
                />
              </div>

              <div className="flex h-7 w-full flex-shrink-0 items-center">
                {sortKey === 'audioFile.metadata.filename' ? (
                  <p className="text-foreground-muted truncate text-sm font-light">
                    <strong className="font-bold">{t('LabelFilename')}</strong>: {episode.audioFile?.metadata?.filename}
                  </p>
                ) : (
                  <div className="flex w-full min-w-0 max-w-xl items-center gap-x-3 overflow-hidden pr-12">
                    {episode.season && <p className="text-foreground-muted shrink-0 text-sm">{t('LabelSeasonNumber', { 0: episode.season })}</p>}
                    {episode.episode && <p className="text-foreground-muted shrink-0 text-sm">{t('LabelEpisodeNumber', { 0: episode.episode })}</p>}
                    {publishedDate && (
                      <p className="text-foreground-muted shrink-0 text-sm">
                        <span className="sm:hidden">{publishedDate}</span>
                        <span className="hidden sm:inline">{t('LabelPublishedDate', { 0: publishedDate })}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`absolute top-1/2 right-2 z-10 flex flex-shrink-0 -translate-y-1/2 items-center justify-center transition-opacity ${isHovering || isSelected || isSelectionMode ? 'opacity-100' : 'opacity-100 has-[:focus-visible]:opacity-100 md:opacity-0 md:has-[:focus-visible]:opacity-100'}`}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.stopPropagation()
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                value={isSelected}
                checkboxBgClass="bg-primary"
                onChange={(checked, shiftKey) => onSelect(episode, checked, shiftKey, rowIndex)}
              />
            </div>
          </div>

          <div className="@container mt-auto flex w-full items-center justify-between gap-1">
            <div className="flex w-full items-center gap-1">
              <EpisodePlayButton label={playButtonLabel} isPlaying={episodeIsPlaying} isFinished={userIsFinished} onClick={handlePlay} />

              <Tooltip position="top" text={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} className="flex-shrink-0">
                <div onClick={(e) => e.stopPropagation()}>
                  <ReadIconBtn borderless disabled={isProcessingFinished} isRead={userIsFinished} onClick={handleToggleFinished} />
                </div>
              </Tooltip>

              <Tooltip position="top" text={t('LabelAddToPlaylist')} className="flex-shrink-0">
                <IconBtn borderless className="flex-shrink-0" onClick={handleOpenPlaylist}>
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

              {contextMenuItems.length > 0 && (
                <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                  <ContextMenuDropdown
                    items={contextMenuItems}
                    autoWidth
                    borderless
                    onAction={({ action }) => {
                      if (action === 'match') onMatch?.(episode)
                      else if (action === 'download') onDownloadFile?.(episode)
                      else if (action === 'more') onShowMoreInfo?.(episode)
                    }}
                    usePortal
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {!userIsFinished && userProgressPercent > 0 && (
          <div className="bg-warning absolute bottom-0 left-0 h-0.5" style={{ width: `${userProgressPercent * 100}%` }} />
        )}
      </div>

      {playlistsModalOpen && (
        <AddToPlaylistModal
          isOpen={playlistsModalOpen}
          onClose={closePlaylistsModal}
          libraryId={libraryId}
          libraryItemId={libraryItemId}
          episodeId={episode.id}
          itemTitle={episode.title}
        />
      )}

      {finishedConfirmState && (
        <ConfirmDialog
          isOpen={finishedConfirmState.isOpen}
          message={finishedConfirmState.message}
          checkboxLabel={finishedConfirmState.checkboxLabel}
          yesButtonText={finishedConfirmState.yesButtonText}
          yesButtonClassName={finishedConfirmState.yesButtonClassName}
          onClose={closeFinishedConfirm}
          onConfirm={(value) => {
            finishedConfirmState.onConfirm(value)
          }}
        />
      )}

      {deleteConfirmState && (
        <ConfirmDialog
          isOpen={deleteConfirmState.isOpen}
          message={deleteConfirmState.message}
          checkboxLabel={deleteConfirmState.checkboxLabel}
          yesButtonText={deleteConfirmState.yesButtonText}
          yesButtonClassName={deleteConfirmState.yesButtonClassName}
          onClose={closeDeleteConfirm}
          onConfirm={(value) => {
            deleteConfirmState.onConfirm(value)
          }}
        />
      )}
    </>
  )
}
