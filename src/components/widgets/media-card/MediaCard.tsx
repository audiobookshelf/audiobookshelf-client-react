'use client'

import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import MediaCardCover from '@/components/widgets/media-card/MediaCardCover'
import MediaCardDetailView from '@/components/widgets/media-card/MediaCardDetailView'
import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaCardOverlay from '@/components/widgets/media-card/MediaCardOverlay'
import { useMediaCardActions } from '@/components/widgets/media-card/useMediaCardActions'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getCoverAspectRatio, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { computeProgress } from '@/lib/mediaProgress'
import type {
  BookMedia,
  BookMetadata,
  EReaderDevice,
  LibraryItem,
  MediaProgress,
  PodcastEpisode,
  PodcastMedia,
  PodcastMetadata,
  UserPermissions
} from '@/types/api'
import { BookshelfView, isBookMedia, isBookMetadata, isPodcastLibraryItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useId, useMemo, useState, type ReactNode } from 'react'

export interface MediaCardProps {
  libraryItem: LibraryItem
  bookshelfView: BookshelfView
  orderBy?: string
  sortingIgnorePrefix?: boolean
  continueListeningShelf?: boolean
  /**
   * Server-computed or cached media progress for this library item
   */
  mediaProgress?: MediaProgress | null
  /**
   * Optional precomputed series progress for collapsed series items (0–1).
   */
  seriesProgressPercent?: number
  /**
   * Cover configuration
   */
  bookCoverAspectRatio?: number
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
}

