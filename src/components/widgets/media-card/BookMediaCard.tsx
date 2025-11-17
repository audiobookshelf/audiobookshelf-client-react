'use client'

import type { LibraryItem } from '@/types/api'
import { useMemo } from 'react'
import LazyLibraryItemCard, { type LazyLibraryItemCardProps } from './LazyLibraryItemCard'

export type BookMediaCardProps = LazyLibraryItemCardProps

/**
 * Book-specific media card with book-specific badges and overlays.
 */
export default function BookMediaCard(props: BookMediaCardProps) {
  const { libraryItem } = props
  const media = libraryItem.media as LibraryItem['media']

  const collapsedSeries = useMemo(
    () =>
      (
        libraryItem as {
          collapsedSeries?: {
            id: string
            name?: string
            nameIgnorePrefix?: string
            numBooks?: number
            seriesSequenceList?: string
          }
        }
      ).collapsedSeries,
    [libraryItem]
  )

  const seriesSequence = useMemo(() => {
    const metadata = media.metadata as { series?: Array<{ sequence?: string }> }
    return metadata.series?.[0]?.sequence || null
  }, [media.metadata])

  const booksInSeries = useMemo(() => collapsedSeries?.numBooks || 0, [collapsedSeries])
  const seriesSequenceList = useMemo(() => collapsedSeries?.seriesSequenceList || null, [collapsedSeries])
  const ebookFormat = useMemo(() => (media as { ebookFormat?: string }).ebookFormat, [media])
  const seriesName = useMemo(() => {
    if (collapsedSeries?.name) return collapsedSeries.name
    const metadata = media.metadata as { series?: Array<{ name?: string }> }
    return metadata.series?.[0]?.name || null
  }, [collapsedSeries, media.metadata])

  const renderBadges = useMemo(() => {
    const BookBadges = ({ isHovering, isSelectionMode }: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => {
      // Series sequence list badge (brown background, highest priority)
      if (seriesSequenceList) {
        return (
          <div
            cy-id="seriesSequenceList"
            className="absolute rounded-lg bg-black/90 box-shadow-md z-20 text-end top-[0.375em] end-[0.375em]"
            style={{ padding: `0.1em 0.25em`, backgroundColor: '#78350f' }}
          >
            <p style={{ fontSize: `${0.8}em` }}>#{seriesSequenceList}</p>
          </div>
        )
      }

      // Books in series badge (gold background)
      if (booksInSeries) {
        return (
          <div
            cy-id="booksInSeries"
            className="absolute rounded-lg bg-black/90 box-shadow-md z-20 top-[0.375em] end-[0.375em]"
            style={{ padding: `0.1em 0.25em`, backgroundColor: '#cd9d49dd' }}
          >
            <p style={{ fontSize: `${0.8}em` }}>{booksInSeries}</p>
          </div>
        )
      }

      // Series sequence badge (regular, when not hovering/selecting)
      if (seriesSequence && !isHovering && !isSelectionMode) {
        return (
          <div
            cy-id="seriesSequence"
            className="absolute rounded-lg bg-black/90 box-shadow-md z-10 top-[0.375em] end-[0.375em]"
            style={{ padding: `0.1em 0.25em` }}
          >
            <p style={{ fontSize: `${0.8}em` }}>#{seriesSequence}</p>
          </div>
        )
      }

      return null
    }
    BookBadges.displayName = 'BookBadges'
    return BookBadges
  }, [booksInSeries, seriesSequence, seriesSequenceList])

  const renderOverlayBadges = useMemo(() => {
    const BookOverlayBadges = () => {
      // Ebook format badge at bottom-left of overlay
      if (ebookFormat) {
        return (
          <div cy-id="ebookFormat" className="absolute bottom-[0.375em] start-[0.375em]">
            <span className="text-white/80" style={{ fontSize: `${0.8}em` }}>
              {ebookFormat}
            </span>
          </div>
        )
      }
      return null
    }
    BookOverlayBadges.displayName = 'BookOverlayBadges'
    return BookOverlayBadges
  }, [ebookFormat])

  const renderSeriesNameOverlay = useMemo(() => {
    const BookSeriesNameOverlay = (isHovering: boolean) => {
      // Series name overlay when hovering over collapsed series
      if (booksInSeries && libraryItem && isHovering && seriesName) {
        return (
          <div
            cy-id="seriesNameOverlay"
            className="w-full h-full absolute top-0 start-0 z-10 bg-black/60 rounded-sm flex items-center justify-center"
            style={{ padding: `${1}em` }}
          >
            <p className="text-gray-200 text-center" style={{ fontSize: `${1.1}em` }}>
              {seriesName}
            </p>
          </div>
        )
      }
      return null
    }
    BookSeriesNameOverlay.displayName = 'BookSeriesNameOverlay'
    return BookSeriesNameOverlay
  }, [booksInSeries, libraryItem, seriesName])

  return (
    <LazyLibraryItemCard {...props} renderBadges={renderBadges} renderOverlayBadges={renderOverlayBadges} renderSeriesNameOverlay={renderSeriesNameOverlay} />
  )
}
