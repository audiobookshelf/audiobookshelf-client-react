'use client'

import ButtonBase from '@/components/ui/ButtonBase'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { usePlayerPopover } from '@/hooks/usePlayerPopover'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { arrow as arrowMw, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import IconBtn from '../ui/IconBtn'

interface PlaybackRateWidgetProps {
  playerHandler: PlayerHandler
}

const PRESET_RATES = [0.5, 1, 1.2, 1.5, 2]

export default function PlaybackRateWidget({ playerHandler }: PlaybackRateWidgetProps) {
  const t = useTypeSafeTranslations()
  const { playbackRate, playbackRateIncrementDecrement } = playerHandler.state.settings
  const { setPlaybackRate, incrementPlaybackRate, decrementPlaybackRate } = playerHandler.controls

  const widgetId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  // Format the playback rate based on increment setting
  const formatRate = useCallback(
    (rate: number): string => {
      if (playbackRateIncrementDecrement === 0.05) {
        return rate.toFixed(2)
      }
      return rate.toFixed(1)
    },
    [playbackRateIncrementDecrement]
  )

  const formatRateLabel = useCallback((rate: number) => t('LabelPlaybackRateMultiplier', { rate: formatRate(rate) }), [formatRate, t])

  // Floating UI positioning
  const middleware = useMemo(() => [offset(8), shift({ padding: 8 }), flip({ fallbackAxisSideDirection: 'start' }), arrowMw({ element: arrowRef })], [])

  const {
    refs,
    floatingStyles,
    update,
    placement: resolvedPlacement,
    middlewareData
  } = useFloating({
    open: isOpen,
    placement: 'top',
    strategy: 'fixed',
    middleware,
    whileElementsMounted: autoUpdate
  })

  const { mounted, isPositioned } = usePlayerPopover({
    widgetId,
    isOpen,
    setIsOpen,
    triggerRef,
    popoverRef,
    floatingRefs: refs,
    update
  })

  const toggleOpen = () => {
    setIsOpen((prev) => !prev)
  }

  const handlePresetClick = (rate: number) => {
    setPlaybackRate(rate)
  }

  const handleIncrement = () => {
    incrementPlaybackRate()
  }

  const handleDecrement = () => {
    decrementPlaybackRate()
  }

  const handlePlaybackRateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        incrementPlaybackRate()
        setIsOpen(true)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        decrementPlaybackRate()
        setIsOpen(true)
      }
    },
    [decrementPlaybackRate, incrementPlaybackRate]
  )

  // Arrow positioning
  const arrowStyles = useMemo<React.CSSProperties>(() => {
    const { x, y } = middlewareData.arrow ?? {}
    const staticSide: Record<string, keyof React.CSSProperties> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    }
    return {
      left: x != null ? `${x}px` : '',
      top: y != null ? `${y}px` : '',
      [staticSide[resolvedPlacement.split('-')[0]]]: '-4px'
    } as React.CSSProperties
  }, [middlewareData.arrow, resolvedPlacement])

  const rateStepLabel = formatRate(playbackRateIncrementDecrement)

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      id={`${widgetId}-popover`}
      role="dialog"
      aria-label={t('LabelPlaybackRate')}
      style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
      className="bg-background z-70 rounded-lg p-2 shadow-lg"
    >
      {/* Preset buttons row */}
      <div className="mb-2 flex gap-0">
        {PRESET_RATES.map((rate, index) => (
          <button
            key={rate}
            type="button"
            onClick={() => handlePresetClick(rate)}
            aria-label={t('AriaLabelSetPlaybackRatePreset', { 0: formatRate(rate) })}
            aria-pressed={playbackRate === rate}
            className={mergeClasses(
              'px-3 py-1.5 text-sm font-medium transition-colors',
              'border-border border',
              index === 0 ? 'rounded-l-md' : '',
              index === PRESET_RATES.length - 1 ? 'rounded-r-md' : '',
              playbackRate === rate
                ? 'bg-button-selected-bg text-button-foreground'
                : 'text-button-foreground-muted hover:bg-button-selected-bg hover:text-button-foreground bg-transparent'
            )}
          >
            {formatRateLabel(rate)}
          </button>
        ))}
      </div>

      {/* Increment/decrement row */}
      <div className="flex items-center gap-2">
        {/* Minus button */}
        <IconBtn onClick={handleDecrement} ariaLabel={t('AriaLabelDecreasePlaybackRateBy', { 0: rateStepLabel })}>
          remove
        </IconBtn>

        {/* Current rate display */}
        <div className="text-foreground flex min-w-[100px] flex-1 items-center justify-center text-3xl font-semibold tabular-nums">
          {formatRateLabel(playbackRate)}
        </div>

        {/* Plus button */}
        <IconBtn onClick={handleIncrement} ariaLabel={t('AriaLabelIncreasePlaybackRateBy', { 0: rateStepLabel })}>
          add
        </IconBtn>
      </div>

      {/* Arrow */}
      <div ref={arrowRef} style={arrowStyles} className="bg-background absolute h-2 w-2 rotate-45" />
    </div>
  ) : null

  return (
    <>
      {/* toggle widget button showing current playback rate */}
      <ButtonBase
        ref={triggerRef}
        size="large"
        borderless
        className="min-w-11 px-1 text-lg font-medium tabular-nums"
        onClick={toggleOpen}
        onKeyDown={handlePlaybackRateKeyDown}
        aria-expanded={isOpen}
        aria-controls={`${widgetId}-popover`}
        ariaLabel={t('AriaLabelPlaybackRateWithValue', { 0: formatRate(playbackRate) })}
      >
        {formatRateLabel(playbackRate)}
      </ButtonBase>

      {/* Popover rendered via portal */}
      {mounted && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}
