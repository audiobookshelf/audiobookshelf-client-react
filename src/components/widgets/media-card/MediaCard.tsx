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
import type { BookMedia, EReaderDevice, LibraryItem, MediaProgress, PodcastEpisode, PodcastMedia, UserPermissions } from '@/types/api'
import { BookshelfView, isBookMedia, isBookMetadata, isPodcastLibraryItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { memo, useId, useMemo, useState, type ReactNode } from 'react'

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

  const coverAspect = getCoverAspectRatio(bookCoverAspectRatio ?? 1)
  const coverHeight = 192 * effectiveSizeMultiplier
  const coverWidth = coverHeight / coverAspect

  const title = originalMetadata.title || ''
  const isExplicit = originalMetadata.explicit

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL
  const isAuthorBookshelfView = bookshelfView === BookshelfView.AUTHOR

  const rssFeed = libraryItem.rssFeed ?? null
  const mediaItemShare = libraryItem.mediaItemShare ?? null

  const isMissing = libraryItem.isMissing
  const isInvalid = libraryItem.isInvalid

  // Keep useMemo for computeProgress since it's an actual computation
  const {
    percent: userProgressPercent,
    isFinished: itemIsFinished,
    lastUpdated,
    startedAt,
    finishedAt
  } = useMemo(() => computeProgress({ progress: mediaProgress, seriesProgressPercent, useSeriesProgress: false }), [mediaProgress, seriesProgressPercent])

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

  const numTracks = isBookMedia(media) ? (media.tracks ? media.tracks.length : media.numTracks || 0) : 0

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

  const handleCardClick = () => {
    router.push(`/library/${libraryItem.libraryId}/item/${libraryItem.id}`)
  }

  const handleEdit = () => {
    // TODO: wire up edit modal when available
    console.log('handleEdit', libraryItem.id)
  }

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
