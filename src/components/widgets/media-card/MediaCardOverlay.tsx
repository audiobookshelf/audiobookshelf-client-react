'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import MediaCardMoreMenu, { MediaCardMoreMenuItem } from '@/components/widgets/media-card/MediaCardMoreMenu'
import MediaOverlayIconBtn from '@/components/widgets/media-card/MediaOverlayIconBtn'
import { isDragOnlyOverlay, useSortableBookshelfOverlay, type SortableBookshelfOverlayMode } from '@/contexts/SortableBookshelfOverlayContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { MediaItemShare, RssFeed } from '@/types/api'
import { useCallback, useMemo, type ReactNode } from 'react'

/**
 * Safely renders a render function with error boundary handling.
 * Prevents crashes from external render prop errors.
 */
function safeRender(fn: (() => ReactNode) | undefined, errorMessage: string): ReactNode {
  if (!fn) return null
  try {
    return fn()
  } catch (error) {
    console.error(errorMessage, error)
    return null
  }
}

// Layout constants
const ICON_SIZE = {
  SMALL: 1.5,
  ERROR_BADGE_HEIGHT: 1.5,
  ERROR_BADGE_WIDTH: 2.5,
  ERROR_ICON: 0.875
} as const

const SPACING = {
  CORNER: 0.375,
  RSS_SHARE_GAP: 2.125
} as const

