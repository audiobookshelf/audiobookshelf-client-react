'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollapsedSeriesCard from '@/components/widgets/media-card/CollapsedSeriesCard'
import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { MediaProvider } from '@/contexts/MediaContext'
import { BookLibraryItem, BookshelfView, EReaderDevice, MediaProgress, PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import { useEffect, useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface MediaCardExamplesProps {
  selectedBook?: BookLibraryItem | null
  selectedPodcast?: PodcastLibraryItem | null
}

interface Dimensions {
  width: number
  height: number
}

function DimensionComparison({ cardDimensions, skeletonDimensions }: { cardDimensions: Dimensions | null; skeletonDimensions: Dimensions | null }) {
  if (!cardDimensions || !skeletonDimensions) {
    return <p className="text-xs text-gray-500 mt-2">Measuring dimensions...</p>
  }

  const widthMatch = Math.abs(cardDimensions.width - skeletonDimensions.width) < 1
  const heightMatch = Math.abs(cardDimensions.height - skeletonDimensions.height) < 1
  const allMatch = widthMatch && heightMatch

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs">
      <p className="font-bold mb-2 text-white">Dimension Check:</p>
      <div className="space-y-1">
        <p className={widthMatch ? 'text-green-400' : 'text-red-400'}>
          Width: Card {cardDimensions.width.toFixed(2)}px | Skeleton {skeletonDimensions.width.toFixed(2)}px {widthMatch ? '✓' : '✗'}
        </p>
        <p className={heightMatch ? 'text-green-400' : 'text-red-400'}>
          Height: Card {cardDimensions.height.toFixed(2)}px | Skeleton {skeletonDimensions.height.toFixed(2)}px {heightMatch ? '✓' : '✗'}
        </p>
        <p className={`font-bold ${allMatch ? 'text-green-400' : 'text-red-400'}`}>{allMatch ? '✓ Dimensions match!' : '✗ Dimensions do not match'}</p>
      </div>
    </div>
  )
}

export function MediaCardExamples({ selectedBook, selectedPodcast }: MediaCardExamplesProps) {
  const { user, bookCoverAspectRatio } = useComponentsCatalog()

  // Selection state for examples
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null)
  const [isBookSelectionMode, setIsBookSelectionMode] = useState(false)
  const [isPodcastSelectionMode, setIsPodcastSelectionMode] = useState(false)

  // Default props for media cards
  const sizeMultiplier = 1
  const defaultProps = {
    bookshelfView: BookshelfView.STANDARD,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    userPermissions: user.permissions,
    ereaderDevices: [] as EReaderDevice[],
    showSubtitles: true,
    sizeMultiplier,
    bookCoverAspectRatio: bookCoverAspectRatio ?? 1.6
  }

  // Selection handlers
  const handleBookSelect = () => {
    if (selectedBook) {
      const isCurrentlySelected = selectedBookId === selectedBook.id
      setSelectedBookId(isCurrentlySelected ? null : selectedBook.id)
      setIsBookSelectionMode(!isCurrentlySelected)
    }
  }

  const handlePodcastSelect = () => {
    if (selectedPodcast) {
      const isCurrentlySelected = selectedPodcastId === selectedPodcast.id
      setSelectedPodcastId(isCurrentlySelected ? null : selectedPodcast.id)
      setIsPodcastSelectionMode(!isCurrentlySelected)
    }
  }

  // Refs for dimension checking
  const bookStandardCardRef = useRef<HTMLDivElement>(null)
  const bookStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const bookDetailCardRef = useRef<HTMLDivElement>(null)
  const bookDetailSkeletonRef = useRef<HTMLDivElement>(null)
  const bookDetailNoSubCardRef = useRef<HTMLDivElement>(null)
  const bookDetailNoSubSkeletonRef = useRef<HTMLDivElement>(null)
  const bookDetailOrderByCardRef = useRef<HTMLDivElement>(null)
  const bookDetailOrderBySkeletonRef = useRef<HTMLDivElement>(null)
  const bookAuthorBookshelfViewCardRef = useRef<HTMLDivElement>(null)
  const bookCollapsedSeriesCardRef = useRef<HTMLDivElement>(null)
  const bookCollapsedSeriesSkeletonRef = useRef<HTMLDivElement>(null)
  const bookCollapsedSeriesBooksCountCardRef = useRef<HTMLDivElement>(null)
  const bookCollapsedSeriesBooksCountSkeletonRef = useRef<HTMLDivElement>(null)
  const bookRssFeedCardRef = useRef<HTMLDivElement>(null)
  const bookEbookCardRef = useRef<HTMLDivElement>(null)
  const bookEbookSkeletonRef = useRef<HTMLDivElement>(null)
  const bookMissingCardRef = useRef<HTMLDivElement>(null)
  const bookNoCoverCardRef = useRef<HTMLDivElement>(null)
  const podcastStandardCardRef = useRef<HTMLDivElement>(null)
  const podcastStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastDetailCardRef = useRef<HTMLDivElement>(null)
  const podcastDetailSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastDetailNoSubCardRef = useRef<HTMLDivElement>(null)
  const podcastDetailNoSubSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastDetailOrderByCardRef = useRef<HTMLDivElement>(null)
  const podcastDetailOrderBySkeletonRef = useRef<HTMLDivElement>(null)
  const podcastRecentEpisodeCardRef = useRef<HTMLDivElement>(null)
  const podcastRecentEpisodeSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastRssFeedCardRef = useRef<HTMLDivElement>(null)
  const podcastRssFeedSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastNumEpisodesCardRef = useRef<HTMLDivElement>(null)
  const podcastNumEpisodesSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastNumEpisodesIncompleteCardRef = useRef<HTMLDivElement>(null)
  const podcastNumEpisodesIncompleteSkeletonRef = useRef<HTMLDivElement>(null)

  // State for dimensions
  const [bookStandardCardDims, setBookStandardCardDims] = useState<Dimensions | null>(null)
  const [bookStandardSkeletonDims, setBookStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [bookDetailCardDims, setBookDetailCardDims] = useState<Dimensions | null>(null)
  const [bookDetailSkeletonDims, setBookDetailSkeletonDims] = useState<Dimensions | null>(null)
  const [bookDetailNoSubCardDims, setBookDetailNoSubCardDims] = useState<Dimensions | null>(null)
  const [bookDetailNoSubSkeletonDims, setBookDetailNoSubSkeletonDims] = useState<Dimensions | null>(null)
  const [bookDetailOrderByCardDims, setBookDetailOrderByCardDims] = useState<Dimensions | null>(null)
  const [bookDetailOrderBySkeletonDims, setBookDetailOrderBySkeletonDims] = useState<Dimensions | null>(null)
  const [bookCollapsedSeriesCardDims, setBookCollapsedSeriesCardDims] = useState<Dimensions | null>(null)
  const [bookCollapsedSeriesSkeletonDims, setBookCollapsedSeriesSkeletonDims] = useState<Dimensions | null>(null)
  const [bookCollapsedSeriesBooksCountCardDims, setBookCollapsedSeriesBooksCountCardDims] = useState<Dimensions | null>(null)
  const [bookCollapsedSeriesBooksCountSkeletonDims, setBookCollapsedSeriesBooksCountSkeletonDims] = useState<Dimensions | null>(null)
  const [bookEbookCardDims, setBookEbookCardDims] = useState<Dimensions | null>(null)
  const [bookEbookSkeletonDims, setBookEbookSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastStandardCardDims, setPodcastStandardCardDims] = useState<Dimensions | null>(null)
  const [podcastStandardSkeletonDims, setPodcastStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastDetailCardDims, setPodcastDetailCardDims] = useState<Dimensions | null>(null)
  const [podcastDetailSkeletonDims, setPodcastDetailSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastDetailNoSubCardDims, setPodcastDetailNoSubCardDims] = useState<Dimensions | null>(null)
  const [podcastDetailNoSubSkeletonDims, setPodcastDetailNoSubSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastDetailOrderByCardDims, setPodcastDetailOrderByCardDims] = useState<Dimensions | null>(null)
  const [podcastDetailOrderBySkeletonDims, setPodcastDetailOrderBySkeletonDims] = useState<Dimensions | null>(null)
  const [podcastRecentEpisodeCardDims, setPodcastRecentEpisodeCardDims] = useState<Dimensions | null>(null)
  const [podcastRecentEpisodeSkeletonDims, setPodcastRecentEpisodeSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastRssFeedCardDims, setPodcastRssFeedCardDims] = useState<Dimensions | null>(null)
  const [podcastRssFeedSkeletonDims, setPodcastRssFeedSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastNumEpisodesCardDims, setPodcastNumEpisodesCardDims] = useState<Dimensions | null>(null)
  const [podcastNumEpisodesSkeletonDims, setPodcastNumEpisodesSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastNumEpisodesIncompleteCardDims, setPodcastNumEpisodesIncompleteCardDims] = useState<Dimensions | null>(null)
  const [podcastNumEpisodesIncompleteSkeletonDims, setPodcastNumEpisodesIncompleteSkeletonDims] = useState<Dimensions | null>(null)

  // Measure dimensions
  useEffect(() => {
    const measureElement = (ref: React.RefObject<HTMLDivElement | null>, setter: (dims: Dimensions) => void) => {
      if (!ref.current) return

      // Initial measurement
      const rect = ref.current.getBoundingClientRect()
      setter({ width: rect.width, height: rect.height })

      // Continue observing for changes
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          setter({ width, height })
        }
      })

      resizeObserver.observe(ref.current)
      return () => resizeObserver.disconnect()
    }

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      const observers = [
        measureElement(bookStandardCardRef, setBookStandardCardDims),
        measureElement(bookStandardSkeletonRef, setBookStandardSkeletonDims),
        measureElement(bookDetailCardRef, setBookDetailCardDims),
        measureElement(bookDetailSkeletonRef, setBookDetailSkeletonDims),
        measureElement(bookDetailNoSubCardRef, setBookDetailNoSubCardDims),
        measureElement(bookDetailNoSubSkeletonRef, setBookDetailNoSubSkeletonDims),
        measureElement(bookDetailOrderByCardRef, setBookDetailOrderByCardDims),
        measureElement(bookDetailOrderBySkeletonRef, setBookDetailOrderBySkeletonDims),
        measureElement(bookCollapsedSeriesCardRef, setBookCollapsedSeriesCardDims),
        measureElement(bookCollapsedSeriesSkeletonRef, setBookCollapsedSeriesSkeletonDims),
        measureElement(bookCollapsedSeriesBooksCountCardRef, setBookCollapsedSeriesBooksCountCardDims),
        measureElement(bookCollapsedSeriesBooksCountSkeletonRef, setBookCollapsedSeriesBooksCountSkeletonDims),
        measureElement(bookEbookCardRef, setBookEbookCardDims),
        measureElement(bookEbookSkeletonRef, setBookEbookSkeletonDims),
        measureElement(podcastStandardCardRef, setPodcastStandardCardDims),
        measureElement(podcastStandardSkeletonRef, setPodcastStandardSkeletonDims),
        measureElement(podcastDetailCardRef, setPodcastDetailCardDims),
        measureElement(podcastDetailSkeletonRef, setPodcastDetailSkeletonDims),
        measureElement(podcastDetailNoSubCardRef, setPodcastDetailNoSubCardDims),
        measureElement(podcastDetailNoSubSkeletonRef, setPodcastDetailNoSubSkeletonDims),
        measureElement(podcastDetailOrderByCardRef, setPodcastDetailOrderByCardDims),
        measureElement(podcastDetailOrderBySkeletonRef, setPodcastDetailOrderBySkeletonDims),
        measureElement(podcastRecentEpisodeCardRef, setPodcastRecentEpisodeCardDims),
        measureElement(podcastRecentEpisodeSkeletonRef, setPodcastRecentEpisodeSkeletonDims),
        measureElement(podcastRssFeedCardRef, setPodcastRssFeedCardDims),
        measureElement(podcastRssFeedSkeletonRef, setPodcastRssFeedSkeletonDims),
        measureElement(podcastNumEpisodesCardRef, setPodcastNumEpisodesCardDims),
        measureElement(podcastNumEpisodesSkeletonRef, setPodcastNumEpisodesSkeletonDims),
        measureElement(podcastNumEpisodesIncompleteCardRef, setPodcastNumEpisodesIncompleteCardDims),
        measureElement(podcastNumEpisodesIncompleteSkeletonRef, setPodcastNumEpisodesIncompleteSkeletonDims)
      ]

      return () => {
        observers.forEach((cleanup) => cleanup?.())
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [selectedBook, selectedPodcast])

  return (
    <MediaProvider>
      <ComponentExamples title="Media Cards">
        <ComponentInfo
          component="BookMediaCard / PodcastMediaCard / PodcastEpisodeCard / CollapsedSeriesCard / MediaCardSkeleton"
          description="Media card components for displaying library items in the bookshelf. BookMediaCard displays books with book-specific badges (series sequence, ebook format). PodcastMediaCard displays podcasts with podcast-specific badges. PodcastEpisodeCard displays a specific podcast episode. CollapsedSeriesCard displays collapsed series items with series count badges. MediaCardSkeleton provides a loading state."
        >
          <p className="mb-2">
            <span className="font-bold">Import:</span> <Code overflow>import BookMediaCard from &apos;@/components/widgets/media-card/BookMediaCard&apos;</Code>
            <br />
            <Code overflow>import PodcastMediaCard from &apos;@/components/widgets/media-card/PodcastMediaCard&apos;</Code>
            <br />
            <Code overflow>import PodcastEpisodeCard from &apos;@/components/widgets/media-card/PodcastEpisodeCard&apos;</Code>
            <br />
            <Code overflow>import CollapsedSeriesCard from &apos;@/components/widgets/media-card/CollapsedSeriesCard&apos;</Code>
            <br />
            <Code overflow>import MediaCardSkeleton from &apos;@/components/widgets/media-card/MediaCardSkeleton&apos;</Code>
          </p>
          <div>
            <span className="font-bold">Props:</span>
            <ul className="list-disc list-inside">
              <li>
                <Code>libraryItem</Code>: The library item to display (BookLibraryItem or PodcastLibraryItem).
              </li>
              <li>
                <Code>bookshelfView</Code>: View mode (BookshelfView.STANDARD, BookshelfView.DETAIL, or BookshelfView.AUTHOR).
              </li>
              <li>
                <Code>bookCoverAspectRatio</Code>: Aspect ratio for book covers.
              </li>
              <li>
                <Code>dateFormat</Code>: Date format string.
              </li>
              <li>
                <Code>timeFormat</Code>: Time format string.
              </li>
              <li>
                <Code>userPermissions</Code>: User permissions object.
              </li>
              <li>
                <Code>ereaderDevices</Code>: Array of e-reader devices.
              </li>
              <li>
                <Code>showSubtitles</Code>: Whether to show subtitles.
              </li>
              <li>
                <Code>sizeMultiplier</Code>: Size multiplier for the card.
              </li>
            </ul>
          </div>
        </ComponentInfo>

        {selectedBook ? (
          <>
            <h3 className="text-lg font-bold mb-4">Book Media Card: {selectedBook.media.metadata.title}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Standard View`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookStandardCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={selectedBook}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={bookStandardSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={defaultProps.bookshelfView}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        showSubtitles={defaultProps.showSubtitles}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={bookStandardCardDims} skeletonDimensions={bookStandardSkeletonDims} />
              </Example>

              <Example title={`Detail View`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookDetailCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={selectedBook}
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={bookDetailSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        showSubtitles={defaultProps.showSubtitles}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={bookDetailCardDims} skeletonDimensions={bookDetailSkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Detail View Without Subtitles`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookDetailNoSubCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={selectedBook}
                        bookshelfView={BookshelfView.DETAIL}
                        showSubtitles={false}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={bookDetailNoSubSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        showSubtitles={false}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={bookDetailNoSubCardDims} skeletonDimensions={bookDetailNoSubSkeletonDims} />
              </Example>

              <Example title={`Ebook`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookEbookCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedBook,
                            media: {
                              ...selectedBook.media,
                              ebookFormat: 'EPUB',
                              tracks: [],
                              numTracks: 0,
                              audioFiles: [],
                              numAudioFiles: 0
                            }
                          } as BookLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={bookEbookSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        showSubtitles={defaultProps.showSubtitles}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={bookEbookCardDims} skeletonDimensions={bookEbookSkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Collapsed Series`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookCollapsedSeriesCardRef}>
                      <CollapsedSeriesCard
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                        showSubtitles={defaultProps.showSubtitles}
                        libraryItem={
                          {
                            ...selectedBook,
                            collapsedSeries: {
                              id: 'series-123',
                              name: 'The Example Series',
                              nameIgnorePrefix: 'Example Series',
                              numBooks: 5,
                              seriesSequenceList: '1-3'
                            }
                          } as BookLibraryItem
                        }
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={bookCollapsedSeriesSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        showSubtitles={defaultProps.showSubtitles}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={bookCollapsedSeriesCardDims} skeletonDimensions={bookCollapsedSeriesSkeletonDims} />
              </Example>

              <Example title={`Collapsed Series (Books Count Only)`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookCollapsedSeriesBooksCountCardRef}>
                      <CollapsedSeriesCard
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                        showSubtitles={defaultProps.showSubtitles}
                        libraryItem={
                          {
                            ...selectedBook,
                            collapsedSeries: {
                              id: 'series-456',
                              name: 'The Example Series',
                              nameIgnorePrefix: 'Example Series',
                              numBooks: 5,
                              seriesSequenceList: undefined
                            }
                          } as BookLibraryItem
                        }
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={bookCollapsedSeriesBooksCountSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        showSubtitles={defaultProps.showSubtitles}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={bookCollapsedSeriesBooksCountCardDims} skeletonDimensions={bookCollapsedSeriesBooksCountSkeletonDims} />
              </Example>

              <Example title={`Detail View Ordered by AddedAt`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookDetailOrderByCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={selectedBook}
                        bookshelfView={BookshelfView.DETAIL}
                        orderBy="addedAt"
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={bookDetailOrderBySkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        showSubtitles={defaultProps.showSubtitles}
                        orderBy="addedAt"
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={bookDetailOrderByCardDims} skeletonDimensions={bookDetailOrderBySkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              <Example title={`Author Bookshelf View`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookAuthorBookshelfViewCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={selectedBook}
                        bookshelfView={BookshelfView.AUTHOR}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                </div>
              </Example>

              <Example title={`Missing`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookMissingCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedBook,
                            isMissing: true
                          } as BookLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                </div>
              </Example>

              <Example title={`No Cover (Placeholder)`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookNoCoverCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedBook,
                            media: {
                              ...selectedBook.media,
                              coverPath: undefined
                            }
                          } as BookLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                </div>
              </Example>

              <Example title={`Detail View with RSS Feed & Share`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={bookRssFeedCardRef}>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedBook,
                            rssFeed: {
                              id: 'rss-book-123',
                              slug: 'example-book-feed',
                              entityId: selectedBook.id,
                              entityType: 'book',
                              feedUrl: 'https://example.com/book-feed.xml',
                              metaTitle: selectedBook.media.metadata.title,
                              isPublic: true,
                              createdAt: Date.now(),
                              updatedAt: Date.now()
                            },
                            mediaItemShare: {
                              id: 'share-book-123',
                              mediaItemId: selectedBook.id,
                              mediaItemType: 'book',
                              userId: user.id,
                              slug: 'example-book-share',
                              createdAt: Date.now(),
                              updatedAt: Date.now()
                            }
                          } as BookLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                </div>
              </Example>

              <Example title={`Progress Bar - Partial Progress (50%)`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={selectedBook}
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        mediaProgress={
                          {
                            id: 'progress-123',
                            libraryItemId: selectedBook.id,
                            duration: 3600,
                            progress: 0.5,
                            currentTime: 1800,
                            isFinished: false,
                            ebookProgress: 0,
                            lastUpdate: Date.now(),
                            startedAt: Date.now() - 86400000
                          } as MediaProgress
                        }
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                </div>
              </Example>

              <Example title={`Progress Bar - Finished (100%)`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={selectedBook}
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        mediaProgress={
                          {
                            id: 'progress-456',
                            libraryItemId: selectedBook.id,
                            duration: 3600,
                            progress: 1,
                            currentTime: 3600,
                            isFinished: true,
                            ebookProgress: 0,
                            lastUpdate: Date.now(),
                            startedAt: Date.now() - 172800000,
                            finishedAt: Date.now() - 86400000
                          } as MediaProgress
                        }
                        isSelectionMode={isBookSelectionMode}
                        selected={selectedBookId === selectedBook.id}
                        onSelect={handleBookSelect}
                      />
                    </div>
                  </div>
                </div>
              </Example>
            </div>

            <Example title={`Size Multipliers`}>
              <div className="flex gap-4 flex-wrap items-start">
                <div style={{ fontSize: `${2 / 3}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 2/3</p>
                  <BookMediaCard
                    {...defaultProps}
                    libraryItem={selectedBook}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={2 / 3}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isBookSelectionMode}
                    selected={selectedBookId === selectedBook.id}
                    onSelect={handleBookSelect}
                  />
                </div>
                <div style={{ fontSize: `${1}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 1</p>
                  <BookMediaCard
                    {...defaultProps}
                    libraryItem={selectedBook}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={1}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isBookSelectionMode}
                    selected={selectedBookId === selectedBook.id}
                    onSelect={handleBookSelect}
                  />
                </div>
                <div className="hidden sm:block" style={{ fontSize: `${4 / 3}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 4/3</p>
                  <BookMediaCard
                    {...defaultProps}
                    libraryItem={selectedBook}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={4 / 3}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isBookSelectionMode}
                    selected={selectedBookId === selectedBook.id}
                    onSelect={handleBookSelect}
                  />
                </div>
                <div className="hidden lg:block" style={{ fontSize: `${11 / 6}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 11/6</p>
                  <BookMediaCard
                    {...defaultProps}
                    libraryItem={selectedBook}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={11 / 6}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isBookSelectionMode}
                    selected={selectedBookId === selectedBook.id}
                    onSelect={handleBookSelect}
                  />
                </div>
              </div>
            </Example>
          </>
        ) : null}

        {selectedPodcast ? (
          <>
            <h3 className="text-lg font-bold mb-4">Podcast Media Card: {selectedPodcast.media.metadata.title}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Standard View`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastStandardCardRef}>
                      <PodcastMediaCard
                        {...defaultProps}
                        libraryItem={selectedPodcast}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastStandardSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={defaultProps.bookshelfView}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastStandardCardDims} skeletonDimensions={podcastStandardSkeletonDims} />
              </Example>

              <Example title={`Detail View`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastDetailCardRef}>
                      <PodcastMediaCard
                        {...defaultProps}
                        libraryItem={selectedPodcast}
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastDetailSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastDetailCardDims} skeletonDimensions={podcastDetailSkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Detail View Without Subtitles`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastDetailNoSubCardRef}>
                      <PodcastMediaCard
                        {...defaultProps}
                        libraryItem={selectedPodcast}
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastDetailNoSubSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastDetailNoSubCardDims} skeletonDimensions={podcastDetailNoSubSkeletonDims} />
              </Example>

              <Example title={`Detail View Ordered by AddedAt`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastDetailOrderByCardRef}>
                      <PodcastMediaCard
                        {...defaultProps}
                        libraryItem={selectedPodcast}
                        bookshelfView={BookshelfView.DETAIL}
                        orderBy="addedAt"
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastDetailOrderBySkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        orderBy="addedAt"
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastDetailOrderByCardDims} skeletonDimensions={podcastDetailOrderBySkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Recent Episode`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastRecentEpisodeCardRef}>
                      <PodcastEpisodeCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedPodcast,
                            recentEpisode: {
                              libraryItemId: selectedPodcast.id,
                              podcastId: selectedPodcast.id,
                              id: 'episode-123',
                              episode: '#42',
                              title: 'Recent Episode Title',
                              subtitle: 'Episode Subtitle',
                              description: 'This is a recent episode',
                              chapters: [],
                              addedAt: Date.now(),
                              updatedAt: Date.now()
                            } as PodcastEpisode
                          } as PodcastLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastRecentEpisodeSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastRecentEpisodeCardDims} skeletonDimensions={podcastRecentEpisodeSkeletonDims} />
              </Example>

              <Example title={`Detail View with RSS Feed & Share`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastRssFeedCardRef}>
                      <PodcastMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedPodcast,
                            rssFeed: {
                              id: 'rss-123',
                              slug: 'example-podcast-feed',
                              entityId: selectedPodcast.id,
                              entityType: 'podcast',
                              feedUrl: 'https://example.com/feed.xml',
                              metaTitle: selectedPodcast.media.metadata.title,
                              isPublic: true,
                              createdAt: Date.now(),
                              updatedAt: Date.now()
                            },
                            mediaItemShare: {
                              id: 'share-123',
                              mediaItemId: selectedPodcast.id,
                              mediaItemType: 'book',
                              userId: user.id,
                              slug: 'example-podcast-share',
                              createdAt: Date.now(),
                              updatedAt: Date.now()
                            }
                          } as PodcastLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastRssFeedSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastRssFeedCardDims} skeletonDimensions={podcastRssFeedSkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`With numEpisodes`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastNumEpisodesCardRef}>
                      <PodcastMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedPodcast,
                            media: {
                              ...selectedPodcast.media,
                              numEpisodes: 42
                            }
                          } as PodcastLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastNumEpisodesSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastNumEpisodesCardDims} skeletonDimensions={podcastNumEpisodesSkeletonDims} />
              </Example>

              <Example title={`With numEpisodesIncomplete`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={podcastNumEpisodesIncompleteCardRef}>
                      <PodcastMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedPodcast,
                            numEpisodesIncomplete: 5
                          } as PodcastLibraryItem
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        isSelectionMode={isPodcastSelectionMode}
                        selected={selectedPodcastId === selectedPodcast.id}
                        onSelect={handlePodcastSelect}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={podcastNumEpisodesIncompleteSkeletonRef}>
                      <MediaCardSkeleton
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={defaultProps.bookCoverAspectRatio}
                        sizeMultiplier={defaultProps.sizeMultiplier}
                        dateFormat={defaultProps.dateFormat}
                        timeFormat={defaultProps.timeFormat}
                      />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={podcastNumEpisodesIncompleteCardDims} skeletonDimensions={podcastNumEpisodesIncompleteSkeletonDims} />
              </Example>
            </div>

            <Example title={`Size Multipliers`}>
              <div className="flex gap-4 flex-wrap items-start">
                <div style={{ fontSize: `${2 / 3}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 2/3</p>
                  <PodcastMediaCard
                    {...defaultProps}
                    libraryItem={selectedPodcast}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={2 / 3}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isPodcastSelectionMode}
                    selected={selectedPodcastId === selectedPodcast.id}
                    onSelect={handlePodcastSelect}
                  />
                </div>
                <div style={{ fontSize: `${1}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 1</p>
                  <PodcastMediaCard
                    {...defaultProps}
                    libraryItem={selectedPodcast}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={1}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isPodcastSelectionMode}
                    selected={selectedPodcastId === selectedPodcast.id}
                    onSelect={handlePodcastSelect}
                  />
                </div>
                <div className="hidden sm:block" style={{ fontSize: `${4 / 3}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 4/3</p>
                  <PodcastMediaCard
                    {...defaultProps}
                    libraryItem={selectedPodcast}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={4 / 3}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isPodcastSelectionMode}
                    selected={selectedPodcastId === selectedPodcast.id}
                    onSelect={handlePodcastSelect}
                  />
                </div>
                <div className="hidden lg:block" style={{ fontSize: `${11 / 6}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size Multiplier: 11/6</p>
                  <PodcastMediaCard
                    {...defaultProps}
                    libraryItem={selectedPodcast}
                    bookshelfView={BookshelfView.DETAIL}
                    sizeMultiplier={11 / 6}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    isSelectionMode={isPodcastSelectionMode}
                    selected={selectedPodcastId === selectedPodcast.id}
                    onSelect={handlePodcastSelect}
                  />
                </div>
              </div>
            </Example>
          </>
        ) : null}
      </ComponentExamples>
    </MediaProvider>
  )
}
