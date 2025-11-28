'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import MediaCardMoreMenu, { MediaCardMoreMenuItem } from '@/components/widgets/media-card/MediaCardMoreMenu'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { MediaItemShare, RssFeed } from '@/types/api'
import { useCallback, useMemo, type ReactNode } from 'react'

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
  onMoreAction,
  onMoreMenuOpenChange,
  onSelect
}: MediaCardOverlayProps) {
  const showOverlay = (isHovering || isSelectionMode || isMoreMenuOpen) && !processing

  const t = useTypeSafeTranslations()

  const overlayWrapperClasslist = useMemo(
    () => mergeClasses(isSelectionMode ? 'bg-black/60' : 'bg-black/40', selected && 'border-2 border-yellow-400'),
    [isSelectionMode, selected]
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
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onSelect?.(event)
    },
    [onSelect]
  )

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div cy-id="overlay" className={mergeClasses('w-full h-full absolute top-0 start-0 z-10 bg-black rounded-sm', 'md:block', overlayWrapperClasslist)}>
          {/* Play button */}
          {showPlayButton && (
            <div cy-id="playButton" className="h-full flex items-center justify-center pointer-events-none">
              <IconBtn
                borderless
                outlined={false}
                className="hover:text-white text-gray-200 hover:scale-110 transform duration-200 pointer-events-auto w-auto h-auto"
                onClick={handlePlayClick}
                ariaLabel={t('ButtonPlay')}
                style={{ fontSize: `${playIconFontSize}em` }}
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
                className="hover:text-white text-gray-200 hover:scale-110 transform duration-200 pointer-events-auto w-auto h-auto"
                onClick={handleReadClick}
                ariaLabel={t('ButtonRead')}
                style={{ fontSize: `${playIconFontSize}em` }}
              >
                auto_stories
              </IconBtn>
            </div>
          )}

          {/* Select button */}
          {!isAuthorBookshelfView && (
            <div cy-id="selectedRadioButton" className="absolute top-[0.375em] start-[0.375em]">
              <IconBtn
                borderless
                size="small"
                className={mergeClasses(
                  'text-gray-200 hover:not-disabled:text-yellow-300 hover:scale-125 transform duration-100 text-[1em] w-auto h-auto',
                  selected && 'text-yellow-400'
                )}
                onClick={handleSelectClick}
                ariaLabel={selected ? t('ButtonDeselect') : t('ButtonSelect')}
              >
                {selected ? 'radio_button_checked' : 'radio_button_unchecked'}
              </IconBtn>
            </div>
          )}

          {/* Edit button */}
          {userCanUpdate && !isSelectionMode && (
            <div cy-id="editButton" className="absolute top-[0.375em] end-[0.375em] ">
              {/* TODO: wire up edit modal when available */}
              <IconBtn
                borderless
                size="small"
                className="text-gray-200 hover:not-disabled:text-yellow-300 hover:scale-125 transform duration-150 text-[1em] w-auto h-auto"
                ariaLabel={t('ButtonEdit')}
              >
                edit
              </IconBtn>
            </div>
          )}

          {/* More menu icon */}
          {!isSelectionMode && moreMenuItems.length > 0 && (
            <div
              cy-id="moreButton"
              className="md:block absolute cursor-pointer bottom-[0.375em] end-[0.375em] hover:[&_.material-symbols]:!text-yellow-300 hover:scale-125"
            >
              <MediaCardMoreMenu items={moreMenuItems} processing={processing || isPending} onAction={onMoreAction} onOpenChange={onMoreMenuOpenChange} />
            </div>
          )}

          {/* Overlay badges (e.g., ebook format) */}
          {renderOverlayBadges?.()}
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
            className="bg-error rounded-r-full shadow-md flex items-center justify-end border-r border-b border-red-300"
            style={{ height: `${1.5}em`, width: `${2.5}em` }}
          >
            <span className="material-symbols text-red-100 pr-1" style={{ fontSize: `${0.875}em` }}>
              priority_high
            </span>
          </div>
        </Tooltip>
      )}

      {/* RSS feed & share icons */}
      {rssFeed && !isSelectionMode && !isHovering && (
        <div
          cy-id="rssFeed"
          className="absolute top-[0.375em] start-[0.375em] z-10 bg-black/40 rounded-full flex items-center justify-center shadow-sm"
          style={{ width: `${1.5}em`, height: `${1.5}em` }}
        >
          <span className="material-symbols text-orange-500" aria-hidden="true" style={{ fontSize: `${1}em` }}>
            rss_feed
          </span>
        </div>
      )}
      {mediaItemShare && !isSelectionMode && !isHovering && (
        <div
          cy-id="mediaItemShare"
          className="absolute start-[0.375em] z-10 bg-black/40 rounded-full flex items-center justify-center shadow-sm"
          style={{
            width: `${1.5}em`,
            height: `${1.5}em`,
            top: rssFeed ? `${2.125}em` : `${0.375}em`
          }}
        >
          <span className="material-symbols text-green-500" aria-hidden="true" style={{ fontSize: `${1}em` }}>
            public
          </span>
        </div>
      )}

      {/* Type-specific badges (books/podcasts) */}
      {renderBadges?.({ isHovering, isSelectionMode, processing: processing || isPending })}

      {/* Series name overlay */}
      {renderSeriesNameOverlay?.(isHovering)}
    </>
  )
}
