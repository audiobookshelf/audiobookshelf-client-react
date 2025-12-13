'use client'

import SeriesCard from '@/components/widgets/media-card/SeriesCard'
import SeriesCardSkeleton from '@/components/widgets/media-card/SeriesCardSkeleton'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookLibraryItem, BookshelfView, LibraryItem, MediaProgress, Series } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface SeriesCardExamplesProps {
  seriesData: Series
  libraryId: string
}

export function SeriesCardExamples({ seriesData, libraryId }: SeriesCardExamplesProps) {
  const { bookCoverAspectRatio } = useComponentsCatalog()

  const defaultDateFormat = 'MM/dd/yyyy'

  // Refs for dimension checking
  const seriesStandardCardRef = useRef<HTMLDivElement>(null)
  const seriesStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const seriesDetailCardRef = useRef<HTMLDivElement>(null)
  const seriesDetailSkeletonRef = useRef<HTMLDivElement>(null)
  const seriesDetailOrderByCardRef = useRef<HTMLDivElement>(null)
  const seriesDetailOrderBySkeletonRef = useRef<HTMLDivElement>(null)

  // State for dimensions
  const [seriesStandardCardDims, setSeriesStandardCardDims] = useState<Dimensions | null>(null)
  const [seriesStandardSkeletonDims, setSeriesStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [seriesDetailCardDims, setSeriesDetailCardDims] = useState<Dimensions | null>(null)
  const [seriesDetailSkeletonDims, setSeriesDetailSkeletonDims] = useState<Dimensions | null>(null)
  const [seriesDetailOrderByCardDims, setSeriesDetailOrderByCardDims] = useState<Dimensions | null>(null)
  const [seriesDetailOrderBySkeletonDims, setSeriesDetailOrderBySkeletonDims] = useState<Dimensions | null>(null)

  // Measure dimensions
  useDimensionMeasurement(
    [
      { ref: seriesStandardCardRef, setDims: setSeriesStandardCardDims },
      { ref: seriesStandardSkeletonRef, setDims: setSeriesStandardSkeletonDims },
      { ref: seriesDetailCardRef, setDims: setSeriesDetailCardDims },
      { ref: seriesDetailSkeletonRef, setDims: setSeriesDetailSkeletonDims },
      { ref: seriesDetailOrderByCardRef, setDims: setSeriesDetailOrderByCardDims },
      { ref: seriesDetailOrderBySkeletonRef, setDims: setSeriesDetailOrderBySkeletonDims }
    ],
    [seriesData]
  )

  return (
    <ComponentExamples title="Series Cards">
      <ComponentInfo
        component="SeriesCard / SeriesCardSkeleton"
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

      <h3 id="series-card-examples" className="text-lg font-bold mb-4">
        Series: {seriesData.name}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title={`Standard View`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">With Data</p>
              <div ref={seriesStandardCardRef}>
                <SeriesCard
                  series={seriesData}
                  libraryId={libraryId}
                  bookshelfView={BookshelfView.STANDARD}
                  bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                  dateFormat={defaultDateFormat}
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
                  series={seriesData}
                  libraryId={libraryId}
                  bookshelfView={BookshelfView.DETAIL}
                  bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                  dateFormat={defaultDateFormat}
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
              <p className="text-sm text-gray-400 mb-2">50% Progress</p>
              <SeriesCard
                series={seriesData}
                libraryId={libraryId}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
                bookProgressMap={
                  new Map(
                    seriesData.books
                      ?.slice(0, Math.ceil((seriesData.books?.length || 0) / 2))
                      .map((book) => [book.id, { id: `progress-${book.id}`, libraryItemId: book.id, isFinished: false, progress: 0.5 } as MediaProgress]) || []
                  )
                }
              />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">100% Complete (Finished)</p>
              <SeriesCard
                series={seriesData}
                libraryId={libraryId}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
                bookProgressMap={
                  new Map(
                    seriesData.books?.map((book) => [
                      book.id,
                      { id: `finished-${book.id}`, libraryItemId: book.id, isFinished: true, progress: 1 } as MediaProgress
                    ]) || []
                  )
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
                    ...seriesData,
                    rssFeed: {
                      id: 'rss-series-demo',
                      slug: 'series-feed',
                      entityId: seriesData.id,
                      entityType: 'series',
                      feedUrl: 'https://example.com/series-feed.xml',
                      metaTitle: seriesData.name,
                      isPublic: true,
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    }
                  } as Series
                }
                libraryId={libraryId}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
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
                  series={seriesData}
                  libraryId={libraryId}
                  bookshelfView={BookshelfView.DETAIL}
                  orderBy="addedAt"
                  bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                  dateFormat={defaultDateFormat}
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
                series={seriesData}
                libraryId={libraryId}
                bookshelfView={BookshelfView.DETAIL}
                orderBy="totalDuration"
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
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
                    ...seriesData,
                    books: seriesData.books?.slice(0, 2).map((book) => ({
                      ...book,
                      media: { ...(book as BookLibraryItem).media, coverPath: undefined }
                    })) as LibraryItem[]
                  } as Series
                }
                libraryId={libraryId}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
              />
            </div>
          </div>
        </Example>

        <Example title={`Single Book Series`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <SeriesCard
                series={{ ...seriesData, books: seriesData.books?.slice(0, 1) } as Series}
                libraryId={libraryId}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <SeriesCard
                series={{ ...seriesData, books: seriesData.books?.slice(0, 1) } as Series}
                libraryId={libraryId}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title="Selection Mode">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Selection Mode (Unselected)</p>
              <SeriesCard
                series={seriesData}
                libraryId={libraryId}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
                isSelectionMode={true}
                selected={false}
                showSelectedButton={true}
                onSelect={(e) => console.log('Toggle selection', e)}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Selection Mode (Selected)</p>
              <SeriesCard
                series={seriesData}
                libraryId={libraryId}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                dateFormat={defaultDateFormat}
                isSelectionMode={true}
                selected={true}
                showSelectedButton={true}
                onSelect={(e) => console.log('Toggle selection', e)}
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
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.STANDARD}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={1 / 2}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.STANDARD}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={3 / 4}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.STANDARD}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={5 / 6}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div className="mb-6" style={{ fontSize: `${1}em` }}>
            <p className="text-sm text-gray-400 mb-2">Size: 1 (effective 5/6 on mobile)</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.STANDARD}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
            <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.STANDARD}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={4 / 3}
              dateFormat={defaultDateFormat}
            />
          </div>
        </div>
      </Example>

      <Example title={`Size Multipliers (Detail View)`}>
        <div className="flex gap-4 flex-wrap items-start">
          <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={1 / 2}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={3 / 4}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={5 / 6}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div className="mb-6" style={{ fontSize: `${1}em` }}>
            <p className="text-sm text-gray-400 mb-2">Size: 1 (effective 5/6 on mobile)</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              dateFormat={defaultDateFormat}
            />
          </div>
          <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
            <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
            <SeriesCard
              series={seriesData}
              libraryId={libraryId}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
              sizeMultiplier={4 / 3}
              dateFormat={defaultDateFormat}
            />
          </div>
        </div>
      </Example>
    </ComponentExamples>
  )
}
