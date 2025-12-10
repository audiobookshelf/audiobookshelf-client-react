'use client'

import PlaylistCard from '@/components/widgets/media-card/PlaylistCard'
import PlaylistCardSkeleton from '@/components/widgets/media-card/PlaylistCardSkeleton'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookLibraryItem, BookshelfView, Playlist } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface PlaylistCardExamplesProps {
  playlistData: Playlist
  /** All books from search results for creating varied playlist examples */
  allBooks?: BookLibraryItem[]
}

export function PlaylistCardExamples({ playlistData, allBooks = [] }: PlaylistCardExamplesProps) {
  const { bookCoverAspectRatio } = useComponentsCatalog()

  // Refs for dimension checking
  const playlistStandardCardRef = useRef<HTMLDivElement>(null)
  const playlistStandardSkeletonRef = useRef<HTMLDivElement>(null)
  const playlistDetailCardRef = useRef<HTMLDivElement>(null)
  const playlistDetailSkeletonRef = useRef<HTMLDivElement>(null)

  // State for dimensions
  const [playlistStandardCardDims, setPlaylistStandardCardDims] = useState<Dimensions | null>(null)
  const [playlistStandardSkeletonDims, setPlaylistStandardSkeletonDims] = useState<Dimensions | null>(null)
  const [playlistDetailCardDims, setPlaylistDetailCardDims] = useState<Dimensions | null>(null)
  const [playlistDetailSkeletonDims, setPlaylistDetailSkeletonDims] = useState<Dimensions | null>(null)

  // Measure dimensions
  useDimensionMeasurement(
    [
      { ref: playlistStandardCardRef, setDims: setPlaylistStandardCardDims },
      { ref: playlistStandardSkeletonRef, setDims: setPlaylistStandardSkeletonDims },
      { ref: playlistDetailCardRef, setDims: setPlaylistDetailCardDims },
      { ref: playlistDetailSkeletonRef, setDims: setPlaylistDetailSkeletonDims }
    ],
    [playlistData]
  )

  return (
    <ComponentExamples title="Playlist Cards">
      <ComponentInfo
        component="PlaylistCard / PlaylistCardSkeleton"
        description="Card component for displaying playlists. Shows item covers in a 2x2 grid layout (up to 4 covers), edit button, and more menu with delete action. Playlists are user-owned and private."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import PlaylistCard from &apos;@/components/widgets/media-card/PlaylistCard&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>playlist</Code>: Playlist - The playlist to display
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
          </ul>
        </div>
      </ComponentInfo>

      <h3 id="playlist-card-examples" className="text-lg font-bold mb-4">
        Playlist: {playlistData.name}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title={`Standard View`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">With Data</p>
              <div ref={playlistStandardCardRef}>
                <PlaylistCard
                  playlist={playlistData}
                  bookshelfView={BookshelfView.STANDARD}
                  bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                  userCanUpdate={true}
                  userCanDelete={true}
                />
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
              <div ref={playlistStandardSkeletonRef}>
                <PlaylistCardSkeleton bookshelfView={BookshelfView.STANDARD} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
              </div>
            </div>
          </div>
          <DimensionComparison cardDimensions={playlistStandardCardDims} skeletonDimensions={playlistStandardSkeletonDims} />
        </Example>

        <Example title={`Detail View`}>
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-400 mb-2">With Data</p>
              <div ref={playlistDetailCardRef}>
                <PlaylistCard
                  playlist={playlistData}
                  bookshelfView={BookshelfView.DETAIL}
                  bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                  userCanUpdate={true}
                  userCanDelete={true}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
              <div ref={playlistDetailSkeletonRef}>
                <PlaylistCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6} />
              </div>
            </div>
          </div>
          <DimensionComparison cardDimensions={playlistDetailCardDims} skeletonDimensions={playlistDetailSkeletonDims} />
        </Example>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title={`Empty Playlist`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: [] } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: [] } as Playlist}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
          </div>
        </Example>

        <Example title={`Single Item Playlist`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 1) } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 1) } as Playlist}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title={`Two Items (Checker Pattern)`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 2) } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 2) } as Playlist}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
          </div>
        </Example>

        <Example title={`Three Items`}>
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 3) } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                userCanUpdate={true}
                userCanDelete={true}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 3) } as Playlist}
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
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1 / 2}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={3 / 4}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={5 / 6}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="text-sm text-gray-400 mb-2">Size: 1</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1}
                userCanUpdate={true}
              />
            </div>
            <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
              <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
              <PlaylistCard
                playlist={playlistData}
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
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1 / 2}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={3 / 4}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={5 / 6}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="text-sm text-gray-400 mb-2">Size: 1</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1.6}
                sizeMultiplier={1}
                userCanUpdate={true}
              />
            </div>
            <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
              <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
              <PlaylistCard
                playlist={playlistData}
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
