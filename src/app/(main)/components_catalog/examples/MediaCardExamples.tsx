'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollapsedSeriesCard from '@/components/widgets/media-card/CollapsedSeriesCard'
import CollectionCard from '@/components/widgets/media-card/CollectionCard'
import CollectionCardSkeleton from '@/components/widgets/media-card/CollectionCardSkeleton'
import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import SeriesCard from '@/components/widgets/media-card/SeriesCard'
import SeriesCardSkeleton from '@/components/widgets/media-card/SeriesCardSkeleton'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { MediaProvider } from '@/contexts/MediaContext'
import { BookLibraryItem, BookshelfView, Collection, EReaderDevice, MediaProgress, PodcastEpisode, PodcastLibraryItem, Series } from '@/types/api'
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

  // Default props for media cards (sizeMultiplier comes from CardSizeContext)
  const defaultProps = {
    bookshelfView: BookshelfView.STANDARD,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    userPermissions: user.permissions,
    ereaderDevices: [] as EReaderDevice[],
    showSubtitles: true,
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
  // Series card refs
  const seriesStandardCardRef = useRef<HTMLDivElement>(null)
  const seriesStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const seriesDetailCardRef = useRef<HTMLDivElement>(null)
  const seriesDetailSkeletonRef = useRef<HTMLDivElement>(null)
  const seriesDetailOrderByCardRef = useRef<HTMLDivElement>(null)
  const seriesDetailOrderBySkeletonRef = useRef<HTMLDivElement>(null)
  // Collection card refs
  const collectionStandardCardRef = useRef<HTMLDivElement>(null)
  const collectionStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const collectionDetailCardRef = useRef<HTMLDivElement>(null)
  const collectionDetailSkeletonRef = useRef<HTMLDivElement>(null)

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
  // Series card dimensions
  const [seriesStandardCardDims, setSeriesStandardCardDims] = useState<Dimensions | null>(null)
  const [seriesStandardSkeletonDims, setSeriesStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [seriesDetailCardDims, setSeriesDetailCardDims] = useState<Dimensions | null>(null)
  const [seriesDetailSkeletonDims, setSeriesDetailSkeletonDims] = useState<Dimensions | null>(null)
  const [seriesDetailOrderByCardDims, setSeriesDetailOrderByCardDims] = useState<Dimensions | null>(null)
  const [seriesDetailOrderBySkeletonDims, setSeriesDetailOrderBySkeletonDims] = useState<Dimensions | null>(null)
  // Collection card dimensions
  const [collectionStandardCardDims, setCollectionStandardCardDims] = useState<Dimensions | null>(null)
  const [collectionStandardSkeletonDims, setCollectionStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [collectionDetailCardDims, setCollectionDetailCardDims] = useState<Dimensions | null>(null)
  const [collectionDetailSkeletonDims, setCollectionDetailSkeletonDims] = useState<Dimensions | null>(null)

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
        measureElement(podcastNumEpisodesIncompleteSkeletonRef, setPodcastNumEpisodesIncompleteSkeletonDims),
        // Series card measurements
        measureElement(seriesStandardCardRef, setSeriesStandardCardDims),
        measureElement(seriesStandardSkeletonRef, setSeriesStandardSkeletonDims),
        measureElement(seriesDetailCardRef, setSeriesDetailCardDims),
        measureElement(seriesDetailSkeletonRef, setSeriesDetailSkeletonDims),
        measureElement(seriesDetailOrderByCardRef, setSeriesDetailOrderByCardDims),
        measureElement(seriesDetailOrderBySkeletonRef, setSeriesDetailOrderBySkeletonDims),
        // Collection card measurements
        measureElement(collectionStandardCardRef, setCollectionStandardCardDims),
        measureElement(collectionStandardSkeletonRef, setCollectionStandardSkeletonDims),
        measureElement(collectionDetailCardRef, setCollectionDetailCardDims),
        measureElement(collectionDetailSkeletonRef, setCollectionDetailSkeletonDims)
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

              <Example title={`Long Title (Truncated)`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div>
                      <BookMediaCard
                        {...defaultProps}
                        libraryItem={
                          {
                            ...selectedBook,
                            media: {
                              ...selectedBook.media,
                              metadata: {
                                ...selectedBook.media.metadata,
                                title: 'The Incredibly Long and Extraordinarily Detailed Title of This Audiobook That Should Definitely Be Truncated'
                              }
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

        {/* Series Card Examples - Uses selected book to create mock series */}
        {selectedBook ? (
          <>
            <h3 id="series-card-examples" className="text-lg font-bold mb-4 mt-8">
              Series Card (Standalone Series View)
            </h3>
            <ComponentInfo
              component="SeriesCard"
              description="Card component for displaying series in a Series bookshelf view. Shows multiple book covers in a stacked mosaic layout, series progress bar, book count badge, and RSS feed indicator. Different from CollapsedSeriesCard which is used for collapsed series within a library items view."
            >
              <p className="mb-2">
                <span className="font-bold">Import:</span> <Code overflow>import SeriesCard from &apos;@/components/widgets/media-card/SeriesCard&apos;</Code>
              </p>
              <div>
                <span className="font-bold">Props:</span>
                <ul className="list-disc list-inside">
                  <li>
                    <Code>series</Code>: The Series object containing id, name, books array, rssFeed, etc.
                  </li>
                  <li>
                    <Code>libraryId</Code>: Library ID for navigation.
                  </li>
                  <li>
                    <Code>bookshelfView</Code>: View mode (BookshelfView.STANDARD or BookshelfView.DETAIL).
                  </li>
                  <li>
                    <Code>orderBy</Code>: Sort field (addedAt, totalDuration, lastBookUpdated, lastBookAdded).
                  </li>
                  <li>
                    <Code>bookProgressMap</Code>: Map of book progress by library item ID for calculating series progress.
                  </li>
                </ul>
              </div>
            </ComponentInfo>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Standard View`}>
                <div className="flex gap-4 flex-wrap">
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={seriesStandardCardRef}>
                      <SeriesCard
                        series={
                          {
                            id: 'series-multi',
                            name: 'The Multi-Book Series',
                            nameIgnorePrefix: 'Multi-Book Series',
                            addedAt: Date.now() - 86400000 * 60,
                            books: [selectedBook, selectedBook, selectedBook]
                          } as Series
                        }
                        libraryId={selectedBook.libraryId}
                        bookshelfView={BookshelfView.STANDARD}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        dateFormat={defaultProps.dateFormat}
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={seriesStandardSkeletonRef}>
                      <SeriesCardSkeleton bookshelfView={BookshelfView.STANDARD} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={seriesStandardCardDims} skeletonDimensions={seriesStandardSkeletonDims} />
              </Example>

              <Example title={`Detail View`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={seriesDetailCardRef}>
                      <SeriesCard
                        series={
                          {
                            id: 'series-detail',
                            name: 'The Example Series',
                            nameIgnorePrefix: 'Example Series',
                            addedAt: Date.now() - 86400000 * 45,
                            books: [selectedBook, selectedBook, selectedBook, selectedBook, selectedBook]
                          } as Series
                        }
                        libraryId={selectedBook.libraryId}
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        dateFormat={defaultProps.dateFormat}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={seriesDetailSkeletonRef}>
                      <SeriesCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={seriesDetailCardDims} skeletonDimensions={seriesDetailSkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`With Progress Bar`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">50% Progress (2/4 books)</p>
                    <SeriesCard
                      series={
                        {
                          id: 'series-progress',
                          name: 'Series In Progress',
                          addedAt: Date.now() - 86400000 * 20,
                          books: [selectedBook, selectedBook, selectedBook, selectedBook]
                        } as Series
                      }
                      libraryId={selectedBook.libraryId}
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      dateFormat={defaultProps.dateFormat}
                      bookProgressMap={
                        new Map([[selectedBook.id, { id: 'p1', libraryItemId: selectedBook.id, isFinished: false, progress: 0.5 } as MediaProgress]])
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">100% Complete (Finished)</p>
                    <SeriesCard
                      series={
                        {
                          id: 'series-complete',
                          name: 'Completed Series',
                          addedAt: Date.now() - 86400000 * 90,
                          books: [selectedBook, selectedBook, selectedBook]
                        } as Series
                      }
                      libraryId={selectedBook.libraryId}
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      dateFormat={defaultProps.dateFormat}
                      bookProgressMap={
                        new Map([[selectedBook.id, { id: 'pc1', libraryItemId: selectedBook.id, isFinished: true, progress: 1 } as MediaProgress]])
                      }
                    />
                  </div>
                </div>
              </Example>

              <Example title={`With RSS Feed`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">RSS Feed Active</p>
                    <SeriesCard
                      series={
                        {
                          id: 'series-rss',
                          name: 'Series with RSS Feed',
                          addedAt: Date.now() - 86400000 * 15,
                          books: [selectedBook, selectedBook],
                          rssFeed: {
                            id: 'rss-series-123',
                            slug: 'series-feed',
                            entityId: 'series-rss',
                            entityType: 'series',
                            feedUrl: 'https://example.com/series-feed.xml',
                            metaTitle: 'Series with RSS Feed',
                            isPublic: true,
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                          }
                        } as Series
                      }
                      libraryId={selectedBook.libraryId}
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      dateFormat={defaultProps.dateFormat}
                    />
                  </div>
                </div>
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Detail View Ordered by AddedAt`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={seriesDetailOrderByCardRef}>
                      <SeriesCard
                        series={
                          {
                            id: 'series-sort-added',
                            name: 'Recently Added Series',
                            addedAt: Date.now() - 86400000 * 7,
                            books: [selectedBook, selectedBook]
                          } as Series
                        }
                        libraryId={selectedBook.libraryId}
                        bookshelfView={BookshelfView.DETAIL}
                        orderBy="addedAt"
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        dateFormat={defaultProps.dateFormat}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={seriesDetailOrderBySkeletonRef}>
                      <SeriesCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} orderBy="addedAt" />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={seriesDetailOrderByCardDims} skeletonDimensions={seriesDetailOrderBySkeletonDims} />
              </Example>

              <Example title={`Sort by: totalDuration`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <SeriesCard
                      series={
                        {
                          id: 'series-sort-duration',
                          name: 'Long Duration Series',
                          addedAt: Date.now() - 86400000 * 30,
                          books: [
                            { ...selectedBook, media: { ...selectedBook.media, duration: 36000 } } as BookLibraryItem,
                            { ...selectedBook, media: { ...selectedBook.media, duration: 28800 } } as BookLibraryItem
                          ]
                        } as Series
                      }
                      libraryId={selectedBook.libraryId}
                      bookshelfView={BookshelfView.DETAIL}
                      orderBy="totalDuration"
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      dateFormat={defaultProps.dateFormat}
                    />
                  </div>
                </div>
              </Example>

              <Example title={`No Covers (Fallback)`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Books without covers</p>
                    <SeriesCard
                      series={
                        {
                          id: 'series-no-cover',
                          name: 'The Mysterious Series Without Covers',
                          addedAt: Date.now() - 86400000 * 50,
                          books: [
                            { ...selectedBook, media: { ...selectedBook.media, coverPath: undefined } } as BookLibraryItem,
                            { ...selectedBook, media: { ...selectedBook.media, coverPath: undefined } } as BookLibraryItem
                          ]
                        } as Series
                      }
                      libraryId={selectedBook.libraryId}
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      dateFormat={defaultProps.dateFormat}
                    />
                  </div>
                </div>
              </Example>

              <Example title={`Single Book Series`}>
                <div className="flex gap-4 flex-wrap">
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Standard View</p>
                    <SeriesCard
                      series={
                        {
                          id: 'series-single-book-std',
                          name: 'Standalone Novel Series',
                          addedAt: Date.now() - 86400000 * 10,
                          books: [selectedBook]
                        } as Series
                      }
                      libraryId={selectedBook.libraryId}
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      dateFormat={defaultProps.dateFormat}
                    />
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Detail View</p>
                    <SeriesCard
                      series={
                        {
                          id: 'series-single-book-detail',
                          name: 'Standalone Novel Series',
                          addedAt: Date.now() - 86400000 * 10,
                          books: [selectedBook]
                        } as Series
                      }
                      libraryId={selectedBook.libraryId}
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      dateFormat={defaultProps.dateFormat}
                    />
                  </div>
                </div>
              </Example>
            </div>

            <Example title={`Size Multipliers (Standard View)`}>
              <div className="flex gap-4 flex-wrap items-start">
                <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-sm',
                        name: 'Very Small Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.STANDARD}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={1 / 2}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-md',
                        name: 'Small Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.STANDARD}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={3 / 4}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-md',
                        name: 'Medium Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.STANDARD}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={5 / 6}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div className="mb-6" style={{ fontSize: `${1}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size: 1 (effective 5/6 on mobile)</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-lg',
                        name: 'Standard Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.STANDARD}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-lg',
                        name: 'Large Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.STANDARD}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={4 / 3}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
              </div>
            </Example>

            <Example title={`Size Multipliers (Detail View)`}>
              <div className="flex gap-4 flex-wrap items-start">
                <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-sm',
                        name: 'Very Small Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.DETAIL}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={1 / 2}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-md',
                        name: 'Small Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.DETAIL}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={3 / 4}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-md',
                        name: 'Medium Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.DETAIL}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={5 / 6}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div className="mb-6" style={{ fontSize: `${1}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size: 1 (effective 5/6 on mobile)</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-lg',
                        name: 'Standard Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.DETAIL}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
                <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
                  <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
                  <SeriesCard
                    series={
                      {
                        id: 'series-std-lg',
                        name: 'Large Series',
                        books: [selectedBook, selectedBook, selectedBook]
                      } as Series
                    }
                    libraryId={selectedBook.libraryId}
                    bookshelfView={BookshelfView.DETAIL}
                    bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    sizeMultiplier={4 / 3}
                    dateFormat={defaultProps.dateFormat}
                  />
                </div>
              </div>
            </Example>
          </>
        ) : null}

        {/* Collection Card Examples - Uses selected book to create mock collection */}
        {selectedBook ? (
          <>
            <h3 id="collection-card-examples" className="text-lg font-bold mb-4 mt-8">
              Collection Card
            </h3>
            <ComponentInfo
              component="CollectionCard"
              description="Card component for displaying collections in a Collection bookshelf view. Shows book covers side by side (up to 2), RSS feed indicator, edit button, and more menu with actions (create playlist, open RSS feed, delete). Different from Series cards as collections are user-created groupings."
            >
              <p className="mb-2">
                <span className="font-bold">Import:</span>{' '}
                <Code overflow>import CollectionCard from &apos;@/components/widgets/media-card/CollectionCard&apos;</Code>
              </p>
              <div>
                <span className="font-bold">Props:</span>
                <ul className="list-disc list-inside">
                  <li>
                    <Code>collection</Code>: Collection - The collection to display
                  </li>
                  <li>
                    <Code>bookshelfView</Code>: BookshelfView - View mode (STANDARD or DETAIL)
                  </li>
                  <li>
                    <Code>bookCoverAspectRatio</Code>?: number - Cover aspect ratio
                  </li>
                  <li>
                    <Code>userCanUpdate</Code>?: boolean - Show edit button
                  </li>
                  <li>
                    <Code>userCanDelete</Code>?: boolean - Show delete option in more menu
                  </li>
                  <li>
                    <Code>userIsAdmin</Code>?: boolean - Show RSS feed option in more menu
                  </li>
                </ul>
              </div>
            </ComponentInfo>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`Standard View`}>
                <div className="flex gap-4 flex-wrap">
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={collectionStandardCardRef}>
                      <CollectionCard
                        collection={
                          {
                            id: 'collection-1',
                            name: 'My Favorite Books',
                            description: 'A collection of my favorite audiobooks',
                            libraryId: selectedBook.libraryId,
                            books: [selectedBook, selectedBook]
                          } as Collection
                        }
                        bookshelfView={BookshelfView.STANDARD}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        userCanUpdate={true}
                        userCanDelete={true}
                        userIsAdmin={true}
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={collectionStandardSkeletonRef}>
                      <CollectionCardSkeleton bookshelfView={BookshelfView.STANDARD} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={collectionStandardCardDims} skeletonDimensions={collectionStandardSkeletonDims} />
              </Example>

              <Example title={`Detail View`}>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">With Data</p>
                    <div ref={collectionDetailCardRef}>
                      <CollectionCard
                        collection={
                          {
                            id: 'collection-2',
                            name: 'Science Fiction Collection',
                            description: 'Great sci-fi books',
                            libraryId: selectedBook.libraryId,
                            books: [selectedBook, selectedBook]
                          } as Collection
                        }
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                        userCanUpdate={true}
                        userCanDelete={true}
                        userIsAdmin={true}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                    <div ref={collectionDetailSkeletonRef}>
                      <CollectionCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
                    </div>
                  </div>
                </div>
                <DimensionComparison cardDimensions={collectionDetailCardDims} skeletonDimensions={collectionDetailSkeletonDims} />
              </Example>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Example title={`With RSS Feed`}>
                <div className="flex gap-4 flex-wrap">
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Standard View</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-rss',
                          name: 'Collection with RSS Feed',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook],
                          rssFeed: {
                            id: 'feed-1',
                            slug: 'my-collection',
                            entityId: 'collection-rss',
                            feedUrl: 'https://example.com/feed'
                          }
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      userCanUpdate={true}
                      userIsAdmin={true}
                    />
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Detail View</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-rss-detail',
                          name: 'Collection with RSS Feed',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook],
                          rssFeed: {
                            id: 'feed-2',
                            slug: 'my-collection-2',
                            entityId: 'collection-rss-detail',
                            feedUrl: 'https://example.com/feed2'
                          }
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      userCanUpdate={true}
                      userIsAdmin={true}
                    />
                  </div>
                </div>
              </Example>

              <Example title={`Empty Collection`}>
                <div className="flex gap-4 flex-wrap">
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Standard View</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-empty',
                          name: 'Empty Collection',
                          libraryId: selectedBook.libraryId,
                          books: []
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      userCanUpdate={true}
                      userCanDelete={true}
                    />
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Detail View</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-empty-detail',
                          name: 'Empty Collection',
                          libraryId: selectedBook.libraryId,
                          books: []
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      userCanUpdate={true}
                      userCanDelete={true}
                    />
                  </div>
                </div>
              </Example>
            </div>

            <div className="mb-6">
              <Example title={`Single Book Collection`}>
                <div className="flex gap-4 flex-wrap">
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Standard View</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-single',
                          name: 'Single Book Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      userCanUpdate={true}
                      userCanDelete={true}
                    />
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Detail View</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-single-detail',
                          name: 'Single Book Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      userCanUpdate={true}
                      userCanDelete={true}
                    />
                  </div>
                </div>
              </Example>
            </div>

            <div className="mb-6">
              <Example title={`Size Multipliers (Standard View)`}>
                <div className="flex gap-8 flex-wrap items-start pb-6">
                  <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-half-std',
                          name: 'Very Small Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={1 / 2}
                      userCanUpdate={true}
                    />
                  </div>
                  <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-threequarter-std',
                          name: 'Small Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={3 / 4}
                      userCanUpdate={true}
                    />
                  </div>
                  <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-five-std',
                          name: 'Medium Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={5 / 6}
                      userCanUpdate={true}
                    />
                  </div>
                  <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
                    <p className="text-sm text-gray-400 mb-2">Size: 1</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-one-std',
                          name: 'Standard Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={1}
                      userCanUpdate={true}
                    />
                  </div>
                  <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
                    <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-fourthirds-std',
                          name: 'Large Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.STANDARD}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={4 / 3}
                      userCanUpdate={true}
                    />
                  </div>
                </div>
              </Example>
            </div>

            <div className="mb-6">
              <Example title={`Size Multipliers (Detail View)`}>
                <div className="flex gap-8 flex-wrap items-start pb-6">
                  <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-half-detail',
                          name: 'Very Small Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={1 / 2}
                      userCanUpdate={true}
                    />
                  </div>
                  <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-threequarter-detail',
                          name: 'Small Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={3 / 4}
                      userCanUpdate={true}
                    />
                  </div>
                  <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-five-detail',
                          name: 'Medium Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={5 / 6}
                      userCanUpdate={true}
                    />
                  </div>
                  <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
                    <p className="text-sm text-gray-400 mb-2">Size: 1</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-one-detail',
                          name: 'Standard Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={1}
                      userCanUpdate={true}
                    />
                  </div>
                  <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
                    <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
                    <CollectionCard
                      collection={
                        {
                          id: 'collection-size-fourthirds-detail',
                          name: 'Large Collection',
                          libraryId: selectedBook.libraryId,
                          books: [selectedBook, selectedBook]
                        } as Collection
                      }
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                      sizeMultiplier={4 / 3}
                      userCanUpdate={true}
                    />
                  </div>
                </div>
              </Example>
            </div>
          </>
        ) : null}
      </ComponentExamples>
    </MediaProvider>
  )
}
