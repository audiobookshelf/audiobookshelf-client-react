'use client'

import type { BookMedia } from '@/types/api'
import { useMemo } from 'react'
import MediaCard, { type MediaCardProps } from './MediaCard'

export type BookMediaCardProps = MediaCardProps

/**
 * Book-specific media card with book-specific badges and overlays.
 */
export default function BookMediaCard(props: BookMediaCardProps) {
  const { libraryItem } = props
  const media = libraryItem.media as BookMedia

  const seriesSequence = useMemo(() => {
    const metadata = media.metadata
    return metadata.series?.[0]?.sequence || null
  }, [media.metadata])

  const ebookFormat = useMemo(() => media.ebookFormat, [media])

  const renderBadges = useMemo(() => {
    const BookBadges = ({ isHovering, isSelectionMode, processing }: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => {
      // Series sequence badge (regular, when not hovering/selecting)
      if (seriesSequence && !isHovering && !isSelectionMode && !processing) {
        return (
          <div
            cy-id="seriesSequence"
            className="absolute rounded-lg bg-black/90 shadow-modal-content z-10 top-[0.375em] end-[0.375em]"
            style={{ padding: '0.1em 0.25em' }}
          >
            <p style={{ fontSize: '0.8em' }}>#{seriesSequence}</p>
          </div>
        )
      }

      return null
    }
    BookBadges.displayName = 'BookBadges'
    return BookBadges
  }, [seriesSequence])

  const renderOverlayBadges = useMemo(() => {
    const BookOverlayBadges = () => {
      // Ebook format badge at bottom-left of overlay
      if (ebookFormat) {
        return (
          <div cy-id="ebookFormat" className="absolute bottom-[0.375em] start-[0.375em]">
            <span className="text-white/80" style={{ fontSize: '0.8em' }}>
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

  return <MediaCard {...props} renderBadges={renderBadges} renderOverlayBadges={renderOverlayBadges} />
}
