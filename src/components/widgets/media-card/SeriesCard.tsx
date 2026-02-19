'use client'

import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaCardOverlayContainer from '@/components/widgets/media-card/MediaCardOverlayContainer'
import MediaCardStandardFooter from '@/components/widgets/media-card/MediaCardStandardFooter'
import MediaOverlayIconBtn from '@/components/widgets/media-card/MediaOverlayIconBtn'
import SeriesGroupCover from '@/components/widgets/media-card/SeriesGroupCover'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getCoverAspectRatio } from '@/lib/coverUtils'
import { formatJsDate } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { elapsedPretty } from '@/lib/timeUtils'
import type { MediaProgress, Series } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useRouter } from 'next/navigation'
import { memo, useId, useMemo, useState } from 'react'

export interface SeriesCardProps {
  /** The series to display */
  series: Series
  /** Library ID for navigation */
  libraryId: string
  /** View mode (standard or detail) */
  bookshelfView: BookshelfView
  /** Field being sorted by */
  orderBy?: string
  /** Whether to use title without prefix when sorting */
  sortingIgnorePrefix?: boolean
  /** Cover configuration */
  bookCoverAspectRatio?: 0 | 1
  sizeMultiplier?: number
  /** Date format from server settings */
  dateFormat: string
  /** Locale for formatting */
  locale?: string
  /**
   * Map of book progress by library item ID
   * Used to calculate series progress
   */
  bookProgressMap?: Map<string, MediaProgress>
  /** Whether the card is in selection mode */
  isSelectionMode?: boolean
  /** Whether the card is currently selected */
  selected?: boolean
  /** Callback when the select button is clicked */
  onSelect?: (event: React.MouseEvent) => void
  /** Whether to show the selection button */
  showSelectedButton?: boolean
}

