'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import MediaCardMoreMenu, { MediaCardMoreMenuItem } from '@/components/widgets/media-card/MediaCardMoreMenu'
import MediaOverlayIconBtn from '@/components/widgets/media-card/MediaOverlayIconBtn'
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
  isHovering: boolean
  isSelectionMode: boolean
  selected: boolean
  processing: boolean
  isPending: boolean
  isMoreMenuOpen: boolean
  showPlayButton: boolean
  showReadButton: boolean
  userCanUpdate: boolean
  playIconFontSize: number
  moreMenuItems: MediaCardMoreMenuItem[]
  rssFeed: RssFeed | null
  mediaItemShare: MediaItemShare | null
  showError: boolean
  errorText: string
  isAuthorBookshelfView?: boolean
  renderOverlayBadges?: () => ReactNode
  renderBadges?: (props: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => ReactNode
  renderSeriesNameOverlay?: (isHovering: boolean) => ReactNode
  onPlay: () => void
  onRead: () => void
  onEdit?: () => void
  onMoreAction: (action: string, data?: Record<string, string>) => void
  onMoreMenuOpenChange: (isOpen: boolean) => void
  onSelect?: (event: React.MouseEvent) => void
}

export default function MediaCardOverlay({
  isHovering,
  isSelectionMode,
  selected,
  processing,
  isPending,
  isMoreMenuOpen,
  showPlayButton,
  showReadButton,
  userCanUpdate,
  playIconFontSize,
  moreMenuItems,
  rssFeed,
  mediaItemShare,
  showError,
  errorText,
  isAuthorBookshelfView = false,
  renderOverlayBadges,
  renderBadges,
  renderSeriesNameOverlay,
  onPlay,
  onRead,
  onEdit,
  onMoreAction,
  onMoreMenuOpenChange,
  onSelect
}: MediaCardOverlayProps) {
  const showOverlay = (isHovering || isSelectionMode || isMoreMenuOpen) && !processing

  const t = useTypeSafeTranslations()

  const isProcessingOrPending = useMemo(() => processing || isPending, [processing, isPending])

  const overlayWrapperClasslist = useMemo(
    () => mergeClasses(isSelectionMode ? 'bg-black/60' : 'bg-black/40', selected && 'border-2 border-yellow-400'),
    [isSelectionMode, selected]
  )

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
        <div cy-id="overlay" className={mergeClasses('w-full h-full absolute top-0 start-0 z-10 bg-black rounded-sm md:block', overlayWrapperClasslist)}>
          {/* Play button */}
          {showPlayButton && (
            <div cy-id="playButton" className="h-full flex items-center justify-center pointer-events-none">
              <IconBtn
                borderless
                outlined={false}
                className={mergeClasses('hover:text-white text-gray-200 hover:scale-110', 'transform duration-200 pointer-events-auto w-auto h-auto')}
                onClick={handlePlayClick}
                ariaLabel={t('ButtonPlay')}
                style={playButtonStyle}
              >
                play_arrow
              </IconBtn>
            </div>
          )}

          {/* Read button */}
          {showReadButton && (
            <div cy-id="readButton" className="h-full flex items-center justify-center pointer-events-none">
              <IconBtn
                borderless
                className={mergeClasses('hover:text-white text-gray-200 hover:scale-110', 'transform duration-200 pointer-events-auto w-auto h-auto')}
                onClick={handleReadClick}
                ariaLabel={t('ButtonRead')}
                style={playButtonStyle}
              >
                auto_stories
              </IconBtn>
            </div>
          )}

          {/* Select button */}
          {!isAuthorBookshelfView && (
            <MediaOverlayIconBtn
              cyId="selectedRadioButton"
              position="top-start"
              icon={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
              onClick={handleSelectClick}
              ariaLabel={selected ? t('ButtonDeselect') : t('ButtonSelect')}
              selected={selected}
            />
          )}

          {/* Edit button */}
          {userCanUpdate && !isSelectionMode && (
            <MediaOverlayIconBtn
              cyId="editButton"
              position="top-end"
              icon="edit"
              onClick={handleEditClick}
              ariaLabel={t('ButtonEdit')}
            />
          )}

          {/* More menu icon */}
          {!isSelectionMode && moreMenuItems.length > 0 && (
            <div
              cy-id="moreButton"
              className={mergeClasses(
                'md:block absolute cursor-pointer bottom-[0.375em] end-[0.375em]',
                'hover:[&_.material-symbols]:!text-yellow-300 hover:scale-125'
              )}
            >
              <MediaCardMoreMenu items={moreMenuItems} processing={isProcessingOrPending} onAction={onMoreAction} onOpenChange={onMoreMenuOpenChange} />
            </div>
          )}

          {/* Overlay badges (e.g., ebook format) */}
          {safeRender(renderOverlayBadges, 'Error rendering overlay badges:')}
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div cy-id="loadingSpinner" className="w-full h-full absolute top-0 start-0 z-10 bg-black/40 rounded-sm flex items-center justify-center">
          <LoadingSpinner size="la-lg" />
        </div>
      )}

      {/* Error tooltip */}
      {showError && (
        <Tooltip text={errorText} position="right" usePortal className="absolute bottom-4 start-0 z-10" tooltipClassName="whitespace-nowrap">
          <div
            className={mergeClasses('bg-error rounded-r-full shadow-md flex items-center justify-end', 'border-r border-b border-red-300')}
            style={errorBadgeStyle}
          >
            <span className="material-symbols text-red-100 pr-1" style={errorIconStyle}>
              priority_high
            </span>
          </div>
        </Tooltip>
      )}

      {/* RSS feed & share icons */}
      {rssFeed && !isSelectionMode && !isHovering && (
        <div
          cy-id="rssFeed"
          className={mergeClasses('absolute top-[0.375em] start-[0.375em] z-10', 'bg-black/40 rounded-full flex items-center justify-center shadow-sm')}
          style={iconBadgeStyle}
        >
          <span className="material-symbols text-orange-500" aria-hidden="true" style={iconStyle}>
            rss_feed
          </span>
        </div>
      )}
      {mediaItemShare && !isSelectionMode && !isHovering && (
        <div
          cy-id="mediaItemShare"
          className={mergeClasses('absolute start-[0.375em] z-10', 'bg-black/40 rounded-full flex items-center justify-center shadow-sm')}
          style={shareIconStyle}
        >
          <span className="material-symbols text-green-500" aria-hidden="true" style={iconStyle}>
            public
          </span>
        </div>
      )}

      {/* Type-specific badges (books/podcasts) */}
      {safeRender(() => renderBadges?.({ isHovering, isSelectionMode, processing: isProcessingOrPending }), 'Error rendering badges:')}

      {/* Series name overlay */}
      {safeRender(() => renderSeriesNameOverlay?.(isHovering), 'Error rendering series name overlay:')}
    </>
  )
}
