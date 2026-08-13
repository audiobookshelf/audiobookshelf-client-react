'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useInertBackground } from '@/hooks/useInertBackground'
import { useMediaQuery, usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { subscribePlayerJump } from '@/lib/player/playerFeedbackStore'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenDesktopLayout from './PlayerFullscreenDesktopLayout'
import PlayerFullscreenLandscapeLayout from './PlayerFullscreenLandscapeLayout'
import PlayerFullscreenMobileLayout from './PlayerFullscreenMobileLayout'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  onMinimize: () => void
  /** Stops playback and dismisses the player, without having to minimize first */
  onClosePlayer: () => void
  /** Plays the closing animation — the parent unmounts once it has run */
  isExiting?: boolean
}

const JUMP_BURST_MS = 600

/**
 * Immersive fullscreen player. Opened by tapping the artwork in the mini player and closed
 * with Escape, the back button or the arrow in the top corner.
 *
 * Three layouts, picked by what the device can actually offer rather than by width alone:
 * desktop only when the primary input can hover (so a wide tablet still gets the touch
 * path), a side-by-side layout when the viewport is short and landscape, and the portrait
 * touch layout otherwise.
 *
 * Portalled to `document.body` so the rest of the page can be marked `inert` while it is
 * open — as a child of the app tree it would share an ancestor with the mini player and
 * could not be excluded. Rendered inside a `theme-dark` scope so shared player components
 * resolve their tokens against the dark palette the artwork backdrop needs. Portalled UI
 * opened from here (modals, popovers, tooltips) lands on `document.body` too, outside that
 * scope and outside the inert subtrees, and stays on the app's own theme.
 */
export default function PlayerFullscreen({ controls, metadata, onMinimize, onClosePlayer, isExiting = false }: PlayerFullscreenProps) {
  const { streamLibraryItem, playerHandler, t } = controls
  const { showFullscreenCornerButtons } = playerHandler.state.settings
  const coverAspectRatio = useBookCoverAspectRatio()
  const isWideViewport = useMediaQuery('lg')
  const primaryInputCanHover = usePrimaryInputCanHover()
  const isShortLandscape = useMediaQuery('short-landscape')
  const isDesktop = isWideViewport && primaryInputCanHover

  const [jumpBurst, setJumpBurst] = useState<JumpBurst | null>(null)
  const jumpBurstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = subscribePlayerJump(({ direction, amount }) => {
      setJumpBurst((previous) => ({ direction, amount, key: (previous?.key ?? 0) + 1 }))

      if (jumpBurstTimeoutRef.current) clearTimeout(jumpBurstTimeoutRef.current)
      jumpBurstTimeoutRef.current = setTimeout(() => setJumpBurst(null), JUMP_BURST_MS)
    })

    return () => {
      unsubscribe()
      if (jumpBurstTimeoutRef.current) clearTimeout(jumpBurstTimeoutRef.current)
    }
  }, [])

  // Move focus in on open and put it back on close, the same way Modal does — otherwise
  // keyboard focus stays on the mini player button behind the overlay.

  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Declared before the focus effect on purpose: cleanups run in declaration order, so the
  // page is interactive again by the time focus is handed back to the mini player
  useInertBackground(dialogRef)

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement
    const frame = requestAnimationFrame(() => dialogRef.current?.focus())

    return () => {
      cancelAnimationFrame(frame)
      previousActiveElement.current?.focus()
    }
  }, [])

  const coverSrc = getLibraryItemCoverSrc(streamLibraryItem, getPlaceholderCoverUrl())

  const layoutProps = {
    controls,
    metadata,
    coverSrc,
    coverAspectRatio,
    jumpBurst,
    onMinimize
  }

  // Landscape has to give the top bar its height back — 44px of chrome out of a ~390px
  // viewport is the difference between the artwork fitting and being clipped
  const topBarClass = isShortLandscape ? 'p-2' : 'p-4'
  const topBarButtonClass = isShortLandscape ? 'h-9 w-9' : 'h-11 w-11'

  const overlay = (
    <div
      ref={dialogRef}
      // h-dvh as well as inset-0: on mobile browsers the layout viewport can extend behind
      // collapsing browser chrome, which would put the transport controls out of reach
      className={mergeClasses(
        'theme-dark bg-primary text-foreground fixed inset-0 z-60 flex h-dvh flex-col overflow-hidden focus:outline-none',
        isExiting ? 'player-fullscreen-exit' : 'player-fullscreen-enter'
      )}
      // role without aria-modal: the volume and speed popovers opened from here portal to
      // document.body, so a focus trap would make them unreachable by keyboard. The rest of
      // the page is inert instead, which keeps them reachable and the page behind not.
      role="dialog"
      aria-label={t('LabelPlayerFullscreen')}
      tabIndex={-1}
    >
      {/* Blurred artwork backdrop */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 scale-110 bg-cover bg-center blur-3xl brightness-50" style={{ backgroundImage: `url("${coverSrc}")` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black" />
      </div>

      {/* Only as large as the buttons. Minimize used to fade in on hover inside a wrapper far
          larger than itself, which on touch swallowed corner taps. Close is here so ending
          playback does not require minimizing first. Hiding them is a setting rather than a
          hover reveal — Escape, the back button and the artwork all still work without them. */}
      {showFullscreenCornerButtons && (
        <div
          className={mergeClasses('absolute top-0 z-20 flex w-full items-center justify-between', topBarClass)}
          style={{ paddingTop: `calc(env(safe-area-inset-top) + ${isShortLandscape ? '0.5rem' : '1rem'})` }}
        >
          <IconBtn
            size="custom"
            borderless
            className={mergeClasses('rounded-full bg-white/5 text-3xl hover:bg-white/15', topBarButtonClass)}
            onClick={onMinimize}
            ariaLabel={t('LabelExitFullscreenPlayer')}
          >
            keyboard_arrow_down
          </IconBtn>

          <IconBtn
            size="custom"
            borderless
            className={mergeClasses('rounded-full bg-white/5 text-2xl hover:bg-white/15', topBarButtonClass)}
            onClick={onClosePlayer}
            ariaLabel={t('LabelClosePlayer')}
          >
            close
          </IconBtn>
        </div>
      )}

      {/* Keyed so switching orientation remounts the layout and it cross-fades in rather
          than snapping between two entirely different arrangements */}
      {isDesktop ? (
        <PlayerFullscreenDesktopLayout key="desktop" {...layoutProps} />
      ) : isShortLandscape ? (
        <PlayerFullscreenLandscapeLayout key="landscape" {...layoutProps} />
      ) : (
        <PlayerFullscreenMobileLayout key="portrait" {...layoutProps} />
      )}
    </div>
  )

  return createPortal(overlay, document.body)
}
