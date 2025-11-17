'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { MediaProvider } from '@/contexts/MediaContext'
import { BookLibraryItem, BookshelfView, EReaderDevice, PodcastLibraryItem } from '@/types/api'
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

  // Refs for dimension checking
  const bookStandardCardRef = useRef<HTMLDivElement>(null)
  const bookStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const bookDetailCardRef = useRef<HTMLDivElement>(null)
  const bookDetailSkeletonRef = useRef<HTMLDivElement>(null)
  const bookDetailNoSubCardRef = useRef<HTMLDivElement>(null)
  const bookDetailNoSubSkeletonRef = useRef<HTMLDivElement>(null)
  const bookDetailOrderByCardRef = useRef<HTMLDivElement>(null)
  const bookDetailOrderBySkeletonRef = useRef<HTMLDivElement>(null)
  const podcastStandardCardRef = useRef<HTMLDivElement>(null)
  const podcastStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastDetailCardRef = useRef<HTMLDivElement>(null)
  const podcastDetailSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastDetailNoSubCardRef = useRef<HTMLDivElement>(null)
  const podcastDetailNoSubSkeletonRef = useRef<HTMLDivElement>(null)
  const podcastDetailOrderByCardRef = useRef<HTMLDivElement>(null)
  const podcastDetailOrderBySkeletonRef = useRef<HTMLDivElement>(null)

  // State for dimensions
  const [bookStandardCardDims, setBookStandardCardDims] = useState<Dimensions | null>(null)
  const [bookStandardSkeletonDims, setBookStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [bookDetailCardDims, setBookDetailCardDims] = useState<Dimensions | null>(null)
  const [bookDetailSkeletonDims, setBookDetailSkeletonDims] = useState<Dimensions | null>(null)
  const [bookDetailNoSubCardDims, setBookDetailNoSubCardDims] = useState<Dimensions | null>(null)
  const [bookDetailNoSubSkeletonDims, setBookDetailNoSubSkeletonDims] = useState<Dimensions | null>(null)
  const [bookDetailOrderByCardDims, setBookDetailOrderByCardDims] = useState<Dimensions | null>(null)
  const [bookDetailOrderBySkeletonDims, setBookDetailOrderBySkeletonDims] = useState<Dimensions | null>(null)
  const [podcastStandardCardDims, setPodcastStandardCardDims] = useState<Dimensions | null>(null)
  const [podcastStandardSkeletonDims, setPodcastStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastDetailCardDims, setPodcastDetailCardDims] = useState<Dimensions | null>(null)
  const [podcastDetailSkeletonDims, setPodcastDetailSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastDetailNoSubCardDims, setPodcastDetailNoSubCardDims] = useState<Dimensions | null>(null)
  const [podcastDetailNoSubSkeletonDims, setPodcastDetailNoSubSkeletonDims] = useState<Dimensions | null>(null)
  const [podcastDetailOrderByCardDims, setPodcastDetailOrderByCardDims] = useState<Dimensions | null>(null)
  const [podcastDetailOrderBySkeletonDims, setPodcastDetailOrderBySkeletonDims] = useState<Dimensions | null>(null)

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
        measureElement(podcastStandardCardRef, setPodcastStandardCardDims),
        measureElement(podcastStandardSkeletonRef, setPodcastStandardSkeletonDims),
        measureElement(podcastDetailCardRef, setPodcastDetailCardDims),
        measureElement(podcastDetailSkeletonRef, setPodcastDetailSkeletonDims),
        measureElement(podcastDetailNoSubCardRef, setPodcastDetailNoSubCardDims),
        measureElement(podcastDetailNoSubSkeletonRef, setPodcastDetailNoSubSkeletonDims),
        measureElement(podcastDetailOrderByCardRef, setPodcastDetailOrderByCardDims),
        measureElement(podcastDetailOrderBySkeletonRef, setPodcastDetailOrderBySkeletonDims)
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
          component="BookMediaCard / PodcastMediaCard / MediaCardSkeleton"
          description="Media card components for displaying library items in the bookshelf. BookMediaCard displays books with book-specific badges (series sequence, books in series, ebook format). PodcastMediaCard displays podcasts with podcast-specific badges (episode numbers, episode counts). Both components handle cover display, progress indicators, and overlay controls. MediaCardSkeleton provides a loading state that matches the exact dimensions of the cards."
        >
          <p className="mb-2">
            <span className="font-bold">Import:</span> <Code overflow>import BookMediaCard from &apos;@/components/widgets/media-card/BookMediaCard&apos;</Code>
            <br />
            <Code overflow>import PodcastMediaCard from &apos;@/components/widgets/media-card/PodcastMediaCard&apos;</Code>
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
                <Code>bookshelfView</Code>: View mode (BookshelfView.STANDARD or BookshelfView.DETAIL).
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
            <Example title={`Book Media Card - Standard View: ${selectedBook.media.metadata.title}`} className="mb-6">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-400 mb-2">With Data</p>
                  <div ref={bookStandardCardRef}>
                    <BookMediaCard {...defaultProps} libraryItem={selectedBook} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
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

            <Example title={`Book Media Card - Detail View: ${selectedBook.media.metadata.title}`} className="mb-6">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-400 mb-2">With Data</p>
                  <div ref={bookDetailCardRef}>
                    <BookMediaCard
                      {...defaultProps}
                      libraryItem={selectedBook}
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
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

            <Example title={`Book Media Card - Detail View Without Subtitles: ${selectedBook.media.metadata.title}`} className="mb-6">
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

            <Example title={`Book Media Card - Detail View with OrderBy AddedAt: ${selectedBook.media.metadata.title}`} className="mb-6">
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
          </>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg">
            <p className="text-gray-400">Select a book from the search box above to see the Book Media Card components with real data.</p>
          </div>
        )}

        {selectedPodcast ? (
          <>
            <Example title={`Podcast Media Card - Standard View: ${selectedPodcast.media.metadata.title}`} className="mb-6">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-400 mb-2">With Data</p>
                  <div ref={podcastStandardCardRef}>
                    <PodcastMediaCard {...defaultProps} libraryItem={selectedPodcast} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                  <div ref={podcastStandardSkeletonRef}>
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
              <DimensionComparison cardDimensions={podcastStandardCardDims} skeletonDimensions={podcastStandardSkeletonDims} />
            </Example>

            <Example title={`Podcast Media Card - Detail View: ${selectedPodcast.media.metadata.title}`} className="mb-6">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-400 mb-2">With Data</p>
                  <div ref={podcastDetailCardRef}>
                    <PodcastMediaCard
                      {...defaultProps}
                      libraryItem={selectedPodcast}
                      bookshelfView={BookshelfView.DETAIL}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                  <div ref={podcastDetailSkeletonRef}>
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
              <DimensionComparison cardDimensions={podcastDetailCardDims} skeletonDimensions={podcastDetailSkeletonDims} />
            </Example>

            <Example title={`Podcast Media Card - Detail View Without Subtitles: ${selectedPodcast.media.metadata.title}`} className="mb-6">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-400 mb-2">With Data</p>
                  <div ref={podcastDetailNoSubCardRef}>
                    <PodcastMediaCard
                      {...defaultProps}
                      libraryItem={selectedPodcast}
                      bookshelfView={BookshelfView.DETAIL}
                      showSubtitles={false}
                      bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                  <div ref={podcastDetailNoSubSkeletonRef}>
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
              <DimensionComparison cardDimensions={podcastDetailNoSubCardDims} skeletonDimensions={podcastDetailNoSubSkeletonDims} />
            </Example>

            <Example title={`Podcast Media Card - Detail View with OrderBy AddedAt: ${selectedPodcast.media.metadata.title}`} className="mb-6">
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
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
                  <div ref={podcastDetailOrderBySkeletonRef}>
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
              <DimensionComparison cardDimensions={podcastDetailOrderByCardDims} skeletonDimensions={podcastDetailOrderBySkeletonDims} />
            </Example>
          </>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg">
            <p className="text-gray-400">Select a podcast from the search box above to see the Podcast Media Card components with real data.</p>
          </div>
        )}
      </ComponentExamples>
    </MediaProvider>
  )
}
