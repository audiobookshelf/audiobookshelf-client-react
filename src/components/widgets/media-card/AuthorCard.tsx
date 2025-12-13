'use client'

import AuthorImage from '@/components/covers/AuthorImage'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import MediaCardFrame from '@/components/widgets/media-card/MediaCardFrame'
import MediaCardOverlayContainer from '@/components/widgets/media-card/MediaCardOverlayContainer'
import MediaOverlayIconBtn from '@/components/widgets/media-card/MediaOverlayIconBtn'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Author } from '@/types/api'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useId, useState } from 'react'

export interface AuthorCardProps {
  /** The author to display */
  author: Author
  /** Cover configuration */
  sizeMultiplier?: number
  /** User permissions */
  userCanUpdate?: boolean
  /** Whether the card is in selection mode */
  isSelectionMode?: boolean
  /** Whether the card is currently selected */
  selected?: boolean
  /** Whether the card is currently searching (Quick Match in progress) */
  isSearching?: boolean
  /** Callback when the select button is clicked */
  onSelect?: (event: React.MouseEvent) => void
  /** Callback when the edit button is clicked */
  onEdit?: (author: Author) => void
  /** Callback when the quick match button is clicked */
  onQuickMatch?: (author: Author) => void
}

function AuthorCard(props: AuthorCardProps) {
  const {
    author,
    sizeMultiplier,
    userCanUpdate = false,
    isSelectionMode = false,
    selected = false,
    isSearching = false,
    onSelect,
    onEdit,
    onQuickMatch
  } = props

  const router = useRouter()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const cardId = useId()
  const t = useTypeSafeTranslations()

  const [isHovering, setIsHovering] = useState(false)

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  // Cover dimensions - author card is portrait (width = height * 0.8)
  const coverHeight = 192 * effectiveSizeMultiplier
  const coverWidth = coverHeight * 0.8

  // Display values
  const displayName = author.name || '\u00A0'
  const numBooks = author.numBooks || 0

  const showOverlay = (isHovering || isSelectionMode) && !isSearching

  const handleCardClick = useCallback(() => {
    if (!isSearching) {
      router.push(`/author/${author.id}`)
    }
  }, [author.id, isSearching, router])

  const handleEditClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onEdit?.(author)
    },
    [author, onEdit]
  )

  const handleQuickMatchClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onQuickMatch?.(author)
    },
    [author, onQuickMatch]
  )

  const handleSelectClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onSelect?.(event)
    },
    [onSelect]
  )

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardClick()
    }
  }

  return (
    <MediaCardFrame
      width={coverWidth}
      height={coverHeight}
      onClick={!isSearching ? handleCardClick : undefined}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      cardId={cardId}
      cy-id="authorCard"
      cover={<AuthorImage author={author} />}
      overlay={
        <>
          {/* Permanent author name & num books overlay */}
          {!isSearching && (
            <div cy-id="textInline" className="absolute bottom-0 start-0 w-full bg-black/60 z-10 px-2 py-1">
              <p className="text-center font-semibold truncate text-[0.75em]">{displayName}</p>
              <p className="text-center text-gray-200 text-[0.65em]">
                {numBooks} {t('LabelBooks')}
              </p>
            </div>
          )}

          {/* Hover overlay with dark semi-transparent background */}
          {showOverlay && (
            <MediaCardOverlayContainer isSelectionMode={isSelectionMode} selected={selected}>
              {/* Selection button */}
              {isSelectionMode && (
                <MediaOverlayIconBtn
                  cyId="selectButton"
                  position="top-start"
                  icon={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                  onClick={handleSelectClick}
                  ariaLabel={selected ? t('ButtonDeselect') : t('ButtonSelect')}
                  selected={selected}
                />
              )}

              {/* Quick Match button (top-left) */}
              {!isSelectionMode && userCanUpdate && (
                <MediaOverlayIconBtn
                  cyId="quickMatch"
                  position="top-start"
                  icon="search"
                  onClick={handleQuickMatchClick}
                  ariaLabel={t('ButtonQuickMatch')}
                />
              )}

              {/* Edit button (top-right) */}
              {!isSelectionMode && userCanUpdate && (
                <MediaOverlayIconBtn
                  cyId="editButton"
                  position="top-end"
                  icon="edit"
                  onClick={handleEditClick}
                  ariaLabel={t('ButtonEdit')}
                />
              )}
            </MediaCardOverlayContainer>
          )}

          {/* Loading spinner overlay (Quick Match in progress) */}
          {isSearching && (
            <div
              cy-id="spinner"
              className="absolute top-0 start-0 z-30 w-full h-full bg-black/50 flex items-center justify-center"
              role="status"
              aria-label={t('MessageLoading')}
            >
              <LoadingSpinner />
            </div>
          )}
        </>
      }
    />
  )
}

/**
 * Memoized AuthorCard component to prevent unnecessary re-renders.
 */
const MemoizedAuthorCard = memo(AuthorCard)

export { MemoizedAuthorCard as AuthorCard }

export default MemoizedAuthorCard
