'use client'

import { removeBookFromCollectionAction } from '@/app/actions/collectionActions'
import { toggleFinishedAction } from '@/app/actions/mediaActions'
import { batchRemoveFromPlaylistAction } from '@/app/actions/playlistActions'
import PreviewCover from '@/components/covers/PreviewCover'
import EpisodeEditModal from '@/components/modals/EpisodeEditModal'
import LibraryItemEditModal from '@/components/modals/LibraryItemEditModal'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import type { SortableListDragHandleProps } from '@/components/widgets/SortableList'
import { useLibrary } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { usePrimaryInputCanHover, useSortableCompilation } from '@/contexts/SortableCompilationContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useCompilationListRowLayout } from '@/hooks/useCompilationListRowLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getMediaCardModalNavigationContext, type EntityNavigationContext } from '@/lib/bookshelfNavigationContext'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH, DRAG_HANDLE_GRAB_CURSOR } from '@/lib/dragHandleClasses'
import { formatDuration } from '@/lib/formatDuration'
import { buildMediaItemProgressMap, buildPodcastEpisodeProgressMap, getLibraryItemProgressFromMap } from '@/lib/mediaProgress'
import { mergeClasses } from '@/lib/merge-classes'
import { getEpisodeDuration, getPlaylistItemDuration } from '@/lib/playlistItems'
import type { BookshelfEntity, LibraryItem, PodcastEpisode } from '@/types/api'
import { isBookMedia, isBookMetadata, isPodcastMedia } from '@/types/api'
import Link from 'next/link'
import { useCallback, useMemo, useState, useTransition } from 'react'

const COMPILATION_ROW_LINK_FOCUS =
  'rounded-sm px-1e py-0.5e focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-0'

const COMPILATION_ROW_ACTION_BTN_CLASS =
  'size-[1.75em] min-h-0 min-w-0 shrink-0 p-0 text-[1.5em] leading-none hover:not-disabled:before:bg-foreground/10'

export type CompilationItemListRowContext =
  | { kind: 'collection'; collectionId: string }
  | { kind: 'playlist'; playlistId: string }

interface CompilationItemListRowProps {
  libraryItem: LibraryItem
  episode?: PodcastEpisode | null
  context: CompilationItemListRowContext
  entityIndex: number
  shelfEntities: (BookshelfEntity | null)[]
  episodeNavCtx?: EntityNavigationContext
  showDragHandle: boolean
  sortableDragHandleProps: SortableListDragHandleProps
  isDragging?: boolean
}