interface MediaCardOverlayProps {
  cardId: string
  isHovering: boolean
  isSelectionMode: boolean
  selected: boolean
  processing: boolean
  isPending: boolean
  isMoreMenuOpen: boolean
  showPlayButton: boolean
  showReadButton: boolean
  isItemPlaying?: boolean
  showEditButton?: boolean
  playIconFontSize: number
  moreMenuItems: MediaCardMoreMenuItem[]
  rssFeed: RssFeed | null
  mediaItemShare: MediaItemShare | null
  showError: boolean
  errorText: string
  showSelectRadioButton?: boolean
  renderOverlayBadges?: () => ReactNode
  renderBadges?: (props: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => ReactNode
  renderSeriesNameOverlay?: (isHovering: boolean) => ReactNode
  onPlay: () => void
  onRead: () => void
  onEdit?: () => void
  onMoreAction: (action: string, data?: Record<string, string>) => void
  onMoreMenuOpenChange: (isOpen: boolean) => void
  onSelect?: (event: React.MouseEvent) => void
  dragHandle?: ReactNode
  /** When set, overrides context `overlayMode` for drag-only overlay behavior (e.g. drag-config `overlayMode`). */
  overlayModeOverride?: SortableBookshelfOverlayMode
}

export default function MediaCardOverlay({
  cardId,
  isHovering,
  isSelectionMode,
  selected,
  processing,
  isPending,
  isMoreMenuOpen,
  showPlayButton,
  showReadButton,
  isItemPlaying = false,
  showEditButton = true,
  playIconFontSize,
  moreMenuItems,
  rssFeed,
  mediaItemShare,
  showError,
  errorText,
  showSelectRadioButton = false,
  renderOverlayBadges,
  renderBadges,
  renderSeriesNameOverlay,
  onPlay,
  onRead,
  onEdit,
  onMoreAction,
  onMoreMenuOpenChange,
  onSelect,
  dragHandle,
  overlayModeOverride
}: MediaCardOverlayProps) {
  const { userCanUpdate } = useUser()
  const sortableBookshelfOverlay = useSortableBookshelfOverlay()
  const dragOnly = isDragOnlyOverlay(overlayModeOverride ?? sortableBookshelfOverlay?.overlayMode)

  const showOverlay = (isHovering || isSelectionMode || isMoreMenuOpen || dragOnly) && !processing

  const effectiveHovering = isHovering || dragOnly

  const t = useTypeSafeTranslations()

  const isProcessingOrPending = useMemo(() => processing || isPending, [processing, isPending])

  const overlayWrapperClasslist = useMemo(
    () => mergeClasses(isSelectionMode ? 'bg-black/60' : 'bg-black/40', selected && 'border-2 border-yellow-400'),
    [isSelectionMode, selected]
  )

  const overlayZIndexClass = selected ? 'z-30' : 'z-10'

  const playButtonStyle = useMemo(() => ({ fontSize: `${playIconFontSize}em` }), [playIconFontSize])

  const errorBadgeStyle = useMemo(() => ({ height: `${ICON_SIZE.ERROR_BADGE_HEIGHT}em`, width: `${ICON_SIZE.ERROR_BADGE_WIDTH}em` }), [])

  const errorIconStyle = useMemo(() => ({ fontSize: `${ICON_SIZE.ERROR_ICON}em` }), [])

  const iconBadgeStyle = useMemo(() => ({ width: `${ICON_SIZE.SMALL}em`, height: `${ICON_SIZE.SMALL}em` }), [])

  const iconStyle = useMemo(() => ({ fontSize: `1em` }), [])

  const shareIconStyle = useMemo(
    () => ({
      width: `${ICON_SIZE.SMALL}em`,
      height: `${ICON_SIZE.SMALL}em`,
      top: rssFeed ? `${SPACING.RSS_SHARE_GAP}em` : `${SPACING.CORNER}em`
    }),
    [rssFeed]
  )

  const handlePlayClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onPlay()
    },
    [onPlay]
  )

  const handleReadClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onRead()
    },
    [onRead]
  )

  const handleSelectClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onSelect?.(event)
    },
    [onSelect]
  )

  const handleEditClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onEdit?.()
    },
    [onEdit]
  )

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          cy-id="overlay"
          className={mergeClasses('absolute start-0 top-0 h-full w-full rounded-sm bg-black md:block', overlayZIndexClass, overlayWrapperClasslist)}
        >
          {/* Play button */}
          {!dragOnly && showPlayButton && (
            <div cy-id="playButton" className="pointer-events-none flex h-full items-center justify-center" data-overlay-action>
              <IconBtn
                borderless
                outlined={false}
                className={mergeClasses(
                  'text-gray-200 hover:scale-110 hover:not-disabled:text-white',
                  'pointer-events-auto h-auto w-auto transform duration-200'
                )}
                onClick={handlePlayClick}
                ariaLabel={isItemPlaying ? t('ButtonPlaying') : t('ButtonPlay')}
                style={playButtonStyle}
              >
                {isItemPlaying ? 'pause' : 'play_arrow'}
              </IconBtn>
            </div>
          )}

          {/* Read button */}
          {!dragOnly && showReadButton && (
            <div cy-id="readButton" className="pointer-events-none flex h-full items-center justify-center" data-overlay-action>
              <IconBtn
                borderless
                className={mergeClasses(
                  'text-gray-200 hover:scale-110 hover:not-disabled:text-white',
                  'pointer-events-auto h-auto w-auto transform duration-200'
                )}
                onClick={handleReadClick}
                ariaLabel={t('ButtonRead')}
                style={playButtonStyle}
              >
                auto_stories
              </IconBtn>
            </div>
          )}

          {/* Select button */}
          {showSelectRadioButton && (!dragOnly || isSelectionMode) && (
            <MediaOverlayIconBtn
              cyId="selectedRadioButton"
              position="top-start"
              icon={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
              onClick={handleSelectClick}
              ariaLabel={selected ? t('ButtonDeselect') : t('ButtonSelect')}
              selected={selected}
              tabIndex={-1}
            />
          )}

          {/* Edit button */}
          {!dragOnly && showEditButton && userCanUpdate && !isSelectionMode && (
            <MediaOverlayIconBtn cyId="editButton" position="top-end" icon="edit" onClick={handleEditClick} ariaLabel={t('ButtonEdit')} />
          )}

          {/* More menu icon */}
          {!dragOnly && !isSelectionMode && moreMenuItems.length > 0 && (
            <div
              cy-id="moreButton"
              className={mergeClasses(
                'absolute end-[0.375em] bottom-[0.375em] cursor-pointer md:block',
                'hover:scale-125 hover:[&_.material-symbols]:!text-yellow-300'
              )}
            >
              <MediaCardMoreMenu
                items={moreMenuItems}
                cardId={cardId}
                processing={isProcessingOrPending}
                isOpen={isMoreMenuOpen}
                onAction={onMoreAction}
                onOpenChange={onMoreMenuOpenChange}
              />
            </div>
          )}

          {/* Overlay badges (e.g., ebook format) */}
          {!dragOnly && safeRender(renderOverlayBadges, 'Error rendering overlay badges:')}

          {dragHandle}
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div cy-id="loadingSpinner" className="absolute start-0 top-0 z-10 flex h-full w-full items-center justify-center rounded-sm bg-black/40">
          <LoadingSpinner size="la-lg" />
        </div>
      )}

      {/* Error tooltip */}
      {showError && (
        <div className="absolute start-0 bottom-4 z-10">
          <Tooltip text={errorText} position="right">
            <div
              className={mergeClasses('bg-error flex items-center justify-end rounded-r-full shadow-md', 'border-r border-b border-red-300')}
              style={errorBadgeStyle}
            >
              <span className="material-symbols pr-1 text-red-100" style={errorIconStyle}>
                priority_high
              </span>
            </div>
          </Tooltip>
        </div>
      )}

      {/* RSS feed & share icons */}
      {rssFeed && !isSelectionMode && !effectiveHovering && (
        <div
          cy-id="rssFeed"
          className={mergeClasses('absolute start-[0.375em] top-[0.375em] z-10', 'flex items-center justify-center rounded-full bg-black/40 shadow-sm')}
          style={iconBadgeStyle}
        >
          <span className="material-symbols text-orange-500" aria-hidden="true" style={iconStyle}>
            rss_feed
          </span>
        </div>
      )}
      {mediaItemShare && !isSelectionMode && !effectiveHovering && (
        <div
          cy-id="mediaItemShare"
          className={mergeClasses('absolute start-[0.375em] z-10', 'flex items-center justify-center rounded-full bg-black/40 shadow-sm')}
          style={shareIconStyle}
        >
          <span className="material-symbols text-green-500" aria-hidden="true" style={iconStyle}>
            public
          </span>
        </div>
      )}

      {/* Type-specific badges (books/podcasts) */}
      {safeRender(() => renderBadges?.({ isHovering: effectiveHovering, isSelectionMode, processing: isProcessingOrPending }), 'Error rendering badges:')}

      {/* Series name overlay */}
      {safeRender(() => renderSeriesNameOverlay?.(effectiveHovering), 'Error rendering series name overlay:')}
    </>
  )
}
