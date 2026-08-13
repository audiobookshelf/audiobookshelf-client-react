'use client'

import Tooltip from '@/components/ui/Tooltip'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { MAX_PLAYBACK_RATE, MIN_PLAYBACK_RATE } from '@/lib/player/constants'
import { useEffect, useRef, useState } from 'react'

interface PlayerSpeedPillProps {
  playerHandler: PlayerHandler
  className?: string
}

/** Long enough to read as a nudge, short enough not to lag behind a held key */
const RATE_PULSE_MS = 260

/**
 * Playback rate readout, shown only while the rate is off 1x.
 *
 * A permanent "1.0x" is noise — the interesting state is the one you would forget you left
 * on, and this appears exactly then. The speed menu on the rail stays the primary control;
 * this is a status badge that happens to be adjustable.
 */
export default function PlayerSpeedPill({ playerHandler, className }: PlayerSpeedPillProps) {
  const t = useTypeSafeTranslations()
  const { playbackRate: rawRate, playbackRateIncrementDecrement } = playerHandler.state.settings
  const { setPlaybackRate, incrementPlaybackRate, decrementPlaybackRate } = playerHandler.controls

  const playbackRate = rawRate && !Number.isNaN(rawRate) ? rawRate : 1

  const [isPulsing, setIsPulsing] = useState(false)
  const previousRateRef = useRef(playbackRate)
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const previousRate = previousRateRef.current
    previousRateRef.current = playbackRate
    if (previousRate === playbackRate) return
    // While the pill is appearing or leaving, its own transition is the feedback. Pulsing on
    // top of that would fight it for the transform property.
    if (previousRate === 1 || playbackRate === 1) return

    setIsPulsing(true)
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    pulseTimeoutRef.current = setTimeout(() => setIsPulsing(false), RATE_PULSE_MS)
  }, [playbackRate])

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    }
  }, [])

  if (playbackRate === 1) return null

  // Mirrors PlaybackRateWidget's formatting, so the pill and the menu never disagree
  const rateLabel = playbackRateIncrementDecrement === 0.05 ? playbackRate.toFixed(2) : playbackRate.toFixed(1)
  const canIncrement = playbackRate + playbackRateIncrementDecrement <= MAX_PLAYBACK_RATE
  const canDecrement = playbackRate - playbackRateIncrementDecrement >= MIN_PLAYBACK_RATE

  const stepBtnClass =
    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent/25 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent'

  return (
    <div
      className={mergeClasses(
        'player-speed-pill bg-accent/15 text-accent flex h-8 items-center rounded-full px-0.5',
        isPulsing ? 'player-speed-pill-pulse' : '',
        className
      )}
    >
      <Tooltip text={t('ButtonSlower')} position="top">
        <button type="button" disabled={!canDecrement} aria-label={t('ButtonSlower')} className={stepBtnClass} onClick={decrementPlaybackRate}>
          <span className="material-symbols text-base" aria-hidden="true">
            remove
          </span>
        </button>
      </Tooltip>

      <Tooltip text={t('ButtonResetToDefault')} position="top">
        <button
          type="button"
          aria-label={`${t('LabelPlaybackRate')}: ${rateLabel}x, ${t('ButtonResetToDefault')}`}
          className="hover:bg-accent/25 h-7 cursor-pointer rounded-full px-1.5 font-mono text-xs font-semibold tabular-nums transition-colors"
          onClick={() => setPlaybackRate(1)}
        >
          {rateLabel}x
        </button>
      </Tooltip>

      <Tooltip text={t('ButtonFaster')} position="top">
        <button type="button" disabled={!canIncrement} aria-label={t('ButtonFaster')} className={stepBtnClass} onClick={incrementPlaybackRate}>
          <span className="material-symbols text-base" aria-hidden="true">
            add
          </span>
        </button>
      </Tooltip>
    </div>
  )
}
