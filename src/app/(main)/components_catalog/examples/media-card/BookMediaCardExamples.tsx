'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollapsedSeriesCard from '@/components/widgets/media-card/CollapsedSeriesCard'
import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookLibraryItem, BookshelfView, EReaderDevice, MediaProgress } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface BookMediaCardExamplesProps {
  selectedBook: BookLibraryItem
}

export function BookMediaCardExamples({ selectedBook }: BookMediaCardExamplesProps) {
  const { user, bookCoverAspectRatio } = useComponentsCatalog()

  // Selection state
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [isBookSelectionMode, setIsBookSelectionMode] = useState(false)

  // Default props for media cards
  const defaultProps = {
    bookshelfView: BookshelfView.STANDARD,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    userPermissions: user.permissions,
    ereaderDevices: [] as EReaderDevice[],
    showSubtitles: true,
    bookCoverAspectRatio: bookCoverAspectRatio ?? 1.6
  }

  // Selection handler
  const handleBookSelect = () => {
    const isCurrentlySelected = selectedBookId === selectedBook.id
    setSelectedBookId(isCurrentlySelected ? null : selectedBook.id)
    setIsBookSelectionMode(!isCurrentlySelected)
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
  const bookCollapsedSeriesCardRef = useRef<HTMLDivElement>(null)
  const bookCollapsedSeriesSkeletonRef = useRef<HTMLDivElement>(null)
  const bookCollapsedSeriesBooksCountCardRef = useRef<HTMLDivElement>(null)
  const bookCollapsedSeriesBooksCountSkeletonRef = useRef<HTMLDivElement>(null)
  const bookEbookCardRef = useRef<HTMLDivElement>(null)
  const bookEbookSkeletonRef = useRef<HTMLDivElement>(null)
  const bookAuthorBookshelfViewCardRef = useRef<HTMLDivElement>(null)
  const bookMissingCardRef = useRef<HTMLDivElement>(null)
  const bookNoCoverCardRef = useRef<HTMLDivElement>(null)
  const bookRssFeedCardRef = useRef<HTMLDivElement>(null)

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

  // Measure dimensions
  useDimensionMeasurement(
    [
      { ref: bookStandardCardRef, setDims: setBookStandardCardDims },
      { ref: bookStandardSkeletonRef, setDims: setBookStandardSkeletonDims },
      { ref: bookDetailCardRef, setDims: setBookDetailCardDims },
      { ref: bookDetailSkeletonRef, setDims: setBookDetailSkeletonDims },
      { ref: bookDetailNoSubCardRef, setDims: setBookDetailNoSubCardDims },
      { ref: bookDetailNoSubSkeletonRef, setDims: setBookDetailNoSubSkeletonDims },
      { ref: bookDetailOrderByCardRef, setDims: setBookDetailOrderByCardDims },
      { ref: bookDetailOrderBySkeletonRef, setDims: setBookDetailOrderBySkeletonDims },
      { ref: bookCollapsedSeriesCardRef, setDims: setBookCollapsedSeriesCardDims },
      { ref: bookCollapsedSeriesSkeletonRef, setDims: setBookCollapsedSeriesSkeletonDims },
      { ref: bookCollapsedSeriesBooksCountCardRef, setDims: setBookCollapsedSeriesBooksCountCardDims },
      { ref: bookCollapsedSeriesBooksCountSkeletonRef, setDims: setBookCollapsedSeriesBooksCountSkeletonDims },
      { ref: bookEbookCardRef, setDims: setBookEbookCardDims },
      { ref: bookEbookSkeletonRef, setDims: setBookEbookSkeletonDims }
    ],
    [selectedBook]
  )

  return (
    <ComponentExamples title="Book Media Cards">
      <ComponentInfo
        component="BookMediaCard / CollapsedSeriesCard / MediaCardSkeleton"
        description="Media card components for displaying books in the bookshelf. BookMediaCard displays books with book-specific badges (series sequence, ebook format). CollapsedSeriesCard displays collapsed series items with series count badges. MediaCardSkeleton provides a loading state."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import BookMediaCard from &apos;@/components/widgets/media-card/BookMediaCard&apos;</Code>
          <br />
          <Code overflow>import MediaCardSkeleton from &apos;@/components/widgets/media-card/MediaCardSkeleton&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The library item to display (BookLibraryItem).
            </li>
            <li>
              <Code>bookshelfView</Code>: View mode (BookshelfView.STANDARD, BookshelfView.DETAIL, or BookshelfView.AUTHOR).
            </li>
            <li>
              <Code>bookCoverAspectRatio</Code>: Aspect ratio for book covers.
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
    </ComponentExamples>
  )
}
