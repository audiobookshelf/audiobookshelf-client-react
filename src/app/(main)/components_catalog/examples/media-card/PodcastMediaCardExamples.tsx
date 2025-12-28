'use client'

import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookshelfView, EReaderDevice, PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface PodcastMediaCardExamplesProps {
  selectedPodcast: PodcastLibraryItem
}

export function PodcastMediaCardExamples({ selectedPodcast }: PodcastMediaCardExamplesProps) {
  const { user, bookCoverAspectRatio } = useComponentsCatalog()

  // Selection state
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null)
  const [isPodcastSelectionMode, setIsPodcastSelectionMode] = useState(false)

  // Default props for media cards
  const defaultProps = {
    bookshelfView: BookshelfView.STANDARD,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    userPermissions: user.permissions,
    ereaderDevices: [] as EReaderDevice[],
    showSubtitles: false,
    bookCoverAspectRatio: bookCoverAspectRatio ?? 1.6
  }

  // Selection handler
  const handlePodcastSelect = () => {
    const isCurrentlySelected = selectedPodcastId === selectedPodcast.id
    setSelectedPodcastId(isCurrentlySelected ? null : selectedPodcast.id)
    setIsPodcastSelectionMode(!isCurrentlySelected)
  }

  // Refs for dimension checking
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
  useDimensionMeasurement(
    [
      { ref: podcastStandardCardRef, setDims: setPodcastStandardCardDims },
      { ref: podcastStandardSkeletonRef, setDims: setPodcastStandardSkeletonDims },
      { ref: podcastDetailCardRef, setDims: setPodcastDetailCardDims },
      { ref: podcastDetailSkeletonRef, setDims: setPodcastDetailSkeletonDims },
      { ref: podcastDetailNoSubCardRef, setDims: setPodcastDetailNoSubCardDims },
      { ref: podcastDetailNoSubSkeletonRef, setDims: setPodcastDetailNoSubSkeletonDims },
      { ref: podcastDetailOrderByCardRef, setDims: setPodcastDetailOrderByCardDims },
      { ref: podcastDetailOrderBySkeletonRef, setDims: setPodcastDetailOrderBySkeletonDims },
      { ref: podcastRecentEpisodeCardRef, setDims: setPodcastRecentEpisodeCardDims },
      { ref: podcastRecentEpisodeSkeletonRef, setDims: setPodcastRecentEpisodeSkeletonDims },
      { ref: podcastRssFeedCardRef, setDims: setPodcastRssFeedCardDims },
      { ref: podcastRssFeedSkeletonRef, setDims: setPodcastRssFeedSkeletonDims },
      { ref: podcastNumEpisodesCardRef, setDims: setPodcastNumEpisodesCardDims },
      { ref: podcastNumEpisodesSkeletonRef, setDims: setPodcastNumEpisodesSkeletonDims },
      { ref: podcastNumEpisodesIncompleteCardRef, setDims: setPodcastNumEpisodesIncompleteCardDims },
      { ref: podcastNumEpisodesIncompleteSkeletonRef, setDims: setPodcastNumEpisodesIncompleteSkeletonDims }
    ],
    [selectedPodcast]
  )

  return (
    <ComponentExamples title="Podcast Media Cards">
      <ComponentInfo
        component="PodcastMediaCard / PodcastEpisodeCard / MediaCardSkeleton"
        description="Media card components for displaying podcasts in the bookshelf. PodcastMediaCard displays podcasts with podcast-specific badges. PodcastEpisodeCard displays a specific podcast episode. MediaCardSkeleton provides a loading state."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <Code overflow>import PodcastMediaCard from &apos;@/components/widgets/media-card/PodcastMediaCard&apos;</Code>
          <br />
          <Code overflow>import PodcastEpisodeCard from &apos;@/components/widgets/media-card/PodcastEpisodeCard&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The library item to display (PodcastLibraryItem).
            </li>
            <li>
              <Code>bookshelfView</Code>: View mode (BookshelfView.STANDARD or BookshelfView.DETAIL).
            </li>
            <li>
              <Code>bookCoverAspectRatio</Code>: Aspect ratio for covers.
            </li>
            <li>
              <Code>sizeMultiplier</Code>: Size multiplier for the card.
            </li>
          </ul>
        </div>
      </ComponentInfo>

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
    </ComponentExamples>
  )
}
