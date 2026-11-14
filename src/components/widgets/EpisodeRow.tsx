import Checkbox from '@/components/ui/Checkbox'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import EpisodePlayButton from '@/components/widgets/episode/EpisodePlayButton'
import PodcastEpisodeListenActions from '@/components/widgets/episode/PodcastEpisodeListenActions'
import { useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { useEpisodeListenActions } from '@/hooks/usetEpisodeListenActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { openHardDeleteConfirm } from '@/lib/confirmDialogs'
import { getEpisodeCoverUrl } from '@/lib/coverUtils'
import { formatJsDate } from '@/lib/datefns'
import { sanitizeEpisodeDescriptionHtml } from '@/lib/episode'
import { buildEpisodeQueueItem, buildPodcastEpisodesQueueFromIndex } from '@/lib/playerQueue'
import { PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

/** Fixed height of a single episode row (px). Used by EpisodeTable virtualizer and minHeight. */
export const EPISODE_ROW_HEIGHT_PX = 176

export interface EpisodeRowProps {
  episode: PodcastEpisode
  libraryItem: PodcastLibraryItem
  episodesInOrder: PodcastEpisode[]
  episodeIndex: number
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
  libraryItem,
  episodesInOrder,
  episodeIndex,
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
  const primaryInputCanHover = usePrimaryInputCanHover()
  const { setBoundModal } = useLibrary()
  const { user, userCanUpdate, userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const [isHovering, setIsHovering] = useState(false)
  const [failedCoverSrc, setFailedCoverSrc] = useState<string | null>(null)
  const clearBoundModal = useCallback(() => setBoundModal(null), [setBoundModal])

  const libraryItemId = libraryItem.id
  const podcastTitle = libraryItem.media.metadata?.title ?? ''
  const coverPath = libraryItem.media.coverPath ?? null
  const episodeCoverSrc = episode.coverPath ? getEpisodeCoverUrl(libraryItemId, episode, { width: 180, fallback: false }) : null
  const showEpisodeCover = !!episodeCoverSrc && episodeCoverSrc !== failedCoverSrc

  const captionForEpisode = useCallback(
    (ep: PodcastEpisode) =>
      ep.publishedAt ? t('LabelPublishedDate', { 0: formatJsDate(new Date(ep.publishedAt), dateFormat) }) : t('LabelUnknownPublishDate'),
    [dateFormat, t]
  )

  const getQueueItems = useCallback(
    () => buildPodcastEpisodesQueueFromIndex(episodesInOrder, libraryItem, user.mediaProgress, episodeIndex, captionForEpisode),
    [captionForEpisode, episodeIndex, episodesInOrder, libraryItem, user.mediaProgress]
  )

  const buildQueueItem = useCallback(
    () =>
      buildEpisodeQueueItem({
        libraryItem,
        episode,
        podcastTitle,
        coverPath,
        caption: captionForEpisode(episode)
      }),
    [captionForEpisode, coverPath, episode, libraryItem, podcastTitle]
  )

  const {
    userIsFinished,
    userProgressPercent,
    episodeIsPlaying,
    episodeIsLoading,
    isQueued,
    showQueueButton,
    playButtonLabel,
    isProcessingFinished,
    handlePlay,
    handleQueueToggle,
    handleToggleFinished,
    handleOpenPlaylist,
    toggleQueue,
    openPlaylist
  } = useEpisodeListenActions({
    libraryItemId,
    episode,
    itemTitle: episode.title,
    getQueueItems,
    buildQueueItem
  })

  const contextMenuItems = useMemo(() => {
    const items: ContextMenuDropdownItem[] = []
    if (userCanUpdate && onMatch) items.push({ text: t('HeaderMatch'), action: 'match' })
    if (userCanDownload && !libraryItem.isMissing && !libraryItem.isInvalid) items.push({ text: t('LabelDownload'), action: 'download' })
    if (userIsAdminOrUp && episode.audioFile) items.push({ text: t('LabelMoreInfo'), action: 'more' })
    return items
  }, [userCanDownload, userCanUpdate, userIsAdminOrUp, episode.audioFile, libraryItem.isInvalid, libraryItem.isMissing, onMatch, t])

  const confirmDelete = () => {
    openHardDeleteConfirm({
      message: t('MessageConfirmDeleteEpisode', { 0: episode.title }),
      t,
      setConfirmState: (state) => {
        if (!state) {
          clearBoundModal()
          return
        }
        setBoundModal(
          <ConfirmDialog
            key={`delete-episode-${episode.id}`}
            isOpen={state.isOpen}
            message={state.message}
            checkboxLabel={state.checkboxLabel}
            yesButtonText={state.yesButtonText}
            yesButtonClassName={state.yesButtonClassName}
            onClose={clearBoundModal}
            onConfirm={(value) => {
              clearBoundModal()
              state.onConfirm(value)
            }}
          />
        )
      },
      onDelete: (hardDelete) => onRemove?.(episode, hardDelete)
    })
  }

  const publishedDate = episode.publishedAt ? formatJsDate(new Date(episode.publishedAt), dateFormat) : ''

  const descriptionHtml = sanitizeEpisodeDescriptionHtml(episode.subtitle || episode.description || '')

  const handleRowClick = () => {
    onView(episode)
  }

  const compactContextMenuItems = useMemo(() => {
    const items: ContextMenuDropdownItem[] = [
      { text: userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished'), action: 'finished' },
      { text: t('LabelAddToPlaylist'), action: 'playlist' }
    ]
    if (showQueueButton) items.push({ text: isQueued ? t('MessageRemoveFromPlayerQueue') : t('MessageAddToPlayerQueue'), action: 'queue' })
    if (userCanUpdate) items.push({ text: t('ButtonEdit'), action: 'edit' })
    if (userCanDelete) items.push({ text: t('ButtonDelete'), action: 'delete' })
    return [...items, ...contextMenuItems]
  }, [contextMenuItems, isQueued, showQueueButton, t, userCanDelete, userCanUpdate, userIsFinished])

  const handleContextMenuAction = ({ action }: { action: string }) => {
    switch (action) {
      case 'finished':
        if (!isProcessingFinished) handleToggleFinished()
        break
      case 'playlist':
        openPlaylist()
        break
      case 'queue':
        toggleQueue()
        break
      case 'edit':
        onEdit?.(episode)
        break
      case 'delete':
        confirmDelete()
        break
      case 'match':
        onMatch?.(episode)
        break
      case 'download':
        onDownloadFile?.(episode)
        break
      case 'more':
        onShowMoreInfo?.(episode)
        break
    }
  }

  return (
    <div
      cy-id="episode-row"
      className="border-foreground/10 hover:bg-foreground/5 @container relative h-44 w-full overflow-hidden border-b px-2 py-2 transition-colors"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex h-full flex-col rounded-sm" onClick={handleRowClick}>
        <div className="flex min-h-0 w-full flex-1 gap-2.5">
          <div className="flex min-w-0 grow flex-col justify-start">
            <div dir="auto" className="relative flex h-10 w-full shrink-0 items-center pe-2 wrap-break-word whitespace-normal">
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

            <div className="relative mt-1.5 mb-0.5 flex h-10 min-h-0 items-start overflow-hidden">
              <div
                dir="auto"
                className="text-foreground-muted line-clamp-2 w-full text-sm leading-snug wrap-break-word whitespace-normal"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName.toLowerCase() === 'a') {
                    e.stopPropagation()
                  }
                }}
              />
            </div>

            <div className="flex h-6 w-full shrink-0 items-center">
              {sortKey === 'audioFile.metadata.filename' ? (
                <p className="text-foreground-muted truncate text-sm font-light">
                  <strong className="font-bold">{t('LabelFilename')}</strong>: {episode.audioFile?.metadata?.filename}
                </p>
              ) : (
                <div className="flex w-full max-w-xl min-w-0 items-center gap-x-3 overflow-hidden">
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
          {showEpisodeCover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={episodeCoverSrc}
              cy-id="episode-row-cover"
              src={episodeCoverSrc}
              alt=""
              loading="lazy"
              decoding="async"
              width={90}
              height={90}
              onError={() => setFailedCoverSrc(episodeCoverSrc)}
              className="bg-primary mt-1 size-[72px] shrink-0 rounded-sm object-contain @sm:size-[90px]"
            />
          )}
        </div>

        <div className="mt-auto flex h-11 w-full shrink-0 items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
          <div className="hidden min-w-0 items-center gap-1 @lg:flex">
            <PodcastEpisodeListenActions
              playButtonLabel={playButtonLabel}
              isPlaying={episodeIsPlaying}
              isFinished={userIsFinished}
              isLoading={episodeIsLoading}
              isProcessingFinished={isProcessingFinished}
              showQueueButton={showQueueButton}
              isQueued={isQueued}
              onPlay={handlePlay}
              onQueueToggle={handleQueueToggle}
              onToggleFinished={handleToggleFinished}
              onAddToPlaylist={handleOpenPlaylist}
            />

            {userCanUpdate && (
              <IconBtn
                borderless
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(episode)
                }}
              >
                edit
              </IconBtn>
            )}

            {userCanDelete && (
              <IconBtn
                borderless
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  confirmDelete()
                }}
              >
                delete
              </IconBtn>
            )}

            {contextMenuItems.length > 0 && (
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <ContextMenuDropdown items={contextMenuItems} autoWidth borderless onAction={handleContextMenuAction} usePortal />
              </div>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1 @lg:hidden">
            <EpisodePlayButton
              label={playButtonLabel}
              isPlaying={episodeIsPlaying}
              isFinished={userIsFinished}
              loading={episodeIsLoading}
              onClick={handlePlay}
            />
            <ContextMenuDropdown items={compactContextMenuItems} autoWidth borderless onAction={handleContextMenuAction} usePortal />
          </div>
          <div
            className={`shrink-0 transition-opacity ${!primaryInputCanHover || isHovering || isSelected || isSelectionMode ? 'opacity-100' : 'opacity-100 has-[:focus-visible]:opacity-100 md:opacity-0 md:has-[:focus-visible]:opacity-100'}`}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation()
              }
            }}
          >
            <Checkbox
              value={isSelected}
              ariaLabel={t('LabelSelectEpisode', { 0: episode.title })}
              className="size-11 justify-center p-0"
              onChange={(checked, shiftKey) => onSelect(episode, checked, shiftKey, rowIndex)}
            />
          </div>
        </div>
      </div>

      {!userIsFinished && userProgressPercent > 0 && (
        <div className="bg-warning absolute bottom-0 left-0 h-0.5" style={{ width: `${userProgressPercent * 100}%` }} />
      )}
    </div>
  )
}
