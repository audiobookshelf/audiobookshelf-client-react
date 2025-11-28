'use client'

import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import MediaCardCover from '@/components/widgets/media-card/MediaCardCover'
import MediaCardDetailView from '@/components/widgets/media-card/MediaCardDetailView'
import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaCardOverlay from '@/components/widgets/media-card/MediaCardOverlay'
import { useMediaCardActions } from '@/components/widgets/media-card/useMediaCardActions'
import { useMediaContext } from '@/contexts/MediaContext'
import { getCoverAspectRatio, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { computeProgress } from '@/lib/mediaProgress'
import type { EReaderDevice, LibraryItem, MediaItemShare, MediaProgress, PodcastEpisode, RssFeed, UserPermissions } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useId, useMemo, useState, type ReactNode } from 'react'

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
    sizeMultiplier = 1,
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
  const cardId = useId()

  const [isHovering, setIsHovering] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const isPodcast = useMemo(() => libraryItem.mediaType === 'podcast', [libraryItem.mediaType])
  const media = libraryItem.media as LibraryItem['media']
  const rawMetadata = useMemo(() => media.metadata ?? {}, [media.metadata])

  const coverAspect = useMemo(() => getCoverAspectRatio(bookCoverAspectRatio ?? 1.6), [bookCoverAspectRatio])

  const coverHeight = useMemo(() => 192 * (sizeMultiplier || 1), [sizeMultiplier])
  const coverWidth = useMemo(() => {
    const explicitWidth = 0
    if (explicitWidth) return explicitWidth
    return coverHeight / coverAspect
  }, [coverHeight, coverAspect])

  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  const hasCover = useMemo(() => !!(media as { coverPath?: string }).coverPath, [media])

  const title = useMemo(() => (rawMetadata as { title?: string }).title || '', [rawMetadata])

  const isExplicit = useMemo(() => !!(rawMetadata as { explicit?: boolean }).explicit, [rawMetadata])

  const isAlternativeBookshelfView = useMemo(() => bookshelfView === BookshelfView.DETAIL, [bookshelfView])
  const isAuthorBookshelfView = false

  const rssFeed = useMemo<RssFeed | null>(() => (libraryItem as { rssFeed?: RssFeed }).rssFeed ?? null, [libraryItem])
  const mediaItemShare = useMemo<MediaItemShare | null>(() => (libraryItem as { mediaItemShare?: MediaItemShare }).mediaItemShare ?? null, [libraryItem])

  const isMissing = libraryItem.isMissing
  const isInvalid = libraryItem.isInvalid

  const {
    percent: userProgressPercent,
    isFinished: itemIsFinished,
    lastUpdated,
    startedAt,
    finishedAt
  } = useMemo(() => computeProgress({ progress: mediaProgress, seriesProgressPercent, useSeriesProgress: false }), [mediaProgress, seriesProgressPercent])

  const playIconFontSize = useMemo(() => Math.max(2, 3 * (sizeMultiplier || 1)), [sizeMultiplier])

  const author = useMemo(() => {
    const metadata = rawMetadata as { author?: string; authorName?: string }
    if (isPodcast) return metadata.author
    return metadata.authorName ?? metadata.author
  }, [isPodcast, rawMetadata])

  const displayTitle = useMemo(() => {
    if (episode) return episode.title
    const ignorePrefix = orderBy === 'media.metadata.title' && sortingIgnorePrefix

    const metadata = rawMetadata as { title?: string; titleIgnorePrefix?: string }
    if (ignorePrefix) return metadata.titleIgnorePrefix || '\u00A0'
    return title || '\u00A0'
  }, [episode, orderBy, rawMetadata, sortingIgnorePrefix, title])

  const displaySubtitle = useMemo(() => {
    if (!libraryItem) return '\u00A0'
    const metadata = rawMetadata as { subtitle?: string; seriesName?: string }
    if (metadata.subtitle) return metadata.subtitle
    if (metadata.seriesName) return metadata.seriesName
    return ''
  }, [libraryItem, rawMetadata])

  const displayLineTwo = useMemo(() => {
    if (episode) return title
    if (isPodcast) return author || ''
    if (isAuthorBookshelfView) {
      const publishedYear = (rawMetadata as { publishedYear?: string }).publishedYear
      return publishedYear || ''
    }
    if (orderBy === 'media.metadata.authorNameLF') {
      const metadata = rawMetadata as { authorNameLF?: string }
      return metadata.authorNameLF || ''
    }
    return author || ''
  }, [author, episode, isAuthorBookshelfView, isPodcast, orderBy, rawMetadata, title])

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
    if (isMissing) return 'Item directory is missing!'
    if (isInvalid) {
      if (isPodcast) return 'Podcast has no episodes'
      return 'Item has no audio tracks & ebook'
    }
    return 'Unknown Error'
  }, [isMissing, isInvalid, isPodcast])

  const isStreamingFromDifferentLib = useMemo(
    () => isStreamingFromDifferentLibrary(libraryItem.libraryId),
    [isStreamingFromDifferentLibrary, libraryItem.libraryId]
  )

  const isQueued = useMemo(() => {
    const episodeId = episode ? episode.id : null
    return getIsMediaQueued(libraryItem.id, episodeId)
  }, [getIsMediaQueued, libraryItem.id, episode])

  const numTracks = useMemo(() => {
    const m = media as { tracks?: unknown[]; numTracks?: number }
    if (m.tracks) return m.tracks.length
    return m.numTracks || 0
  }, [media])

  const showPlayButton =
    !isSelectionMode &&
    !isMissing &&
    !isInvalid &&
    !isStreaming(libraryItem.id, episode?.id ?? null) &&
    (numTracks > 0 || !!episode || !!libraryItem.recentEpisode)
  const showReadButton = !isSelectionMode && !showPlayButton && !!(media as { ebookFormat?: string }).ebookFormat

  const { processing, confirmState, setConfirmState, handlePlay, handleReadEBook, handleMoreAction, moreMenuItems } = useMediaCardActions({
    libraryItem,
    media,
    rawMetadata: rawMetadata as unknown as Record<string, unknown>,
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

  return (
    <>
      <MediaCardFrame
        width={coverWidth}
        height={coverHeight}
        onClick={!processing ? handleCardClick : undefined}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        cardId={cardId}
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
            isPending={false}
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
            onMoreAction={handleMoreAction}
            onMoreMenuOpenChange={setIsMoreMenuOpen}
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
          onClose={() => setConfirmState(null)}
          onConfirm={(value) => {
            confirmState.onConfirm(value)
            setConfirmState(null)
          }}
        />
      )}
    </>
  )
}

// Make LazyLibraryItemCardBase the default export
export default MediaCard