function SeriesCard(props: SeriesCardProps) {
  const {
    series,
    libraryId,
    bookshelfView,
    orderBy,
    sortingIgnorePrefix = false,
    bookCoverAspectRatio,
    sizeMultiplier,
    dateFormat,
    locale = 'en-us',
    bookProgressMap,
    isSelectionMode = false,
    selected = false,
    onSelect,
    showSelectedButton = false
  } = props

  const router = useRouter()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const cardId = useId()
  const t = useTypeSafeTranslations()

  const [isHovering, setIsHovering] = useState(false)

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  // Cover dimensions - series card is wider (2x width of a single book cover)
  const coverAspect = getCoverAspectRatio(bookCoverAspectRatio ?? 1)
  const coverHeight = 192 * effectiveSizeMultiplier
  // Series card is wider (2x width of a single book cover)
  const coverWidth = (coverHeight / coverAspect) * 2

  // Label font size based on width
  const labelFontSize = coverWidth < 160 ? 0.75 : 0.9

  // Display title with optional ignore prefix handling
  const displayTitle = sortingIgnorePrefix && series.nameIgnorePrefix ? series.nameIgnorePrefix : series.name || '\u00A0'

  // Calculate series progress from book progress
  const { seriesProgressPercent, isSeriesFinished } = useMemo(() => {
    const books = series.books || []
    if (!books.length || !bookProgressMap) {
      return { seriesProgressPercent: 0, isSeriesFinished: false }
    }

    let progressPercent = 0
    let finishedCount = 0

    books.forEach((book) => {
      const progress = bookProgressMap.get(book.id)
      if (progress) {
        if (progress.isFinished) {
          progressPercent += 1
          finishedCount++
        } else if (progress.progress) {
          progressPercent += progress.progress
        }
      }
    })

    progressPercent /= books.length
    progressPercent = Math.min(1, Math.max(0, progressPercent))

    return {
      seriesProgressPercent: progressPercent,
      isSeriesFinished: finishedCount === books.length
    }
  }, [series.books, bookProgressMap])

  // Check if any books have valid covers
  const hasValidCovers = useMemo(() => {
    const books = series.books || []
    return books.some((book) => book.media?.coverPath)
  }, [series.books])

  // For JSX usage
  const books = series.books || []

  // Sort line for detail view
  const displaySortLine = useMemo(() => {
    const seriesBooks = series.books || []
    if (!orderBy) return null

    switch (orderBy) {
      case 'addedAt': {
        if (!series.addedAt) return null
        return t('LabelAddedDate', { 0: formatJsDate(new Date(series.addedAt), dateFormat) })
      }
      case 'totalDuration': {
        const totalDuration = seriesBooks.reduce((acc: number, book) => {
          const duration = (book.media as { duration?: number })?.duration || 0
          return acc + duration
        }, 0)
        return `${t('LabelDuration')} ${elapsedPretty(totalDuration, locale, true)}`
      }
      case 'lastBookUpdated': {
        const lastUpdated = Math.max(...seriesBooks.map((book) => book.updatedAt || 0), 0)
        if (!lastUpdated) return null
        return `${t('LabelLastBookUpdated')} ${formatJsDate(new Date(lastUpdated), dateFormat)}`
      }
      case 'lastBookAdded': {
        const lastAdded = Math.max(...seriesBooks.map((book) => book.addedAt || 0), 0)
        if (!lastAdded) return null
        return `${t('LabelLastBookAdded')} ${formatJsDate(new Date(lastAdded), dateFormat)}`
      }
      default:
        return null
    }
  }, [orderBy, series.addedAt, series.books, dateFormat, locale, t])

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL

  const handleCardClick = () => {
    router.push(`/library/${libraryId}/series/${series.id}`)
  }

  const handleSelectClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect?.(event)
  }

  return (
    <MediaCardFrame
      width={coverWidth}
      height={coverHeight}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      cardId={cardId}
      cy-id="seriesCard"
      cover={<SeriesGroupCover name={series.name || ''} books={books} width={coverWidth} height={coverHeight} bookCoverAspectRatio={coverAspect} />}
      overlay={
        <>
          {/* Books count badge */}
          <div
            cy-id="seriesLengthMarker"
            className="absolute rounded-lg shadow-modal-content z-20"
            style={{
              top: '0.375em',
              right: '0.375em',
              padding: '0.1em 0.25em',
              backgroundColor: '#cd9d49dd'
            }}
          >
            <p style={{ fontSize: '0.8em' }} role="status" aria-label={t('LabelNumberOfBooks')}>
              {books.length}
            </p>
          </div>

          {/* Progress bar */}
          {seriesProgressPercent > 0 && (
            <div
              cy-id="seriesProgressBar"
              className={mergeClasses(
                'absolute bottom-0 start-0 h-1 max-w-full z-10 rounded-b box-shadow-progressbar',
                isSeriesFinished ? 'bg-success' : 'bg-yellow-400'
              )}
              style={{ width: `${seriesProgressPercent * 100}%` }}
            />
          )}

          {/* Hover/Selection overlay with display title */}
          <MediaCardOverlayContainer
            isSelectionMode={isSelectionMode}
            selected={selected}
            cyId="hoveringDisplayTitle"
            className={mergeClasses(
              'bg-black/60 flex items-center justify-center text-center transition-opacity z-20',
              isHovering || isSelectionMode ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div style={{ padding: '1em' }}>{hasValidCovers && isHovering && <p style={{ fontSize: '1.2em' }}>{displayTitle}</p>}</div>

            {/* Selection button */}
            {showSelectedButton && (isSelectionMode || isHovering) && (
              <MediaOverlayIconBtn
                cyId="selectButton"
                position="top-start"
                icon={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                onClick={handleSelectClick}
                ariaLabel={selected ? t('ButtonDeselect') : t('ButtonSelect')}
                selected={selected}
              />
            )}
          </MediaCardOverlayContainer>

          {/* RSS feed indicator */}
          {series.rssFeed && !isSelectionMode && !isHovering && (
            <div
              cy-id="rssFeed"
              className={mergeClasses('absolute top-[0.375em] start-[0.375em] z-10', 'bg-black/40 rounded-full flex items-center justify-center shadow-sm')}
              style={{ width: '1.5em', height: '1.5em' }}
            >
              <span className="material-symbols text-orange-500" aria-hidden="true" style={{ fontSize: '1em' }}>
                rss_feed
              </span>
            </div>
          )}
        </>
      }
      footer={
        isAlternativeBookshelfView ? (
          // Detail view footer
          <div cy-id="detailBottomText" className="relative z-30 start-0 end-0 mx-auto py-[0.25em] rounded-md text-center">
            <p cy-id="detailBottomDisplayTitle" className="truncate" style={{ fontSize: `${labelFontSize}em` }}>
              {displayTitle}
            </p>
            {displaySortLine && (
              <p cy-id="detailBottomSortLine" className="truncate text-gray-400" style={{ fontSize: '0.8em' }}>
                {displaySortLine}
              </p>
            )}
          </div>
        ) : (
          // Standard view footer (shiny black placard)
          <MediaCardStandardFooter displayTitle={displayTitle} fontSize={labelFontSize} width="12em" />
        )
      }
    />
  )
}

/**
 * Memoized SeriesCard component to prevent unnecessary re-renders.
 */
const MemoizedSeriesCard = memo(SeriesCard)

export { MemoizedSeriesCard as SeriesCard }

export default MemoizedSeriesCard
