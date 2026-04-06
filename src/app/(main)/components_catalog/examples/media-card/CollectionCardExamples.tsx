'use client'

import CollectionCard from '@/components/widgets/media-card/CollectionCard'
import CollectionCardSkeleton from '@/components/widgets/media-card/CollectionCardSkeleton'
import { BookshelfView, Collection } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface CollectionCardExamplesProps {
  collectionData: Collection
}

export function CollectionCardExamples({ collectionData }: CollectionCardExamplesProps) {
  const standardCardRef = useRef<HTMLDivElement>(null)
  const standardSkeletonRef = useRef<HTMLDivElement>(null)
  const detailCardRef = useRef<HTMLDivElement>(null)
  const detailSkeletonRef = useRef<HTMLDivElement>(null)
  const [standardCardDims, setStandardCardDims] = useState<Dimensions | null>(null)
  const [standardSkeletonDims, setStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [detailCardDims, setDetailCardDims] = useState<Dimensions | null>(null)
  const [detailSkeletonDims, setDetailSkeletonDims] = useState<Dimensions | null>(null)

  useDimensionMeasurement(
    [
      { ref: standardCardRef, setDims: setStandardCardDims },
      { ref: standardSkeletonRef, setDims: setStandardSkeletonDims },
      { ref: detailCardRef, setDims: setDetailCardDims },
      { ref: detailSkeletonRef, setDims: setDetailSkeletonDims }
    ],
    [collectionData]
  )

  return (
    <ComponentExamples title="Collection Cards">
      <ComponentInfo
        component="CollectionCard / CollectionCardSkeleton"
        description="Card component for displaying collections with side-by-side book covers, RSS indicator, and menu actions."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import CollectionCard from &apos;@/components/widgets/media-card/CollectionCard&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-inside list-disc">
            <li>
              <Code>collection</Code>: Collection - The collection to display
            </li>
            <li>
              <Code>bookshelfView</Code>: BookshelfView - View mode (STANDARD or DETAIL)
            </li>
            <li>
              <Code>sizeMultiplier</Code>?: number - Size multiplier for responsive sizing
            </li>
          </ul>
        </div>
      </ComponentInfo>

      <h3 id="collection-card-examples" className="mb-4 text-lg font-bold">
        Collection: {collectionData.name}
      </h3>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Example title="Standard View">
          <div className="flex flex-wrap gap-4">
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">With Data</p>
              <div ref={standardCardRef}>
                <CollectionCard collection={collectionData} bookshelfView={BookshelfView.STANDARD} />
              </div>
            </div>
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Loading Skeleton</p>
              <div ref={standardSkeletonRef}>
                <CollectionCardSkeleton bookshelfView={BookshelfView.STANDARD} />
              </div>
            </div>
          </div>
          <DimensionComparison cardDimensions={standardCardDims} skeletonDimensions={standardSkeletonDims} />
        </Example>

        <Example title="Detail View">
          <div className="flex flex-wrap gap-4">
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">With Data</p>
              <div ref={detailCardRef}>
                <CollectionCard collection={collectionData} bookshelfView={BookshelfView.DETAIL} />
              </div>
            </div>
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Loading Skeleton</p>
              <div ref={detailSkeletonRef}>
                <CollectionCardSkeleton bookshelfView={BookshelfView.DETAIL} />
              </div>
            </div>
          </div>
          <DimensionComparison cardDimensions={detailCardDims} skeletonDimensions={detailSkeletonDims} />
        </Example>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Example title="With RSS Feed">
          <div className="flex flex-wrap gap-4">
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Standard View</p>
              <CollectionCard
                collection={
                  {
                    ...collectionData,
                    rssFeed: {
                      id: 'feed-demo',
                      slug: 'collection-feed',
                      entityId: collectionData.id,
                      entityType: 'collection',
                      entityUpdatedAt: Date.now(),
                      coverPath: '/placeholder.png',
                      feedUrl: 'https://example.com/feed',
                      serverAddress: 'https://example.com',
                      userId: 'demo-user',
                      meta: {
                        author: 'Demo',
                        description: 'Demo feed',
                        explicit: false,
                        feedUrl: 'https://example.com/feed',
                        imageUrl: 'https://example.com/image.png',
                        language: 'en',
                        link: 'https://example.com',
                        ownerEmail: null,
                        ownerName: null,
                        preventIndexing: false,
                        title: 'Collection Feed',
                        type: 'episodic'
                      },
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    }
                  } as Collection
                }
                bookshelfView={BookshelfView.STANDARD}
              />
            </div>
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Detail View</p>
              <CollectionCard
                collection={
                  {
                    ...collectionData,
                    rssFeed: {
                      id: 'feed-demo-2',
                      slug: 'collection-feed-2',
                      entityId: collectionData.id,
                      entityType: 'collection',
                      entityUpdatedAt: Date.now(),
                      coverPath: '/placeholder.png',
                      feedUrl: 'https://example.com/feed2',
                      serverAddress: 'https://example.com',
                      userId: 'demo-user',
                      meta: {
                        author: 'Demo',
                        description: 'Demo feed',
                        explicit: false,
                        feedUrl: 'https://example.com/feed2',
                        imageUrl: 'https://example.com/image2.png',
                        language: 'en',
                        link: 'https://example.com',
                        ownerEmail: null,
                        ownerName: null,
                        preventIndexing: false,
                        title: 'Collection Feed 2',
                        type: 'episodic'
                      },
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    }
                  } as Collection
                }
                bookshelfView={BookshelfView.DETAIL}
              />
            </div>
          </div>
        </Example>

        <Example title="Empty Collection">
          <div className="flex flex-wrap gap-4">
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Standard View</p>
              <CollectionCard collection={{ ...collectionData, books: [] } as Collection} bookshelfView={BookshelfView.STANDARD} />
            </div>
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Detail View</p>
              <CollectionCard collection={{ ...collectionData, books: [] } as Collection} bookshelfView={BookshelfView.DETAIL} />
            </div>
          </div>
        </Example>
      </div>

      <div className="mb-6">
        <Example title="Single Book Collection">
          <div className="flex flex-wrap gap-4">
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Standard View</p>
              <CollectionCard
                collection={{ ...collectionData, books: collectionData.books?.slice(0, 1) } as Collection}
                bookshelfView={BookshelfView.STANDARD}
              />
            </div>
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Detail View</p>
              <CollectionCard collection={{ ...collectionData, books: collectionData.books?.slice(0, 1) } as Collection} bookshelfView={BookshelfView.DETAIL} />
            </div>
          </div>
        </Example>
      </div>

      <Example title="Selection Mode">
        <div className="flex flex-wrap gap-4">
          <CollectionCard
            collection={collectionData}
            bookshelfView={BookshelfView.STANDARD}
            isSelectionMode
            selected={false}
            showSelectedButton
            onSelect={(e) => console.log('Toggle selection', e)}
          />
          <CollectionCard
            collection={collectionData}
            bookshelfView={BookshelfView.STANDARD}
            isSelectionMode
            selected
            showSelectedButton
            onSelect={(e) => console.log('Toggle selection', e)}
          />
        </div>
      </Example>

      <div className="mb-6">
        <Example title="Size Multipliers (Standard View)">
          <div className="flex flex-wrap items-start gap-8 pb-6">
            <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Size: 1/2</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.STANDARD} sizeMultiplier={1 / 2} />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Size: 3/4</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.STANDARD} sizeMultiplier={3 / 4} />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Size: 5/6</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.STANDARD} sizeMultiplier={5 / 6} />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="mb-2 text-sm text-gray-400">Size: 1</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.STANDARD} sizeMultiplier={1} />
            </div>
            <div className="mb-6 hidden lg:block" style={{ fontSize: `${4 / 3}em` }}>
              <p className="mb-2 text-sm text-gray-400">Size: 4/3</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.STANDARD} sizeMultiplier={4 / 3} />
            </div>
          </div>
        </Example>
      </div>

      <div className="mb-6">
        <Example title="Size Multipliers (Detail View)">
          <div className="flex flex-wrap items-start gap-8 pb-6">
            <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Size: 1/2</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.DETAIL} sizeMultiplier={1 / 2} />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Size: 3/4</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.DETAIL} sizeMultiplier={3 / 4} />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="mb-2 text-sm text-gray-400">Size: 5/6</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.DETAIL} sizeMultiplier={5 / 6} />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="mb-2 text-sm text-gray-400">Size: 1</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.DETAIL} sizeMultiplier={1} />
            </div>
            <div className="mb-6 hidden lg:block" style={{ fontSize: `${4 / 3}em` }}>
              <p className="mb-2 text-sm text-gray-400">Size: 4/3</p>
              <CollectionCard collection={collectionData} bookshelfView={BookshelfView.DETAIL} sizeMultiplier={4 / 3} />
            </div>
          </div>
        </Example>
      </div>
    </ComponentExamples>
  )
}
