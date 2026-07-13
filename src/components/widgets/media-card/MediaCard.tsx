'use client'

import AddToCollectionModal from '@/components/modals/AddToCollectionModal'
import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal'
import AudioFileDataModal from '@/components/modals/AudioFileDataModal'
import CoverEditModal from '@/components/modals/CoverEditModal'
import EpisodeEditModal from '@/components/modals/EpisodeEditModal'
import EpisodeMatchModal from '@/components/modals/EpisodeMatchModal'
import LibraryItemEditModal from '@/components/modals/LibraryItemEditModal'
import MatchModal from '@/components/modals/MatchModal'
import RssFeedOpenCloseModal from '@/components/modals/RssFeedOpenCloseModal'
import ShareModal from '@/components/modals/ShareModal'
import ViewEpisodeModal from '@/components/modals/ViewEpisodeModal'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import DraggableMediaOverlayIconBtn from '@/components/widgets/media-card/DraggableMediaOverlayIconBtn'
import MediaCardCover from '@/components/widgets/media-card/MediaCardCover'
import MediaCardDetailView from '@/components/widgets/media-card/MediaCardDetailView'
import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaCardOverlay from '@/components/widgets/media-card/MediaCardOverlay'
import type { SortableBookshelfCardOptions } from '@/components/widgets/media-card/SortableBookshelfCard'
import { useBookshelfSelectionOptional } from '@/contexts/BookshelfSelectionContext'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useBookCoverAspectRatio, useLibrary } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { isDragOnlyOverlay, useSortableBookshelfOverlay } from '@/contexts/SortableBookshelfOverlayContext'
import { useCoarsePointer } from '@/hooks/useMediaQuery'
import { useShiftClickTextSelectionGuard } from '@/hooks/useShiftClickTextSelectionGuard'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getMediaCardModalNavigationContext } from '@/lib/bookshelfNavigationContext'
import { getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { getMediaCardEpisodeEditNavigationContext } from '@/lib/episodeEditNavigation'
import { getEbookFormat } from '@/lib/ereader/ereaderEbook'
import { computeProgress } from '@/lib/mediaProgress'
import type { ShelfNavigationEntity } from '@/lib/shelfNavigationEntity'
import type { BookMedia, EReaderDevice, LibraryItem, MediaProgress, PodcastEpisode, PodcastMedia, UserPermissions } from '@/types/api'
import { BookshelfView, isBookMedia, isBookMediaWithTracks, isBookMetadata, isPodcastLibraryItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { useMediaCardActions } from './useMediaCardActions'

export interface MediaCardProps {
  libraryItem: LibraryItem
  bookshelfView: BookshelfView
  orderBy?: string
  sortingIgnorePrefix?: boolean
  continueListeningShelf?: boolean
  continueSeriesShelf?: boolean
  /**
   * Server-computed or cached media progress for this library item
   */
  mediaProgress?: MediaProgress | null
  sizeMultiplier?: number
  dateFormat: string
  timeFormat: string
  userPermissions: UserPermissions
  ereaderDevices: EReaderDevice[]
  showSubtitles: boolean
  /**
   * Optional render function for type-specific badges (books/podcasts)
   */
  renderBadges?: (props: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => ReactNode
  /**
   * Optional render function for overlay badges (e.g., ebook format)
   */
  renderOverlayBadges?: () => ReactNode
  /**
   * Optional render function for series name overlay when hovering
   */
  renderSeriesNameOverlay?: (isHovering: boolean) => ReactNode
  /**
   * Optional episode to display instead of the main library item (e.g. for recent episodes)
   */
  episode?: PodcastEpisode
  /**
   * Whether the card is in selection mode
   */
  isSelectionMode?: boolean
  /**
   * Whether the card is currently selected
   */
  selected?: boolean
  /**
   * Callback when the select button is clicked
   */
  onSelect?: (event: React.MouseEvent) => void
  /** Shift-range keyboard anchor key from bookshelf selection hook. */
  selectionAnchorKey?: string
  /**
   * When both are set, modal prev/next scope is built lazily on open from this shelf snapshot (sparse bookshelf grid or dense home row).
   */
  shelfEntities?: (ShelfNavigationEntity | null)[]
  entityIndex?: number
  /** Wired by sortable bookshelf hosts (`SortableBookshelfCard`, `DragOverlay`, etc.). */
  dragOptions?: SortableBookshelfCardOptions
  /** Called after a library item or episode delete succeeds. */
  onDeleteSuccess?: () => void
}

const LONG_PRESS_MS = 450
const LONG_PRESS_MOVE_THRESHOLD_PX = 10

function createSyntheticSelectEvent(shiftKey = false): MouseEvent {
  return { shiftKey } as MouseEvent
}

function isSpaceKey(event: KeyboardEvent): boolean {
  return event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar'
}

function MediaCard(props: MediaCardProps) {
  const {
    libraryItem,
    bookshelfView,
    orderBy,
    sortingIgnorePrefix = false,
    continueListeningShelf = false,
    continueSeriesShelf = false,
    mediaProgress,
    sizeMultiplier,
    dateFormat,
    timeFormat,
    ereaderDevices,
    showSubtitles,
    renderBadges,
    renderOverlayBadges,
    renderSeriesNameOverlay,
    episode,
    isSelectionMode = false,
    selected = false,
    onSelect,
    selectionAnchorKey,
    shelfEntities,
    entityIndex,
    dragOptions,
    onDeleteSuccess
  } = props

  const sortableBookshelfOverlay = useSortableBookshelfOverlay()
  const overlayMode = dragOptions?.overlayMode ?? sortableBookshelfOverlay?.overlayMode ?? 'hover'
  const isCoarsePointer = useCoarsePointer()
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const selectionSelectHandlerRef = useRef(onSelect)
  selectionSelectHandlerRef.current = onSelect
  const bookshelfSelection = useBookshelfSelectionOptional()
  const tabFocusPendingRef = useRef(false)
  const hasSelectionHandler = Boolean(onSelect)
  const { onMouseDown: selectionMouseDown, suppressTextSelection } = useShiftClickTextSelectionGuard({
    enabled: hasSelectionHandler,
    selectionActive: isSelectionMode
  })

  useEffect(() => {
    const markTabFocus = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Tab') {
        tabFocusPendingRef.current = true
      }
    }
    const clearTabFocus = () => {
      tabFocusPendingRef.current = false
    }

    document.addEventListener('keydown', markTabFocus, true)
    document.addEventListener('pointerdown', clearTabFocus, true)
    return () => {
      document.removeEventListener('keydown', markTabFocus, true)
      document.removeEventListener('pointerdown', clearTabFocus, true)
    }
  }, [])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer])

  const router = useRouter()
  const { setBoundModal } = useLibrary()
  const coverAspect = useBookCoverAspectRatio()
  const { libraryItemIdStreaming, isStreaming, isPlaying, isStreamingFromDifferentLibrary, getIsMediaQueued, playerHandler } = useMediaContext()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const cardId = useId()
  const t = useTypeSafeTranslations()

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const [isHovering, setIsHovering] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const clearBoundModal = useCallback(() => setBoundModal(null), [setBoundModal])

  const closeMoreMenu = useCallback(() => {
    setIsMoreMenuOpen(false)
    setIsHovering(false)
  }, [])

  const handleOpenMatch = useCallback(() => {
    closeMoreMenu()
    if (episode) {
      const navCtx = getMediaCardEpisodeEditNavigationContext(episode.id, libraryItem.id, shelfEntities, entityIndex)
      setBoundModal(<EpisodeMatchModal key={`episode-match-modal-${episode.id}`} isOpen navCtx={navCtx} onClose={clearBoundModal} />)
      return
    }
    const navCtx = getMediaCardModalNavigationContext(libraryItem.id, shelfEntities, entityIndex)
    setBoundModal(<MatchModal key="match-modal" isOpen navCtx={navCtx} onClose={clearBoundModal} />)
  }, [clearBoundModal, closeMoreMenu, episode, entityIndex, libraryItem.id, shelfEntities, setBoundModal])

  const handleOpenEdit = useCallback(() => {
    closeMoreMenu()
    if (episode) {
      const navCtx = getMediaCardEpisodeEditNavigationContext(episode.id, libraryItem.id, shelfEntities, entityIndex)
      setBoundModal(<EpisodeEditModal key={`episode-edit-modal-${episode.id}`} isOpen navCtx={navCtx} onClose={clearBoundModal} />)
      return
    }
    const navCtx = getMediaCardModalNavigationContext(libraryItem.id, shelfEntities, entityIndex)
    setBoundModal(<LibraryItemEditModal key="library-item-edit-modal" isOpen navCtx={navCtx} onClose={clearBoundModal} />)
  }, [clearBoundModal, closeMoreMenu, episode, libraryItem, shelfEntities, entityIndex, setBoundModal])

  const handleOpenCoverEdit = useCallback(() => {
    closeMoreMenu()
    if (episode) return
    const navCtx = getMediaCardModalNavigationContext(libraryItem.id, shelfEntities, entityIndex)
    setBoundModal(<CoverEditModal key={`cover-edit-modal-${libraryItem.id}`} isOpen navCtx={navCtx} onClose={clearBoundModal} />)
  }, [clearBoundModal, closeMoreMenu, episode, libraryItem.id, shelfEntities, entityIndex, setBoundModal])

  const handleMoreMenuOpenChange = (isOpen: boolean) => {
    setIsMoreMenuOpen(isOpen)
    // Clear hovering state when menu closes to prevent overlay from staying open
    if (!isOpen) {
      setIsHovering(false)
    }
  }

  const isPodcast = isPodcastLibraryItem(libraryItem)

  const media = libraryItem.media as BookMedia | PodcastMedia
  const originalMetadata = media.metadata

  // Normalize metadata properties once to avoid repeated type checks
  const metadata = useMemo(() => {
    if (isBookMetadata(originalMetadata)) {
      return {
        authorName: originalMetadata.authorName ?? originalMetadata.author,
        authorNameLF: originalMetadata.authorNameLF,
        titleIgnorePrefix: originalMetadata.titleIgnorePrefix,
        subtitle: originalMetadata.subtitle,
        seriesName: originalMetadata.seriesName,
        publishedYear: originalMetadata.publishedYear
      }
    }
    // Podcast metadata
    return {
      authorName: originalMetadata.author,
      authorNameLF: null,
      titleIgnorePrefix: null,
      subtitle: null,
      seriesName: null,
      publishedYear: null
    }
  }, [originalMetadata])

  const placeholderUrl = getPlaceholderCoverUrl()
  const hasCover = !!media.coverPath

  const coverHeight = 192 * effectiveSizeMultiplier
  const coverWidth = coverHeight / coverAspect

  const title = originalMetadata.title || ''
  const isExplicit = originalMetadata.explicit

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL
  const isAuthorBookshelfView = bookshelfView === BookshelfView.AUTHOR

  const [rssFeed, setRssFeed] = useState(libraryItem.rssFeed ?? null)

  useEffect(() => {
    setRssFeed(libraryItem.rssFeed ?? null)
  }, [libraryItem.rssFeed])

  const isMissing = libraryItem.isMissing
  const isInvalid = libraryItem.isInvalid

  // Keep useMemo for computeProgress since it's an actual computation
  const {
    percent: userProgressPercent,
    isFinished: itemIsFinished,
    lastUpdated,
    startedAt,
    finishedAt
  } = useMemo(() => computeProgress({ progress: mediaProgress, useSeriesProgress: false }), [mediaProgress])

  // Show-level podcast cards have no per-item progress; episode cards use `episode` or `recentEpisode`.
  const showProgressBar = userProgressPercent > 0 && (!isPodcast || !!episode || !!libraryItem.recentEpisode)

  const playIconFontSize = Math.max(2, 3 * effectiveSizeMultiplier)
  const author = metadata.authorName

  const displayTitle = (() => {
    if (episode) return episode.title
    const ignorePrefix = orderBy === 'media.metadata.title' && sortingIgnorePrefix
    if (ignorePrefix && metadata.titleIgnorePrefix) {
      return metadata.titleIgnorePrefix
    }
    return title || '\u00A0'
  })()

  const displaySubtitle = (() => {
    if (!libraryItem) return '\u00A0'
    if (metadata.subtitle) return metadata.subtitle
    if (metadata.seriesName) return metadata.seriesName
    return ''
  })()

  const displayLineTwo = (() => {
    if (episode) return title
    if (isPodcast) return author || ''
    if (isAuthorBookshelfView && metadata.publishedYear) {
      return metadata.publishedYear
    }
    if (orderBy === 'media.metadata.authorNameLF' && metadata.authorNameLF) {
      return metadata.authorNameLF
    }
    return author || ''
  })()

  const titleCleaned = !title ? '' : title.length > 60 ? `${title.slice(0, 57)}...` : title
  const authorCleaned = !author ? '' : author.length > 30 ? `${author.slice(0, 27)}...` : author

  const showError = !isPodcast && (isMissing || isInvalid)
  const errorText = isMissing
    ? t('ErrorItemDirectoryMissing')
    : isInvalid
      ? isPodcast
        ? t('ErrorPodcastHasNoEpisodes')
        : t('ErrorItemNoAudioTracksOrEbook')
      : t('ErrorUnknown')

  const isStreamingFromDifferentLib = isStreamingFromDifferentLibrary(libraryItem.libraryId)
  const isQueued = getIsMediaQueued(libraryItem.id, episode?.id ?? null)

  const isAudiobook = isBookMediaWithTracks(media)

  const isItemPlaying = isPlaying(libraryItem.id, episode?.id ?? null)

  const showPlayButton = !isSelectionMode && !isMissing && !isInvalid && (isAudiobook || !!episode || !!libraryItem.recentEpisode)

  const showReadButton = !isSelectionMode && !showPlayButton && isBookMedia(media) && !!getEbookFormat(media)

  const globalSelectionActive = bookshelfSelection?.isSelectionMode ?? false
  const showSelectRadioButton = !isAuthorBookshelfView && Boolean(onSelect) && (isSelectionMode || !globalSelectionActive)

  const {
    processing,
    isPending,
    confirmState,
    rssFeedModalOpen,
    shareModalOpen,
    collectionsModalOpen,
    playlistsModalOpen,
    mediaItemShare,
    closeConfirm,
    closeRssFeedModal,
    closeShareModal,
    closeCollectionsModal,
    closePlaylistsModal,
    handleShareChange,
    handlePlay,
    handleReadEBook,
    handleMoreAction,
    moreMenuItems,
    audioFileToShow,
    closeMoreInfo
  } = useMediaCardActions({
    libraryItem,
    media,
    title,
    author: author || null,
    episodeForQueue: episode || null,
    mediaProgress,
    itemIsFinished,
    userProgressPercent,
    isPodcast,
    ereaderDevices,
    continueListeningShelf,
    continueSeriesShelf,
    libraryItemIdStreaming,
    isStreaming,
    isStreamingFromDifferentLib,
    isQueued,
    initialShare: libraryItem.mediaItemShare ?? null,
    onOpenMatch: handleOpenMatch,
    onOpenCoverEdit: handleOpenCoverEdit,
    onDeleteSuccess,
    playerControls: playerHandler.controls
  })

  const performCardActivate = useCallback(() => {
    closeMoreMenu()

    if (episode && isPodcastLibraryItem(libraryItem)) {
      const navCtx = getMediaCardEpisodeEditNavigationContext(episode.id, libraryItem.id, shelfEntities, entityIndex)
      setBoundModal(<ViewEpisodeModal key={`view-episode-modal-${episode.id}`} isOpen navCtx={navCtx} onClose={clearBoundModal} />)
      return
    }
    router.push(`/library/${libraryItem.libraryId}/item/${libraryItem.id}`)
  }, [clearBoundModal, closeMoreMenu, entityIndex, episode, libraryItem, router, setBoundModal, shelfEntities])

  const handleCardClick = useCallback(
    (event: MouseEvent) => {
      closeMoreMenu()

      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (isSelectionMode && selectionSelectHandlerRef.current) {
        event.preventDefault()
        event.stopPropagation()
        selectionSelectHandlerRef.current(event)
        return
      }

      performCardActivate()
    },
    [closeMoreMenu, isSelectionMode, performCardActivate]
  )

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (processing || isDragOnlyOverlay(overlayMode)) return
      if (dragOptions?.overlayMode === 'drag') return

      if (isSpaceKey(event)) {
        if (!selectionSelectHandlerRef.current) return
        if (event.repeat) return
        event.preventDefault()
        event.stopPropagation()
        selectionSelectHandlerRef.current(createSyntheticSelectEvent(event.shiftKey))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        performCardActivate()
      }
    },
    [dragOptions?.overlayMode, overlayMode, performCardActivate, processing]
  )

  const handleCardFocus = useCallback(() => {
    if (!selectionSelectHandlerRef.current || !tabFocusPendingRef.current || !selectionAnchorKey) return
    tabFocusPendingRef.current = false
    bookshelfSelection?.ensureSelectionAnchor(selectionAnchorKey)
  }, [bookshelfSelection, selectionAnchorKey])

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (!selectionSelectHandlerRef.current || !isCoarsePointer || processing || isSelectionMode) return

      longPressTriggeredRef.current = false
      pointerStartRef.current = { x: event.clientX, y: event.clientY }

      clearLongPressTimer()
      longPressTimerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true
        selectionSelectHandlerRef.current?.(createSyntheticSelectEvent(false))
      }, LONG_PRESS_MS)
    },
    [clearLongPressTimer, isCoarsePointer, isSelectionMode, processing]
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!longPressTimerRef.current || !pointerStartRef.current) return

      const dx = event.clientX - pointerStartRef.current.x
      const dy = event.clientY - pointerStartRef.current.y
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD_PX) {
        clearLongPressTimer()
      }
    },
    [clearLongPressTimer]
  )

  const handlePointerEnd = useCallback(() => {
    clearLongPressTimer()
    pointerStartRef.current = null
  }, [clearLongPressTimer])

  const navigateOnCardClick = !processing && !isDragOnlyOverlay(overlayMode)
  const cardClickHandler = navigateOnCardClick || (isSelectionMode && hasSelectionHandler) ? handleCardClick : undefined
  const cardKeyDownHandler = navigateOnCardClick || hasSelectionHandler ? handleCardKeyDown : undefined
  const cardFocusHandler = hasSelectionHandler ? handleCardFocus : undefined
  const pointerHandlers =
    hasSelectionHandler && isCoarsePointer && !processing
      ? {
          onPointerDown: handlePointerDown,
          onPointerUp: handlePointerEnd,
          onPointerCancel: handlePointerEnd,
          onPointerMove: handlePointerMove
        }
      : undefined

  const dragHandle = useMemo(() => {
    if (!dragOptions?.ariaLabel) return undefined
    return <DraggableMediaOverlayIconBtn icon="drag_handle" ariaLabel={dragOptions.ariaLabel} activatorProps={dragOptions.dragHandlePointerProps} />
  }, [dragOptions])

  return (
    <>
      <MediaCardFrame
        width={coverWidth}
        height={coverHeight}
        rootRef={dragOptions?.cardActivatorRef}
        sortableFrameProps={dragOptions?.sortableFrameProps}
        className={dragOptions ? 'group' : undefined}
        aria-selected={hasSelectionHandler && isSelectionMode ? selected : undefined}
        suppressTextSelection={suppressTextSelection}
        onClick={cardClickHandler}
        onMouseDown={selectionMouseDown}
        onPointerDown={pointerHandlers?.onPointerDown}
        onPointerUp={pointerHandlers?.onPointerUp}
        onPointerCancel={pointerHandlers?.onPointerCancel}
        onPointerMove={pointerHandlers?.onPointerMove}
        onKeyDown={cardKeyDownHandler}
        onFocus={cardFocusHandler}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseOver={
          dragOptions
            ? () => {
                setIsHovering(true)
              }
            : undefined
        }
        cardId={cardId}
        cy-id="MediaCard"
        footer={
          (isAlternativeBookshelfView || isAuthorBookshelfView) && (
            <MediaCardDetailView
              displayTitle={displayTitle}
              displaySubtitle={displaySubtitle}
              displayLineTwo={displayLineTwo}
              isExplicit={isExplicit}
              showSubtitles={showSubtitles}
              orderBy={orderBy}
              libraryItem={libraryItem}
              media={media}
              dateFormat={dateFormat}
              timeFormat={timeFormat}
              lastUpdated={lastUpdated}
              startedAt={startedAt}
              finishedAt={finishedAt}
            />
          )
        }
        cover={
          <MediaCardCover
            libraryItem={libraryItem}
            coverAspect={coverAspect}
            placeholderUrl={placeholderUrl}
            hasCover={hasCover}
            title={title}
            titleCleaned={titleCleaned}
            authorCleaned={authorCleaned}
            userProgressPercent={userProgressPercent}
            itemIsFinished={itemIsFinished}
            showProgressBar={showProgressBar}
          />
        }
        overlay={
          <MediaCardOverlay
            isHovering={isHovering}
            isSelectionMode={isSelectionMode}
            selected={selected}
            processing={processing}
            isPending={isPending}
            isMoreMenuOpen={isMoreMenuOpen}
            showPlayButton={showPlayButton}
            showReadButton={showReadButton}
            isItemPlaying={isItemPlaying}
            playIconFontSize={playIconFontSize}
            moreMenuItems={moreMenuItems}
            rssFeed={rssFeed}
            mediaItemShare={mediaItemShare}
            showError={showError}
            errorText={errorText}
            showSelectRadioButton={showSelectRadioButton}
            renderOverlayBadges={renderOverlayBadges}
            renderBadges={renderBadges}
            renderSeriesNameOverlay={renderSeriesNameOverlay}
            onPlay={handlePlay}
            onRead={handleReadEBook}
            onEdit={handleOpenEdit}
            onMoreAction={handleMoreAction}
            onMoreMenuOpenChange={handleMoreMenuOpenChange}
            onSelect={onSelect}
            dragHandle={dragHandle}
            overlayModeOverride={overlayMode}
          />
        }
      />

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
      {rssFeedModalOpen && (
        <RssFeedOpenCloseModal
          isOpen={rssFeedModalOpen}
          onClose={closeRssFeedModal}
          onFeedChange={setRssFeed}
          entity={{
            id: libraryItem.id,
            name: title,
            type: 'item',
            feed: rssFeed ?? null,
            hasEpisodesWithoutPubDate: isPodcast && ((media as PodcastMedia).episodes ?? []).some((ep) => !ep.pubDate)
          }}
        />
      )}
      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={closeShareModal}
          mediaItemId={libraryItem.media.id ?? ''}
          mediaItemShare={mediaItemShare}
          onShareChange={handleShareChange}
        />
      )}
      {collectionsModalOpen && (
        <AddToCollectionModal
          isOpen={collectionsModalOpen}
          onClose={closeCollectionsModal}
          libraryId={libraryItem.libraryId}
          libraryItemIds={[libraryItem.id]}
          itemTitle={title}
        />
      )}
      {playlistsModalOpen && (
        <AddToPlaylistModal
          isOpen={playlistsModalOpen}
          onClose={closePlaylistsModal}
          libraryId={libraryItem.libraryId}
          items={[{ libraryItemId: libraryItem.id, episodeId: episode?.id ?? null }]}
          headerTitle={episode?.title ?? title}
        />
      )}
      {audioFileToShow && <AudioFileDataModal isOpen={!!audioFileToShow} audioFile={audioFileToShow} libraryItemId={libraryItem.id} onClose={closeMoreInfo} />}
    </>
  )
}

/**
 * Memoized MediaCard component to prevent unnecessary re-renders when parent updates.
 * Only re-renders when props actually change.
 */
const MemoizedMediaCard = memo(MediaCard)

// Named export for testing
export { MemoizedMediaCard as MediaCard }

// Default export for compatibility
export default MemoizedMediaCard
