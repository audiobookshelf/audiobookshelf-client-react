'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import RawCoverPreviewModal from '@/components/modals/RawCoverPreviewModal'
import IconBtn from '@/components/ui/IconBtn'
import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaOverlayIconBtn from '@/components/widgets/media-card/MediaOverlayIconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getCoverAspectRatio, getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { BookLibraryItem, MediaProgress, PodcastLibraryItem } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

interface LibraryItemCoverProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  coverAspectRatio?: 0 | 1
  canUpdate?: boolean
  onEdit?: () => void
  mediaProgress?: MediaProgress | null
  className?: string
}

export default function LibraryItemCover({ libraryItem, coverAspectRatio, canUpdate = false, className, mediaProgress, onEdit }: LibraryItemCoverProps) {
  const t = useTypeSafeTranslations()
  const [isHovering, setIsHovering] = useState(false)

  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const aspectRatio = getCoverAspectRatio(coverAspectRatio)
  const coverUrl = getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt)
  const rawCoverUrl = getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true)

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  const handleCoverClick = useCallback(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return
    setShowPreviewModal(true)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      if (window.matchMedia('(max-width: 768px)').matches) return
      setShowPreviewModal(true)
    }
  }, [])

  const progressPercent = useMemo(() => {
    if (!mediaProgress) return 0
    if (libraryItem.mediaType === 'book' && mediaProgress.ebookProgress && mediaProgress.ebookProgress > 0) {
      return Math.max(Math.min(1, mediaProgress.ebookProgress), 0)
    }
    return Math.max(Math.min(1, mediaProgress.progress || 0), 0)
  }, [mediaProgress, libraryItem.mediaType])

  const progressBarWidth = `${Math.round(progressPercent * 100)}%`
  const isFinished = mediaProgress?.isFinished || false

  const showOverlay = isHovering

  return (
    <>
      <MediaCardFrame
        width="100%"
        height="auto"
        aspectRatio={1 / aspectRatio}
        className={mergeClasses('group', className)}
        onClick={handleCoverClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        cover={<PreviewCover src={coverUrl} fill bookCoverAspectRatio={aspectRatio} showResolution={false} />}
        overlay={
          <>
            {/* Progress Bar Overlay - Always visible if progress exists */}
            {progressPercent > 0 && (
              <div className="absolute bottom-0 left-0 h-1.5 bg-bg/40 w-full overflow-hidden z-20">
                <div className={`h-full ${isFinished ? 'bg-success' : 'bg-yellow-400'} transition-all duration-300`} style={{ width: progressBarWidth }} />
              </div>
            )}

            {/* Action Overlay */}
            {/* We use opacity to transition, but pointer-events to disable clicks when hidden */}
            <div
              className={mergeClasses(
                'absolute inset-0 bg-black/40 transition-opacity duration-200 z-10',
                showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
              )}
            >
              {/* Play Button - Centered */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <IconBtn
                  borderless
                  outlined={false}
                  className="hover:text-white text-gray-200 hover:scale-110 transform duration-200 pointer-events-auto"
                  style={{ fontSize: '4rem' }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Implementation pending
                  }}
                  ariaLabel={t('ButtonPlay')}
                >
                  play_arrow
                </IconBtn>
              </div>

              {/* Edit Button - Bottom Right */}
              {canUpdate && onEdit && (
                <MediaOverlayIconBtn
                  position="bottom-end"
                  icon="edit"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit()
                  }}
                  ariaLabel={t('ButtonEdit')}
                />
              )}
            </div>
          </>
        }
      />

      <RawCoverPreviewModal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} coverUrl={rawCoverUrl} />
    </>
  )
}
