'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMediaQuery, usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { subscribePlayerJump } from '@/lib/player/playerFeedbackStore'
import { useEffect, useRef, useState } from 'react'
import type { JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenDesktopLayout from './PlayerFullscreenDesktopLayout'
import PlayerFullscreenMobileLayout from './PlayerFullscreenMobileLayout'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  onMinimize: () => void
  /** Stops playback and dismisses the player, without having to minimize first */
  onClosePlayer: () => void
}

const JUMP_BURST_MS = 600

/**
 * Immersive fullscreen player. Opened by tapping the artwork in the mini player and closed
 * with Escape or the arrow in the top corner.
 *
 * Mobile and desktop get separate layouts, the same split the mini player uses. The desktop
 * layout is only chosen when the primary input can hover, so a tablet wide enough to clear
 * `lg` still gets the touch layout — nothing in the touch path may depend on hover.
 *
 * Rendered inside a `theme-dark` scope so shared player components resolve their tokens
 * against the dark palette the artwork backdrop needs. Portalled UI opened from here
 * (modals, popovers, tooltips) lands on `document.body`, outside that scope, and stays on
 * the app's own theme.
 */
export default function PlayerFullscreen({ controls, metadata, onMinimize, onClosePlayer }: PlayerFullscreenProps) {
  const { streamLibraryItem, t } = controls
  const coverAspectRatio = useBookCoverAspectRatio()
  const isWideViewport = useMediaQuery('lg')
  const primaryInputCanHover = usePrimaryInputCanHover()
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

  return (
    <div
      ref={dialogRef}
      // h-dvh as well as inset-0: on mobile browsers the layout viewport can extend behind
      // collapsing browser chrome, which would put the transport controls out of reach
      className="theme-dark bg-primary text-foreground fixed inset-0 z-60 flex h-dvh flex-col overflow-hidden focus:outline-none"
      // role without aria-modal: the volume and speed popovers opened from here portal to
      // document.body, so a focus trap would make them unreachable by keyboard. Claiming
      // modality we do not enforce would be worse than not claiming it.
      role="dialog"
      aria-label={t('LabelPlayerFullscreen')}
      tabIndex={-1}
    >
      {/* Blurred artwork backdrop */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 scale-110 bg-cover bg-center blur-3xl brightness-50" style={{ backgroundImage: `url("${coverSrc}")` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black" />
      </div>

      {/* Always visible, and only as large as the buttons. Minimize used to fade in on hover
          inside a wrapper far larger than itself, which on touch swallowed corner taps.
          Close is here so ending playback does not require minimizing first. */}
      <div className="absolute top-0 z-20 flex w-full items-center justify-between p-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <IconBtn
          size="custom"
          borderless
          className="h-11 w-11 rounded-full bg-white/5 text-3xl hover:bg-white/15"
          onClick={onMinimize}
          ariaLabel={t('LabelExitFullscreenPlayer')}
        >
          keyboard_arrow_down
        </IconBtn>

        <IconBtn
          size="custom"
          borderless
          className="h-11 w-11 rounded-full bg-white/5 text-2xl hover:bg-white/15"
          onClick={onClosePlayer}
          ariaLabel={t('LabelClosePlayer')}
        >
          close
        </IconBtn>
      </div>

      {isDesktop ? <PlayerFullscreenDesktopLayout {...layoutProps} /> : <PlayerFullscreenMobileLayout {...layoutProps} />}
    </div>
  )
}
