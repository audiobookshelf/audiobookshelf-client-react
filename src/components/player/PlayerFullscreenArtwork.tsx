'use client'

import { fitCoverWidth } from '@/lib/player/coverFit'
import type { PlayerJumpDirection } from '@/lib/player/playerFeedbackStore'
import { mergeClasses } from '@/lib/merge-classes'
import { useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import PreviewCover from '../covers/PreviewCover'

export interface JumpBurst {
  direction: PlayerJumpDirection
  amount: number
  /** Remounts the burst so the animation replays on rapid presses */
  key: number
}

/** Height the title and author block takes under the artwork, plus the gap above it */
export const TITLE_BLOCK_RESERVE = 96

/**
 * Tracks the largest artwork width that fits the stage, remeasuring as the stage resizes.
 *
 * `clientWidth`/`clientHeight` include the stage's own padding, which the artwork cannot
 * use, so the padding is subtracted before fitting — otherwise the artwork overflows a
 * padded stage and gets clipped by the overlay.
 *
 * Returns `null` until the first measurement lands, so callers can skip the paint rather
 * than flash a placeholder-sized cover that then jumps to its real size.
 */
export function useFittedCoverWidth(
  stageRef: RefObject<HTMLDivElement | null>,
  coverAspectRatio: number,
  belowReserve: number,
  /** Room to keep free on each side of the artwork — the desktop hover rail and volume readout */
  sideReserve = 0,
  /**
   * Extra cap as a fraction of the viewport height, matching the Vue client. Fitting the
   * stage alone lets the artwork grow until it dominates the view on a tall window; this
   * keeps it in proportion to the screen rather than to the space that happens to be free.
   */
  viewportHeightFraction = 0
): number | null {
  const [coverWidth, setCoverWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const measure = () => {
      const style = getComputedStyle(stage)
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)

      const fitted = fitCoverWidth({
        availableWidth: stage.clientWidth - paddingX - sideReserve * 2,
        availableHeight: stage.clientHeight - paddingY - belowReserve,
        coverAspectRatio
      })

      setCoverWidth(viewportHeightFraction > 0 ? Math.min(fitted, window.innerHeight * viewportHeightFraction) : fitted)
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(stage)
    // The stage does not resize when only the window height changes, but the cap does
    window.addEventListener('resize', measure)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [stageRef, coverAspectRatio, belowReserve, sideReserve, viewportHeightFraction])

  return coverWidth
}

interface PlayerFullscreenArtworkProps {
  coverSrc: string
  /** `null` while the stage is still being measured — nothing is painted until it resolves */
  coverWidth: number | null
  coverAspectRatio: number
  jumpBurst: JumpBurst | null
  /** Rendered under the cover — the desktop progress ring, which draws outside its bounds */
  beforeCover?: (dimensions: { coverWidth: number; coverHeight: number }) => ReactNode
  /** Overlays anchored to the artwork — the desktop volume readout and hover rail */
  children?: ReactNode
  className?: string
}

/** Fullscreen artwork with the jump feedback overlay. Purely presentational — it is not a control. */
export default function PlayerFullscreenArtwork({
  coverSrc,
  coverWidth,
  coverAspectRatio,
  jumpBurst,
  beforeCover,
  children,
  className
}: PlayerFullscreenArtworkProps) {
  if (coverWidth === null) return null

  const coverHeight = coverWidth * coverAspectRatio

  return (
    <div className={mergeClasses('player-fullscreen-artwork relative shrink-0', className)} style={{ width: coverWidth, height: coverHeight }}>
      {beforeCover?.({ coverWidth, coverHeight })}

      <div className="h-full w-full overflow-hidden rounded-2xl shadow-2xl">
        <PreviewCover src={coverSrc} width={coverWidth} bookCoverAspectRatio={coverAspectRatio} showResolution={false} />
      </div>

      {/* Jump feedback — the only visible confirmation when the jump came from a hotkey */}
      {jumpBurst && (
        <div
          key={jumpBurst.key}
          aria-hidden="true"
          className={mergeClasses(
            'player-jump-burst pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl',
            jumpBurst.direction === 'backward' ? 'player-jump-burst-back' : 'player-jump-burst-fwd'
          )}
        >
          <div className="player-jump-burst-pill flex h-24 w-24 flex-col items-center justify-center gap-0.5 rounded-full bg-black/55 ring-1 ring-white/15 backdrop-blur-md">
            <span className="player-jump-burst-icon material-symbols text-3xl leading-none">
              {jumpBurst.direction === 'backward' ? 'replay' : 'forward_media'}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {jumpBurst.direction === 'backward' ? '−' : '+'}
              {jumpBurst.amount}s
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
