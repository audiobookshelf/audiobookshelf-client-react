'use client'

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
  renderOverlayBadges?: () => ReactNode
  renderBadges?: (props: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => ReactNode
  renderSeriesNameOverlay?: (isHovering: boolean) => ReactNode
  onPlay: () => void
  onRead: () => void
  onMoreAction: (action: string, data?: Record<string, string>) => void
  onMoreMenuOpenChange: (isOpen: boolean) => void
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
  renderOverlayBadges,
  renderBadges,
  renderSeriesNameOverlay,
  onPlay,
  onRead,
  onMoreAction,
  onMoreMenuOpenChange
}: MediaCardOverlayProps) {
  const showOverlay = (isHovering || isSelectionMode || isMoreMenuOpen) && !processing

  const t = useTypeSafeTranslations()

  const overlayWrapperClasslist = useMemo(
    () => mergeClasses(isSelectionMode ? 'bg-black/60' : 'bg-black/40', selected && 'border-2 border-yellow-400'),
    [isSelectionMode, selected]
  )

  const handlePlayClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onPlay()
    },
    [onPlay]
  )

  const handleReadClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onRead()
    },
    [onRead]
  )

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div cy-id="overlay" className={mergeClasses('w-full h-full absolute top-0 start-0 z-10 bg-black rounded-sm', 'md:block', overlayWrapperClasslist)}>
          {/* Play button */}
          {showPlayButton && (
            <div cy-id="playButton" className="h-full flex items-center justify-center pointer-events-none">
              <button
                type="button"
                className="hover:text-white text-gray-200 hover:scale-110 transform duration-200 pointer-events-auto"
                onClick={handlePlayClick}
                aria-label={t('ButtonPlay')}
              >
                <span className="material-symbols fill" style={{ fontSize: `${playIconFontSize}em` }}>
                  play_arrow
                </span>
              </button>
            </div>
          )}

          {/* Read button */}
          {showReadButton && (
            <div cy-id="readButton" className="h-full flex items-center justify-center pointer-events-none">
              <button
                type="button"
                className="hover:text-white text-gray-200 hover:scale-110 transform duration-200 pointer-events-auto"
                onClick={handleReadClick}
                aria-label={t('ButtonRead')}
              >
                <span className="material-symbols" style={{ fontSize: `${playIconFontSize}em` }}>
                  auto_stories
                </span>
              </button>
            </div>
          )}

          {/* Edit button */}
          {userCanUpdate && !isSelectionMode && (
            <div
              cy-id="editButton"
              className="absolute cursor-pointer hover:text-yellow-300 hover:scale-125 transform duration-150 top-0 end-0"
              style={{ padding: `${0.375}em` }}
            >
              {/* TODO: wire up edit modal when available */}
              <span className="material-symbols" style={{ fontSize: `${1}em` }}>
                edit
              </span>
            </div>
          )}

          {/* More menu icon */}
          {!isSelectionMode && moreMenuItems.length > 0 && (
            <div cy-id="moreButton" className="md:block absolute cursor-pointer bottom-[0.375em] end-[0.375em]">
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
        <Tooltip text={errorText} position="top" className="absolute bottom-4 start-0 z-10">
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
        <div cy-id="rssFeed" className="absolute text-success top-0 start-0 z-10" style={{ padding: `${0.375}em` }}>
          <span className="material-symbols" aria-hidden="true" style={{ fontSize: `${1.5}em` }}>
            rss_feed
          </span>
        </div>
      )}
      {mediaItemShare && !isSelectionMode && !isHovering && (
        <div cy-id="mediaItemShare" className="absolute text-success start-0 z-10" style={{ padding: `${0.375}em`, top: rssFeed ? '2em' : '0px' }}>
          <span className="material-symbols" aria-hidden="true" style={{ fontSize: `${1.5}em` }}>
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