function MediaCard(props: MediaCardProps) {
  const {
    libraryItem,
    bookshelfView,
    orderBy,
    sortingIgnorePrefix = false,
    continueListeningShelf = false,
    mediaProgress,
    seriesProgressPercent,
    bookCoverAspectRatio,
    sizeMultiplier,
    dateFormat,
    timeFormat,
    userPermissions,
    ereaderDevices,
    showSubtitles,
    renderBadges,
    renderOverlayBadges,
    renderSeriesNameOverlay,
    episode,
    isSelectionMode = false,
    selected = false,
    onSelect
  } = props

  const router = useRouter()
  const { libraryItemIdStreaming, isStreaming, isStreamingFromDifferentLibrary, getIsMediaQueued } = useMediaContext()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const cardId = useId()
  const t = useTypeSafeTranslations()

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const [isHovering, setIsHovering] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const handleMoreMenuOpenChange = useCallback((isOpen: boolean) => {
    setIsMoreMenuOpen(isOpen)
    // Clear hovering state when menu closes to prevent overlay from staying open
    if (!isOpen) {
      setIsHovering(false)
    }
  }, [])

  const isPodcast = isPodcastLibraryItem(libraryItem)

  // Memoize media to prevent cascading re-renders in dependent memos
  const media = useMemo<BookMedia | PodcastMedia>(() => libraryItem.media, [libraryItem.media])
  const originalMetadata = useMemo<BookMetadata | PodcastMetadata>(() => media.metadata, [media.metadata])

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

  // Memoize aspect ratio calculation based on configuration
  const coverAspect = useMemo(() => getCoverAspectRatio(bookCoverAspectRatio ?? 1), [bookCoverAspectRatio])

  // Memoize cover dimensions based on effective size multiplier (capped on mobile)
  const coverHeight = useMemo(() => 192 * effectiveSizeMultiplier, [effectiveSizeMultiplier])
  const coverWidth = useMemo(() => coverHeight / coverAspect, [coverHeight, coverAspect])

  const title = originalMetadata.title || ''
  const isExplicit = originalMetadata.explicit

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL
  const isAuthorBookshelfView = bookshelfView === BookshelfView.AUTHOR

  const rssFeed = libraryItem.rssFeed ?? null
  const mediaItemShare = libraryItem.mediaItemShare ?? null

  const isMissing = libraryItem.isMissing
  const isInvalid = libraryItem.isInvalid

  const {
    percent: userProgressPercent,
    isFinished: itemIsFinished,
    lastUpdated,
    startedAt,
    finishedAt
  } = useMemo(() => computeProgress({ progress: mediaProgress, seriesProgressPercent, useSeriesProgress: false }), [mediaProgress, seriesProgressPercent])

  const playIconFontSize = useMemo(() => Math.max(2, 3 * effectiveSizeMultiplier), [effectiveSizeMultiplier])

  const author = useMemo(() => metadata.authorName, [metadata.authorName])

  const displayTitle = useMemo(() => {
    if (episode) return episode.title
    const ignorePrefix = orderBy === 'media.metadata.title' && sortingIgnorePrefix

    if (ignorePrefix && metadata.titleIgnorePrefix) {
      return metadata.titleIgnorePrefix
    }
    return title || '\u00A0'
  }, [episode, orderBy, metadata.titleIgnorePrefix, sortingIgnorePrefix, title])

  const displaySubtitle = useMemo(() => {
    if (!libraryItem) return '\u00A0'
    if (metadata.subtitle) return metadata.subtitle
    if (metadata.seriesName) return metadata.seriesName
    return ''
  }, [libraryItem, metadata.subtitle, metadata.seriesName])

  const displayLineTwo = useMemo(() => {
    if (episode) return title
    if (isPodcast) return author || ''
    if (isAuthorBookshelfView && metadata.publishedYear) {
      return metadata.publishedYear
    }
    if (orderBy === 'media.metadata.authorNameLF' && metadata.authorNameLF) {
      return metadata.authorNameLF
    }
    return author || ''
  }, [author, episode, isAuthorBookshelfView, isPodcast, orderBy, metadata.publishedYear, metadata.authorNameLF, title])

  const titleCleaned = useMemo(() => {
    if (!title) return ''
    if (title.length > 60) {
      return `${title.slice(0, 57)}...`
    }
    return title
  }, [title])

  const authorCleaned = useMemo(() => {
    if (!author) return ''
    if (author.length > 30) {
      return `${author.slice(0, 27)}...`
    }
    return author
  }, [author])

  const showError = useMemo(() => !isPodcast && (isMissing || isInvalid), [isPodcast, isMissing, isInvalid])

  const errorText = useMemo(() => {
    if (isMissing) return t('ErrorItemDirectoryMissing')
    if (isInvalid) {
      if (isPodcast) return t('ErrorPodcastHasNoEpisodes')
      return t('ErrorItemNoAudioTracksOrEbook')
    }
    return t('ErrorUnknown')
  }, [isMissing, isInvalid, isPodcast, t])

  const isStreamingFromDifferentLib = useMemo(
    () => isStreamingFromDifferentLibrary(libraryItem.libraryId),
    [isStreamingFromDifferentLibrary, libraryItem.libraryId]
  )

  const isQueued = useMemo(() => {
    const episodeId = episode ? episode.id : null
    return getIsMediaQueued(libraryItem.id, episodeId)
  }, [getIsMediaQueued, libraryItem.id, episode])

  const numTracks = useMemo(() => {
    if (isBookMedia(media)) {
      if (media.tracks) return media.tracks.length
      return media.numTracks || 0
    }
    return 0
  }, [media])

  const showPlayButton =
    !isSelectionMode &&
    !isMissing &&
    !isInvalid &&
    !isStreaming(libraryItem.id, episode?.id ?? null) &&
    (numTracks > 0 || !!episode || !!libraryItem.recentEpisode)

  const showReadButton = !isSelectionMode && !showPlayButton && isBookMedia(media) && !!media.ebookFormat

  const { processing, isPending, confirmState, closeConfirm, handlePlay, handleReadEBook, handleMoreAction, moreMenuItems } = useMediaCardActions({
    libraryItem,
    media,
    title,
    author: author || null,
    episodeForQueue: episode || null,
    mediaProgress,
    itemIsFinished,
    userProgressPercent,
    isPodcast,
    userPermissions,
    ereaderDevices,
    continueListeningShelf,
    libraryItemIdStreaming,
    isStreaming,
    isStreamingFromDifferentLib,
    isQueued
  })

  const handleCardClick = useCallback(() => {
    router.push(`/item/${libraryItem.id}`)
  }, [libraryItem.id, router])

  const handleEdit = useCallback(() => {
    // TODO: wire up edit modal when available
    console.log('handleEdit', libraryItem.id)
  }, [libraryItem.id])

  return (
    <>
      <MediaCardFrame
        width={coverWidth}
        height={coverHeight}
        onClick={!processing ? handleCardClick : undefined}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
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
            coverWidth={coverWidth}
            coverAspect={coverAspect}
            placeholderUrl={placeholderUrl}
            hasCover={hasCover}
            title={title}
            titleCleaned={titleCleaned}
            authorCleaned={authorCleaned}
            isPodcast={isPodcast}
            userProgressPercent={userProgressPercent}
            itemIsFinished={itemIsFinished}
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
            userCanUpdate={userPermissions.update}
            playIconFontSize={playIconFontSize}
            moreMenuItems={moreMenuItems}
            rssFeed={rssFeed}
            mediaItemShare={mediaItemShare}
            showError={showError}
            errorText={errorText}
            isAuthorBookshelfView={isAuthorBookshelfView}
            renderOverlayBadges={renderOverlayBadges}
            renderBadges={renderBadges}
            renderSeriesNameOverlay={renderSeriesNameOverlay}
            onPlay={handlePlay}
            onRead={handleReadEBook}
            onEdit={handleEdit}
            onMoreAction={handleMoreAction}
            onMoreMenuOpenChange={handleMoreMenuOpenChange}
            onSelect={onSelect}
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
