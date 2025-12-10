'use client'

import IconBtn from '@/components/ui/IconBtn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaCardMoreMenu from '@/components/widgets/media-card/MediaCardMoreMenu'
import PlaylistGroupCover from '@/components/widgets/media-card/PlaylistGroupCover'
import { usePlaylistCardActions } from '@/components/widgets/media-card/usePlaylistCardActions'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { Playlist } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useId, useMemo, useState } from 'react'
import LoadingSpinner from '../LoadingSpinner'

export interface PlaylistCardProps {
  /** The playlist to display */
  playlist: Playlist
  /** View mode (standard or detail) */
  bookshelfView: BookshelfView
  /** Cover configuration */
  bookCoverAspectRatio?: number
  sizeMultiplier?: number
  /** User permissions */
  userCanUpdate?: boolean
  userCanDelete?: boolean
  /** Whether the card is in selection mode */
  isSelectionMode?: boolean
  /** Whether the card is currently selected */
  selected?: boolean
  /** Callback when the select button is clicked */
  onSelect?: (event: React.MouseEvent) => void
  /** Callback when the edit button is clicked */
  onEdit?: (playlist: Playlist) => void
}

function PlaylistCard(props: PlaylistCardProps) {
  const {
    playlist,
    bookshelfView,
    bookCoverAspectRatio = 1,
    sizeMultiplier,
    userCanUpdate = false,
    userCanDelete = false,
    isSelectionMode = false,
    selected = false,
    onSelect,
    onEdit
  } = props

  const router = useRouter()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const cardId = useId()
  const t = useTypeSafeTranslations()

  const [isHovering, setIsHovering] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const items = useMemo(() => playlist.items || [], [playlist.items])

  // Cover dimensions - playlist card is square (same width as height)
  const coverHeight = useMemo(() => 192 * effectiveSizeMultiplier, [effectiveSizeMultiplier])
  // Playlist card is square
  const coverWidth = useMemo(() => coverHeight, [coverHeight])

  // Label font size based on width
  const labelFontSize = useMemo(() => (coverWidth < 160 ? 0.75 : 0.9), [coverWidth])

  // Display title
  const displayTitle = useMemo(() => playlist.name || '\u00A0', [playlist.name])

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL

  const showOverlay = (isHovering || isSelectionMode || isMoreMenuOpen) && !false // not processing locally

  const handleCardClick = useCallback(() => {
    router.push(`/playlist/${playlist.id}`)
  }, [playlist.id, router])

  const handleEditClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onEdit?.(playlist)
    },
    [playlist, onEdit]
  )

  // Selection handler - kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onSelect?.(event)
    },
    [onSelect]
  )

  const handleMoreMenuOpenChange = useCallback((isOpen: boolean) => {
    setIsMoreMenuOpen(isOpen)
    if (!isOpen) {
      setIsHovering(false)
    }
  }, [])

  const { processing, confirmState, closeConfirm, handleMoreAction, moreMenuItems } = usePlaylistCardActions({
    playlist,
    userCanUpdate,
    userCanDelete
  })

  return (
    <>
      <MediaCardFrame
        width={coverWidth}
        height={coverHeight}
        onClick={!processing ? handleCardClick : undefined}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        cardId={cardId}
        cy-id="playlistCard"
        cover={<PlaylistGroupCover items={items} width={coverWidth} height={coverHeight} bookCoverAspectRatio={bookCoverAspectRatio} />}
        overlay={
          <>
            {/* Hover overlay */}
            {showOverlay && (
              <div
                cy-id="overlay"
                className={mergeClasses(
                  'w-full h-full absolute top-0 start-0 z-10 bg-black rounded-sm',
                  isSelectionMode ? 'bg-black/60' : 'bg-black/40',
                  selected && 'border-2 border-yellow-400'
                )}
              >
                {/* Edit button */}
                {userCanUpdate && !isSelectionMode && (
                  <div cy-id="editButton" className="absolute top-[0.375em] end-[0.375em]">
                    <IconBtn
                      borderless
                      size="small"
                      className={mergeClasses(
                        'text-gray-200 hover:not-disabled:text-yellow-300 hover:scale-125',
                        'transform duration-150 text-[1em] w-auto h-auto'
                      )}
                      onClick={handleEditClick}
                      ariaLabel={t('ButtonEdit')}
                    >
                      edit
                    </IconBtn>
                  </div>
                )}

                {/* More menu button */}
                {!isSelectionMode && moreMenuItems.length > 0 && (
                  <div
                    cy-id="moreButton"
                    className={mergeClasses(
                      'md:block absolute cursor-pointer bottom-[0.375em] end-[0.375em]',
                      'hover:[&_.material-symbols]:!text-yellow-300 hover:scale-125'
                    )}
                  >
                    <MediaCardMoreMenu items={moreMenuItems} processing={processing} onAction={handleMoreAction} onOpenChange={handleMoreMenuOpenChange} />
                  </div>
                )}
              </div>
            )}

            {/* Processing overlay */}
            {processing && (
              <div cy-id="loadingSpinner" className="w-full h-full absolute top-0 start-0 z-10 bg-black/40 rounded-sm flex items-center justify-center">
                <LoadingSpinner size="la-lg" />
              </div>
            )}
          </>
        }
        footer={
          isAlternativeBookshelfView ? (
            // Detail view footer
            <div cy-id="detailBottomText" className="relative z-30 start-0 end-0 mx-auto py-[0.25em] rounded-md text-center">
              <p cy-id="detailBottomDisplayTitle" className="truncate" style={{ fontSize: `${labelFontSize}em` }}>
                {displayTitle}
              </p>
            </div>
          ) : (
            // Standard view footer (shiny black placard)
            <div
              cy-id="standardBottomText"
              className={mergeClasses('categoryPlacard absolute z-10 start-0 end-0 mx-auto -bottom-[1.5em] h-[1.5em] rounded-md text-center')}
              style={{ width: `${Math.min(200, coverWidth)}px` }}
            >
              <div className="w-full h-full shinyBlack flex items-center justify-center rounded-xs border" style={{ padding: '0em 0.5em' }}>
                <p cy-id="standardBottomDisplayTitle" className="truncate" style={{ fontSize: `${labelFontSize}em` }}>
                  {displayTitle}
                </p>
              </div>
            </div>
          )
        }
      />

      {/* Confirm dialog for delete */}
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          message={confirmState.message}
          checkboxLabel={confirmState.checkboxLabel}
          yesButtonText={confirmState.yesButtonText}
          yesButtonClassName={confirmState.yesButtonClassName}
          onClose={closeConfirm}
          onConfirm={(value) => {
            confirmState.onConfirm(value)
          }}
        />
      )}
    </>
  )
}

/**
 * Memoized PlaylistCard component to prevent unnecessary re-renders.
 */
const MemoizedPlaylistCard = memo(PlaylistCard)

export { MemoizedPlaylistCard as PlaylistCard }

export default MemoizedPlaylistCard