export default function CompilationItemListRow({
  libraryItem,
  episode = null,
  context,
  entityIndex,
  shelfEntities,
  episodeNavCtx,
  showDragHandle,
  sortableDragHandleProps,
  isDragging = false
}: CompilationItemListRowProps) {
  const t = useTypeSafeTranslations()
  const { isMdUp, coverWidth } = useCompilationListRowLayout()
  const { user, userCanUpdate, userCanDelete } = useUser()
  const { setBoundModal } = useLibrary()
  const sortableCompilation = useSortableCompilation()
  const primaryInputCanHover = usePrimaryInputCanHover()
  const { playItem, isPlaying } = useMediaContext()
  const { showToast } = useGlobalToast()
  const [, startTransition] = useTransition()

  const [isHovering, setIsHovering] = useState(false)
  const [isProcessingReadUpdate, setIsProcessingReadUpdate] = useState(false)
  const [processingRemove, setProcessingRemove] = useState(false)

  const episodeId = episode?.id ?? null
  const media = libraryItem.media
  const mediaMetadata = media?.metadata
  const isBook = isBookMedia(media) && isBookMetadata(mediaMetadata)

  const itemTitle = episode ? episode.title : (mediaMetadata?.title ?? '')
  const authors = isBook ? mediaMetadata.authors : undefined
  const bookAuthors = useMemo(() => authors ?? [], [authors])
  const bookSeries = isBook && !episode && Array.isArray(mediaMetadata.series) ? mediaMetadata.series : []
  const tracks = isBook && 'tracks' in media ? (media.tracks ?? []) : []
  const bookDuration = isBook && 'duration' in media && media.duration ? formatDuration(media.duration, t) : ''
  const itemDuration = episode
    ? formatDuration(getPlaylistItemDuration({ libraryItem, episode, libraryItemId: libraryItem.id, episodeId: episode.id }), t)
    : bookDuration

  const mediaItemProgressMap = useMemo(() => buildMediaItemProgressMap(user.mediaProgress), [user.mediaProgress])
  const episodeProgressMap = useMemo(
    () => (episodeId ? buildPodcastEpisodeProgressMap(libraryItem.id, user.mediaProgress) : null),
    [episodeId, libraryItem.id, user.mediaProgress]
  )
  const itemProgress = episodeId
    ? (episodeProgressMap?.get(episodeId) ?? null)
    : getLibraryItemProgressFromMap(mediaItemProgressMap, libraryItem)
  const userIsFinished = !!itemProgress?.isFinished

  const isMissing = libraryItem.isMissing
  const isInvalid = libraryItem.isInvalid
  const streamIsPlaying = isPlaying(libraryItem.id, episodeId)
  const showPlayBtn = !isMissing && !isInvalid && !streamIsPlaying && (tracks.length > 0 || !!episode)

  const placeholderUrl = getPlaceholderCoverUrl()
  const coverSrc = getLibraryItemCoverSrc(libraryItem, placeholderUrl)

  const clearBoundModal = useCallback(() => setBoundModal(null), [setBoundModal])

  const handleEdit = useCallback(() => {
    if (episode) {
      setBoundModal(
        <EpisodeEditModal
          key={`episode-edit-modal-${episode.id}`}
          isOpen
          libraryItem={libraryItem}
          episode={episode}
          navCtx={episodeNavCtx}
          onClose={clearBoundModal}
        />
      )
      return
    }
    const navCtx = getMediaCardModalNavigationContext(libraryItem.id, shelfEntities, entityIndex)
    setBoundModal(<LibraryItemEditModal key="library-item-edit-modal" isOpen navCtx={navCtx} onClose={clearBoundModal} />)
  }, [clearBoundModal, entityIndex, episode, episodeNavCtx, libraryItem, setBoundModal, shelfEntities])

  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (episode) {
        const queueItems = [
          {
            libraryItemId: libraryItem.id,
            libraryId: libraryItem.libraryId,
            episodeId: episode.id,
            title: episode.title,
            subtitle: mediaMetadata?.title ?? '',
            caption: '',
            duration: getEpisodeDuration(episode) || null,
            coverPath: isPodcastMedia(media) ? (media.coverPath ?? null) : null
          }
        ]
        playItem({ libraryItem, episodeId: episode.id, queueItems })
        return
      }
      if (!isBook || !mediaMetadata) return
      const queueItems = [
        {
          libraryItemId: libraryItem.id,
          libraryId: libraryItem.libraryId,
          episodeId: null,
          title: itemTitle,
          subtitle: bookAuthors.map((au) => au.name).join(', '),
          caption: '',
          duration: isBook && 'duration' in media ? (media.duration ?? null) : null,
          coverPath: isBook && 'coverPath' in media ? (media.coverPath ?? null) : null
        }
      ]
      playItem({ libraryItem, queueItems })
    },
    [bookAuthors, episode, isBook, itemTitle, libraryItem, media, mediaMetadata, playItem]
  )

  const handleToggleFinished = useCallback(() => {
    setIsProcessingReadUpdate(true)
    startTransition(async () => {
      try {
        await toggleFinishedAction(libraryItem.id, { isFinished: !userIsFinished, episodeId: episodeId ?? undefined })
      } catch (error) {
        console.error('Failed to toggle finished', error)
        showToast(userIsFinished ? t('ToastItemMarkedAsNotFinishedFailed') : t('ToastItemMarkedAsFinishedFailed'), { type: 'error' })
      } finally {
        setIsProcessingReadUpdate(false)
      }
    })
  }, [episodeId, libraryItem.id, showToast, t, userIsFinished])

  const handleRemoveClick = useCallback(() => {
    setProcessingRemove(true)
    startTransition(async () => {
      try {
        if (context.kind === 'collection') {
          await removeBookFromCollectionAction(context.collectionId, libraryItem.id)
          showToast(t('ToastRemoveItemFromCollectionSuccess'), { type: 'success' })
        } else {
          await batchRemoveFromPlaylistAction(context.playlistId, [{ libraryItemId: libraryItem.id, episodeId }])
          showToast(t('ToastRemoveItemFromPlaylistSuccess'), { type: 'success' })
        }
        sortableCompilation?.onItemRemoved?.(libraryItem.id, episodeId)
      } catch (error) {
        console.error('Failed to remove item from list', error)
        showToast(context.kind === 'collection' ? t('ToastRemoveItemFromCollectionFailed') : t('ToastRemoveItemFromPlaylistFailed'), {
          type: 'error'
        })
      } finally {
        setProcessingRemove(false)
      }
    })
  }, [context, episodeId, libraryItem.id, showToast, sortableCompilation, t])

  const handleMouseEnter = () => {
    if (isDragging) return
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const showHoverActions = primaryInputCanHover && isHovering && !isDragging
  const showMobilePlayBtn = !isMdUp && !showDragHandle && showPlayBtn
  const itemHref = `/library/${libraryItem.libraryId}/item/${libraryItem.id}`
  const canShowEdit = userCanUpdate
  const canShowRemove = context.kind === 'collection' ? userCanDelete : userCanUpdate

  return (
    <div
      className={mergeClasses('px-1e py-2e md:px-2e relative w-full overflow-hidden', isHovering && !isDragging ? 'bg-foreground/5' : '')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex min-h-[4.5em] min-w-0 items-center md:min-h-[5.5em]">
        {showDragHandle && (
          <div className="w-10e min-w-10e md:w-16e md:max-w-16e flex shrink-0 items-center justify-center">
            <div
              ref={sortableDragHandleProps.setActivatorNodeRef}
              className={mergeClasses('drag-handle flex items-center justify-center', DRAG_HANDLE_GRAB_CURSOR, DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH)}
              {...sortableDragHandleProps.attributes}
              {...sortableDragHandleProps.listeners}
            >
              <span className="material-symbols text-foreground-subdued hover:text-foreground text-[1.125em] leading-none md:text-[1.25em]">menu</span>
            </div>
          </div>
        )}

        <div className="relative flex min-w-0 flex-1 items-center">
          {!isMdUp && (
            <Link
              href={itemHref}
              className={mergeClasses(
                'focus-visible:outline-foreground-muted absolute inset-0 z-[1] rounded-sm focus-visible:outline-1 focus-visible:outline-offset-0 md:hidden',
                isDragging && 'pointer-events-none'
              )}
              aria-label={itemTitle}
            />
          )}

          <div className="flex shrink-0 items-center" style={{ width: coverWidth, minWidth: coverWidth, maxWidth: coverWidth }}>
            <div className="relative">
              <PreviewCover src={coverSrc} width={coverWidth} showResolution={false} />
              {showHoverActions && showPlayBtn && (
                <div className="absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center bg-black/50">
                  <button
                    type="button"
                    className="h-8e w-8e flex cursor-pointer items-center justify-center rounded-full bg-white/20 hover:bg-white/40"
                    onClick={handlePlayClick}
                    aria-label={t('ButtonPlay')}
                  >
                    <span className="material-symbols fill text-[1.5em] text-white">play_arrow</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-2e md:px-3e flex min-w-0 flex-1 items-center">
            <div className="flex w-full min-w-0 flex-col justify-center">
              {isMdUp ? (
                <Link
                  href={itemHref}
                  className={mergeClasses(
                    'text-foreground inline-block w-fit max-w-full text-[0.875em] hover:underline md:text-[1em]',
                    COMPILATION_ROW_LINK_FOCUS
                  )}
                  title={itemTitle}
                >
                  <span className="block truncate">{itemTitle}</span>
                </Link>
              ) : (
                <span className="text-foreground block truncate text-[0.875em]" title={itemTitle}>
                  {itemTitle}
                </span>
              )}
              {episode && mediaMetadata?.title && (
                <div className="text-foreground-muted min-w-0 text-[0.75em] md:text-[0.875em]">
                  {isMdUp ? (
                    <Link href={itemHref} className={mergeClasses('inline-block hover:underline', COMPILATION_ROW_LINK_FOCUS)}>
                      {mediaMetadata.title}
                    </Link>
                  ) : (
                    <span className="inline-block">{mediaMetadata.title}</span>
                  )}
                </div>
              )}
              {bookSeries.length > 0 && (
                <div className="text-foreground-muted min-w-0 text-[0.75em] md:text-[0.875em]">
                  {bookSeries.map((series, idx) => (
                    <span key={series.id}>
                      {idx > 0 && ' '}
                      {isMdUp ? (
                        <Link
                          href={`/library/${libraryItem.libraryId}/series/${series.id}`}
                          className={mergeClasses('inline-block font-sans hover:underline', COMPILATION_ROW_LINK_FOCUS)}
                        >
                          {series.name}
                          {series.sequence && ` #${series.sequence}`}
                        </Link>
                      ) : (
                        <span className="inline-block font-sans">
                          {series.name}
                          {series.sequence && ` #${series.sequence}`}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {bookAuthors.length > 0 && (
                <div className="text-foreground-muted min-w-0 text-[0.75em] md:text-[0.875em]">
                  {bookAuthors.map((author, index) => (
                    <span key={author.id}>
                      {isMdUp ? (
                        <Link
                          href={`/library/${libraryItem.libraryId}/authors/${author.id}`}
                          className={mergeClasses('inline-block hover:underline', COMPILATION_ROW_LINK_FOCUS)}
                        >
                          {author.name}
                        </Link>
                      ) : (
                        <span className="inline-block">{author.name}</span>
                      )}
                      {index < bookAuthors.length - 1 && <>,&nbsp;</>}
                    </span>
                  ))}
                </div>
              )}
              {itemDuration && <p className="text-foreground-subdued px-1e truncate text-[0.75em] md:text-[0.875em]">{itemDuration}</p>}
            </div>
          </div>
        </div>

        {showMobilePlayBtn && (
          <div className="pe-1e relative z-[2] flex shrink-0 items-center">
            <IconBtn borderless size="custom" className={COMPILATION_ROW_ACTION_BTN_CLASS} ariaLabel={t('ButtonPlay')} onClick={handlePlayClick}>
              play_arrow
            </IconBtn>
          </div>
        )}

        {showHoverActions && (
          <div className="flex shrink-0 items-center gap-0">
            <Tooltip text={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} position="top">
              <span className="inline-flex items-center">
                <ReadIconBtn
                  disabled={isProcessingReadUpdate}
                  isRead={userIsFinished}
                  borderless
                  size="custom"
                  className={COMPILATION_ROW_ACTION_BTN_CLASS}
                  onClick={handleToggleFinished}
                />
              </span>
            </Tooltip>
            {canShowEdit && (
              <IconBtn borderless size="custom" className={COMPILATION_ROW_ACTION_BTN_CLASS} ariaLabel={t('LabelEdit')} onClick={handleEdit}>
                edit
              </IconBtn>
            )}
            {canShowRemove && (
              <IconBtn
                borderless
                size="custom"
                className={COMPILATION_ROW_ACTION_BTN_CLASS}
                ariaLabel={t('ButtonRemove')}
                disabled={processingRemove}
                onClick={handleRemoveClick}
              >
                close
              </IconBtn>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
