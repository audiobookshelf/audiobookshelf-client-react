'use client'

import { removeBookFromCollectionAction } from '@/app/actions/collectionActions'
import { toggleFinishedAction } from '@/app/actions/mediaActions'
import PreviewCover from '@/components/covers/PreviewCover'
import LibraryItemEditModal from '@/components/modals/LibraryItemEditModal'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import type { SortableListDragHandleProps } from '@/components/widgets/SortableList'
import { useBookCoverAspectRatio, useLibrary } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { usePrimaryInputCanHover, useSortableBookshelf } from '@/contexts/SortableBookshelfContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getMediaCardModalNavigationContext } from '@/lib/bookshelfNavigationContext'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH, DRAG_HANDLE_GRAB_CURSOR } from '@/lib/dragHandleClasses'
import { formatDuration } from '@/lib/formatDuration'
import { buildMediaItemProgressMap } from '@/lib/mediaProgress'
import { mergeClasses } from '@/lib/merge-classes'
import type { BookMetadata, BookshelfEntity, LibraryItem, Series } from '@/types/api'
import { isBookMedia, isBookMetadata } from '@/types/api'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface CollectionBookListRowProps {
  book: LibraryItem
  collectionId: string
  entityIndex: number
  shelfEntities: (BookshelfEntity | null)[]
  showDragHandle: boolean
  sortableDragHandleProps: SortableListDragHandleProps
  isDragging?: boolean
}

const COLLECTION_ROW_LINK_FOCUS = 'rounded-sm px-1 py-0.5 focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-0'

function getSeriesList(series: BookMetadata['series']): { id: string; text: string }[] {
  if (!Array.isArray(series)) return []
  return series.map((se: Series) => {
    let text = se.name ?? ''
    if (se.sequence) text += ` #${se.sequence}`
    return { id: se.id, text }
  })
}

