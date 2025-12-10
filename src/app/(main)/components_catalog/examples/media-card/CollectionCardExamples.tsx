'use client'

import CollectionCard from '@/components/widgets/media-card/CollectionCard'
import CollectionCardSkeleton from '@/components/widgets/media-card/CollectionCardSkeleton'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookshelfView, Collection } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface CollectionCardExamplesProps {
  collectionData: Collection
}

export function CollectionCardExamples({ collectionData }: CollectionCardExamplesProps) {
  const { bookCoverAspectRatio } = useComponentsCatalog()

  // Refs for dimension checking
  const collectionStandardCardRef = useRef<HTMLDivElement>(null)
  const collectionStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const collectionDetailCardRef = useRef<HTMLDivElement>(null)
  const collectionDetailSkeletonRef = useRef<HTMLDivElement>(null)

  // State for dimensions
  const [collectionStandardCardDims, setCollectionStandardCardDims] = useState<Dimensions | null>(null)
  const [collectionStandardSkeletonDims, setCollectionStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [collectionDetailCardDims, setCollectionDetailCardDims] = useState<Dimensions | null>(null)
  const [collectionDetailSkeletonDims, setCollectionDetailSkeletonDims] = useState<Dimensions | null>(null)

  // Measure dimensions
  useDimensionMeasurement(
    [
      { ref: collectionStandardCardRef, setDims: setCollectionStandardCardDims },
      { ref: collectionStandardSkeletonRef, setDims: setCollectionStandardSkeletonDims },
      { ref: collectionDetailCardRef, setDims: setCollectionDetailCardDims },
      { ref: collectionDetailSkeletonRef, setDims: setCollectionDetailSkeletonDims }
    ],
    [collectionData]
  )

  return (
    <ComponentExamples title="Collection Cards">
      <ComponentInfo
        component="CollectionCard / CollectionCardSkeleton"
        description="Card component for displaying collections in a Collection bookshelf view. Shows book covers side by side (up to 2), RSS feed indicator, edit button, and more menu with actions (create playlist, open RSS feed, delete). Different from Series cards as collections are user-created groupings."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import CollectionCard from &apos;@/components/widgets/media-card/CollectionCard&apos;</Code>
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

      <h3 id="collection-card-examples" className="text-lg font-bold mb-4">
        Collection: {collectionData.name}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title={`Standard View`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">With Data</p>
              <div ref={collectionStandardCardRef}>
                <CollectionCard
                  collection={collectionData}
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
                  collection={collectionData}
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
                    ...collectionData,
                    rssFeed: {
                      id: 'feed-demo',
                      slug: 'collection-feed',
                      entityId: collectionData.id,
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
                    ...collectionData,
                    rssFeed: {
                      id: 'feed-demo-2',
                      slug: 'collection-feed-2',
                      entityId: collectionData.id,
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
                collection={{ ...collectionData, books: [] } as Collection}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <CollectionCard
                collection={{ ...collectionData, books: [] } as Collection}
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
                collection={{ ...collectionData, books: collectionData.books?.slice(0, 1) } as Collection}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <CollectionCard
                collection={{ ...collectionData, books: collectionData.books?.slice(0, 1) } as Collection}
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
                collection={collectionData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1 / 2}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
              <CollectionCard
                collection={collectionData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={3 / 4}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
              <CollectionCard
                collection={collectionData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={5 / 6}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="text-sm text-gray-400 mb-2">Size: 1</p>
              <CollectionCard
                collection={collectionData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1}
                userCanUpdate={true}
              />
            </div>
            <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
              <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
              <CollectionCard
                collection={collectionData}
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
                collection={collectionData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1 / 2}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
              <CollectionCard
                collection={collectionData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={3 / 4}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
              <CollectionCard
                collection={collectionData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={5 / 6}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="text-sm text-gray-400 mb-2">Size: 1</p>
              <CollectionCard
                collection={collectionData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1}
                userCanUpdate={true}
              />
            </div>
            <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
              <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
              <CollectionCard
                collection={collectionData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={4 / 3}
                userCanUpdate={true}
              />
            </div>
          </div>
        </Example>
      </div>
    </ComponentExamples>
  )
}
