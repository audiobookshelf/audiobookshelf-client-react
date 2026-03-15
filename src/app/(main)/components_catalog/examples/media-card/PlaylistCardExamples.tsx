'use client'

import PlaylistCard from '@/components/widgets/media-card/PlaylistCard'
import PlaylistCardSkeleton from '@/components/widgets/media-card/PlaylistCardSkeleton'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookshelfView, Playlist } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface PlaylistCardExamplesProps {
  playlistData: Playlist
}

export function PlaylistCardExamples({ playlistData }: PlaylistCardExamplesProps) {
  const { bookCoverAspectRatio } = useComponentsCatalog()
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
    [playlistData]
  )

  return (
    <ComponentExamples title="Playlist Cards">
      <ComponentInfo
        component="PlaylistCard / PlaylistCardSkeleton"
        description="Card component for displaying playlists with a 2x2 cover grid, edit button, and more-menu actions."
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
              <Code>sizeMultiplier</Code>?: number - Size multiplier for responsive sizing
            </li>
          </ul>
        </div>
      </ComponentInfo>

      <h3 id="playlist-card-examples" className="text-lg font-bold mb-4">
        Playlist: {playlistData.name}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title="Standard View">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">With Data</p>
              <div ref={standardCardRef}>
                <PlaylistCard playlist={playlistData} bookshelfView={BookshelfView.STANDARD} bookCoverAspectRatio={bookCoverAspectRatio ?? 1} />
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
              <div ref={standardSkeletonRef}>
                <PlaylistCardSkeleton bookshelfView={BookshelfView.STANDARD} bookCoverAspectRatio={bookCoverAspectRatio ?? 1} />
              </div>
            </div>
          </div>
          <DimensionComparison cardDimensions={standardCardDims} skeletonDimensions={standardSkeletonDims} />
        </Example>

        <Example title="Detail View">
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-400 mb-2">With Data</p>
              <div ref={detailCardRef}>
                <PlaylistCard playlist={playlistData} bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={bookCoverAspectRatio ?? 1} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
              <div ref={detailSkeletonRef}>
                <PlaylistCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={bookCoverAspectRatio ?? 1} />
              </div>
            </div>
          </div>
          <DimensionComparison cardDimensions={detailCardDims} skeletonDimensions={detailSkeletonDims} />
        </Example>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title="Empty Playlist">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: [] } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: [] } as Playlist}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
          </div>
        </Example>

        <Example title="Single Item Playlist">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 1) } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 1) } as Playlist}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title="Two Items (Checker Pattern)">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 2) } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 2) } as Playlist}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
          </div>
        </Example>

        <Example title="Three Items">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Standard View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 3) } as Playlist}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Detail View</p>
              <PlaylistCard
                playlist={{ ...playlistData, items: playlistData.items?.slice(0, 3) } as Playlist}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
              />
            </div>
          </div>
        </Example>
      </div>

      <Example title="Selection Mode">
        <div className="flex gap-4 flex-wrap">
          <PlaylistCard
            playlist={playlistData}
            bookshelfView={BookshelfView.STANDARD}
            bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
            isSelectionMode
            selected={false}
            showSelectedButton
            onSelect={(e) => console.log('Toggle selection', e)}
          />
          <PlaylistCard
            playlist={playlistData}
            bookshelfView={BookshelfView.STANDARD}
            bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
            isSelectionMode
            selected
            showSelectedButton
            onSelect={(e) => console.log('Toggle selection', e)}
          />
        </div>
      </Example>

      <div className="mb-6">
        <Example title="Size Multipliers (Standard View)">
          <div className="flex gap-8 flex-wrap items-start pb-6">
            <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={1 / 2}
              />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={3 / 4}
              />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={5 / 6}
              />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="text-sm text-gray-400 mb-2">Size: 1</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={1}
              />
            </div>
            <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
              <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.STANDARD}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={4 / 3}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="mb-6">
        <Example title="Size Multipliers (Detail View)">
          <div className="flex gap-8 flex-wrap items-start pb-6">
            <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={1 / 2}
              />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={3 / 4}
              />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={5 / 6}
              />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="text-sm text-gray-400 mb-2">Size: 1</p>
              <PlaylistCard playlist={playlistData} bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={bookCoverAspectRatio ?? 1} sizeMultiplier={1} />
            </div>
            <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
              <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
              <PlaylistCard
                playlist={playlistData}
                bookshelfView={BookshelfView.DETAIL}
                bookCoverAspectRatio={bookCoverAspectRatio ?? 1}
                sizeMultiplier={4 / 3}
              />
            </div>
          </div>
        </Example>
      </div>
    </ComponentExamples>
  )
}