export default function CollectionBookListRow({
  book,
  collectionId,
  entityIndex,
  shelfEntities,
  showDragHandle,
  sortableDragHandleProps,
  isDragging = false
}: CollectionBookListRowProps) {
  const t = useTypeSafeTranslations()
  const { user, userCanUpdate, userCanDelete } = useUser()
  const { setBoundModal } = useLibrary()
  const sortableBookshelf = useSortableBookshelf()
  const primaryInputCanHover = usePrimaryInputCanHover()
  const { playItem, isPlaying } = useMediaContext()
  const { showToast } = useGlobalToast()
  const bookCoverAspectRatio = useBookCoverAspectRatio()
  const [, startTransition] = useTransition()

  const [isHovering, setIsHovering] = useState(false)
  const [isProcessingReadUpdate, setIsProcessingReadUpdate] = useState(false)
  const [processingRemove, setProcessingRemove] = useState(false)

  const media = book.media
  const mediaMetadata = media?.metadata
  const isBook = isBookMedia(media) && isBookMetadata(mediaMetadata)

  const bookTitle = mediaMetadata?.title ?? ''
  const authors = isBook ? mediaMetadata.authors : undefined
  const bookAuthors = useMemo(() => authors ?? [], [authors])
  const seriesList = isBook ? getSeriesList(mediaMetadata.series) : []
  const tracks = isBook && 'tracks' in media ? (media.tracks ?? []) : []
  const duration = isBook && 'duration' in media ? media.duration : 0
  const bookDuration = duration ? formatDuration(duration, t) : ''

  const mediaItemProgressMap = useMemo(() => buildMediaItemProgressMap(user.mediaProgress), [user.mediaProgress])
  const itemProgress = mediaItemProgressMap.get(book.id) ?? null
  const userIsFinished = !!itemProgress?.isFinished

  const isMissing = book.isMissing
  const isInvalid = book.isInvalid
  const streamIsPlaying = isPlaying(book.id)
  const showPlayBtn = !isMissing && !isInvalid && !streamIsPlaying && tracks.length > 0

  const [isMdUp, setIsMdUp] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsMdUp(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const coverSize = isMdUp ? 50 : 30
  const coverWidth = bookCoverAspectRatio === 1 ? coverSize * 1.6 : coverSize

  const placeholderUrl = getPlaceholderCoverUrl()
  const coverSrc = getLibraryItemCoverSrc(book, placeholderUrl)

  const clearBoundModal = useCallback(() => setBoundModal(null), [setBoundModal])

  const handleEdit = useCallback(() => {
    const navCtx = getMediaCardModalNavigationContext(book.id, shelfEntities, entityIndex)
    setBoundModal(<LibraryItemEditModal key="library-item-edit-modal" isOpen navCtx={navCtx} onClose={clearBoundModal} />)
  }, [book.id, clearBoundModal, entityIndex, setBoundModal, shelfEntities])

  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (!isBook || !mediaMetadata) return
      const queueItems = [
        {
          libraryItemId: book.id,
          libraryId: book.libraryId,
          episodeId: null,
          title: bookTitle,
          subtitle: bookAuthors.map((au) => au.name).join(', '),
          caption: '',
          duration: duration || null,
          coverPath: isBook && 'coverPath' in media ? (media.coverPath ?? null) : null
        }
      ]
      playItem({ libraryItem: book, queueItems })
    },
    [book, bookAuthors, bookTitle, duration, isBook, media, mediaMetadata, playItem]
  )

  const handleToggleFinished = useCallback(() => {
    setIsProcessingReadUpdate(true)
    startTransition(async () => {
      try {
        await toggleFinishedAction(book.id, { isFinished: !userIsFinished })
      } catch (error) {
        console.error('Failed to toggle finished', error)
        showToast(userIsFinished ? t('ToastItemMarkedAsNotFinishedFailed') : t('ToastItemMarkedAsFinishedFailed'), { type: 'error' })
      } finally {
        setIsProcessingReadUpdate(false)
      }
    })
  }, [book.id, showToast, t, userIsFinished])

  const handleRemoveClick = useCallback(() => {
    setProcessingRemove(true)
    startTransition(async () => {
      try {
        await removeBookFromCollectionAction(collectionId, book.id)
        showToast(t('ToastRemoveItemFromCollectionSuccess'), { type: 'success' })
        sortableBookshelf?.onLibraryItemRemovedFromSortableList?.(book.id)
      } catch (error) {
        console.error('Failed to remove book from collection', error)
        showToast(t('ToastRemoveItemFromCollectionFailed'), { type: 'error' })
      } finally {
        setProcessingRemove(false)
      }
    })
  }, [book.id, collectionId, showToast, sortableBookshelf, t])

  const handleMouseEnter = () => {
    if (isDragging) return
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const showHoverActions = primaryInputCanHover && isHovering && !isDragging
  const bookItemHref = `/library/${book.libraryId}/item/${book.id}`

  return (
    <div
      className={mergeClasses('relative w-full overflow-hidden px-1 py-2 md:px-2', isHovering && !isDragging ? 'bg-foreground/5' : '')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex h-18 min-w-0 md:h-[5.5rem]">
        {showDragHandle && (
          <div className="h-full w-10 min-w-10 md:w-16 md:max-w-16">
            <div className="flex h-full items-center justify-center">
              <div
                ref={sortableDragHandleProps.setActivatorNodeRef}
                className={mergeClasses('drag-handle flex items-center justify-center', DRAG_HANDLE_GRAB_CURSOR, DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH)}
                {...sortableDragHandleProps.attributes}
                {...sortableDragHandleProps.listeners}
              >
                <span className="material-symbols text-foreground-subdued hover:text-foreground text-lg leading-none md:text-xl">menu</span>
              </div>
            </div>
          </div>
        )}

        <div className="relative flex h-full min-w-0 flex-1">
          {!isMdUp && (
            <Link
              href={bookItemHref}
              className={mergeClasses(
                'absolute inset-0 z-[1] rounded-sm focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-0 md:hidden',
                isDragging && 'pointer-events-none'
              )}
              aria-label={bookTitle}
            />
          )}

          <div className="flex h-full items-center" style={{ width: coverWidth, minWidth: coverWidth, maxWidth: coverWidth }}>
            <div className="relative">
              <PreviewCover src={coverSrc} width={coverWidth} showResolution={false} />
              {showHoverActions && showPlayBtn && (
                <div className="absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center bg-black/50">
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/20 hover:bg-white/40"
                    onClick={handlePlayClick}
                    aria-label={t('ButtonPlay')}
                  >
                    <span className="material-symbols fill text-2xl text-white">play_arrow</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex h-full min-w-0 flex-1 items-center px-2 md:px-3">
            <div className="flex w-full min-w-0 flex-col justify-center">
              {isMdUp ? (
                <Link
                  href={bookItemHref}
                  className={mergeClasses('text-foreground inline-block w-fit max-w-full text-sm hover:underline md:text-base', COLLECTION_ROW_LINK_FOCUS)}
                  title={bookTitle}
                >
                  <span className="block truncate">{bookTitle}</span>
                </Link>
              ) : (
                <span className="text-foreground block truncate text-sm" title={bookTitle}>
                  {bookTitle}
                </span>
              )}
              {seriesList.length > 0 && (
                <div className="text-foreground-muted min-w-0 text-xs md:text-sm">
                  {seriesList.map((se, idx) => (
                    <span key={se.id}>
                      {idx > 0 && ' '}
                      {isMdUp ? (
                        <Link
                          href={`/library/${book.libraryId}/series/${se.id}`}
                          className={mergeClasses('inline-block font-sans hover:underline', COLLECTION_ROW_LINK_FOCUS)}
                        >
                          {se.text}
                        </Link>
                      ) : (
                        <span className="inline-block font-sans">{se.text}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {bookAuthors.length > 0 && (
                <div className="text-foreground-muted min-w-0 text-xs md:text-sm">
                  {bookAuthors.map((author, index) => (
                    <span key={author.id}>
                      {isMdUp ? (
                        <Link
                          href={`/library/${book.libraryId}/authors/${author.id}`}
                          className={mergeClasses('inline-block hover:underline', COLLECTION_ROW_LINK_FOCUS)}
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
              {bookDuration && <p className="text-foreground-subdued truncate px-1 text-xs md:text-sm">{bookDuration}</p>}
            </div>
          </div>
        </div>

        {showHoverActions && (
          <div className="flex h-full shrink-0 items-center">
            <Tooltip text={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} position="top">
              <span className="mx-1 mt-0.5 inline-flex">
                <ReadIconBtn disabled={isProcessingReadUpdate} isRead={userIsFinished} borderless onClick={handleToggleFinished} />
              </span>
            </Tooltip>
            {userCanUpdate && (
              <div className="mx-1">
                <IconBtn borderless ariaLabel={t('LabelEdit')} onClick={handleEdit}>
                  edit
                </IconBtn>
              </div>
            )}
            {userCanDelete && (
              <div className="mx-1">
                <IconBtn borderless ariaLabel={t('ButtonRemove')} disabled={processingRemove} onClick={handleRemoveClick}>
                  close
                </IconBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
