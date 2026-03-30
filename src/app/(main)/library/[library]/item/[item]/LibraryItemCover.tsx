'use client'

import RawCoverPreviewModal from '@/components/modals/RawCoverPreviewModal'
import IconBtn from '@/components/ui/IconBtn'
import MediaCardCover from '@/components/widgets/media-card/MediaCardCover'
import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaOverlayIconBtn from '@/components/widgets/media-card/MediaOverlayIconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getCoverAspectRatio, getLibraryItemCoverUrl, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { computeProgress } from '@/lib/mediaProgress'
import { mergeClasses } from '@/lib/merge-classes'
import type { BookLibraryItem, BookMetadata, LibraryItem, MediaProgress, PodcastLibraryItem } from '@/types/api'
import { isPodcastLibraryItem } from '@/types/api'
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

  const isPodcast = isPodcastLibraryItem(libraryItem)
  const mediaMetadata = libraryItem.media.metadata

  const title = mediaMetadata.title || ''
  const author = isPodcast ? mediaMetadata.author : (mediaMetadata as BookMetadata).authorName || ''
  const titleCleaned = !title ? '' : title.length > 60 ? `${title.slice(0, 57)}...` : title
  const authorCleaned = !author ? '' : author.length > 30 ? `${author.slice(0, 27)}...` : author

  const coverAspect = getCoverAspectRatio(coverAspectRatio ?? 1)
  const coverPath = libraryItem.media?.coverPath

  const { percent: userProgressPercent, isFinished: itemIsFinished } = useMemo(
    () => computeProgress({ progress: mediaProgress, useSeriesProgress: false }),
    [mediaProgress]
  )

  const rawCoverUrl = useMemo(() => {
    if (!coverPath) return getPlaceholderCoverUrl()
    return getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true)
  }, [coverPath, libraryItem.id, libraryItem.updatedAt])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  const handleCoverClick = useCallback(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return
    if (!coverPath) return
    setShowPreviewModal(true)
  }, [coverPath])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        if (window.matchMedia('(max-width: 768px)').matches) return
        if (!coverPath) return
        setShowPreviewModal(true)
      }
    },
    [coverPath]
  )

  const showOverlay = isHovering

  return (
    <>
      <MediaCardFrame
        width="100%"
        height="auto"
        aspectRatio={1 / coverAspect}
        className={mergeClasses('group', className)}
        onClick={coverPath ? handleCoverClick : undefined}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        cover={
          <MediaCardCover
            libraryItem={libraryItem as LibraryItem}
            coverAspect={coverAspect}
            placeholderUrl={getPlaceholderCoverUrl()}
            hasCover={!!coverPath}
            title={title}
            titleCleaned={titleCleaned}
            authorCleaned={authorCleaned}
            isPodcast={isPodcast}
            userProgressPercent={userProgressPercent}
            itemIsFinished={itemIsFinished}
          />
        }
        overlay={
          <div
            className={mergeClasses(
              'absolute inset-0 bg-black/40 transition-opacity duration-200 z-10',
              showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
            )}
          >
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
        }
      />

      <RawCoverPreviewModal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} coverUrl={rawCoverUrl} />
    </>
  )
}
