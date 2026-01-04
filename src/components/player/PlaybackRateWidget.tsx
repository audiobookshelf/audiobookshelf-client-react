'use client'

import type { UsePlayerHandlerReturn } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { arrow as arrowMw, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import IconBtn from '../ui/IconBtn'

interface PlaybackRateWidgetProps {
  playerHandler: UsePlayerHandlerReturn
}

const PRESET_RATES = [0.5, 1, 1.2, 1.5, 2] as const

export default function PlaybackRateWidget({ playerHandler }: PlaybackRateWidgetProps) {
  const t = useTypeSafeTranslations()
  const { playbackRate, playbackRateIncrementDecrement } = playerHandler.state.settings
  const { setPlaybackRate, incrementPlaybackRate, decrementPlaybackRate } = playerHandler.controls

  const widgetId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

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

  // Ensure component is mounted before rendering popover
  useEffect(() => {
    setMounted(true)
  }, [])

  // Floating UI positioning
  const middleware = useMemo(() => [offset(8), shift({ padding: 8 }), flip({ fallbackAxisSideDirection: 'start' }), arrowMw({ element: arrowRef })], [])

  const {
    refs,
    floatingStyles,
    placement: resolvedPlacement,
    middlewareData
  } = useFloating({
    open: isOpen,
    placement: 'top',
    strategy: 'fixed',
    middleware,
    whileElementsMounted: autoUpdate,
    elements: {
      reference: triggerRef.current
    }
  })

  // Sync popover ref with Floating UI
  useEffect(() => {
    if (popoverRef.current) {
      refs.setFloating(popoverRef.current)
    }
  }, [refs, isOpen])

  // Update reference element when trigger ref is available
  useEffect(() => {
    if (triggerRef.current) {
      refs.setReference(triggerRef.current)
    }
  }, [refs])

  // Close on mousedown outside
  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      // Don't close if clicking inside the popover or on the trigger
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
    }

    // Use mousedown instead of click for more immediate response
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

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

  const popoverContent = isOpen ? (
    <div ref={popoverRef} id={`${widgetId}-popover`} role="dialog" style={floatingStyles} className="bg-background rounded-lg shadow-lg z-70 p-2">
      {/* Preset buttons row */}
      <div className="flex gap-0 mb-2">
        {PRESET_RATES.map((rate, index) => (
          <button
            key={rate}
            type="button"
            onClick={() => handlePresetClick(rate)}
            className={mergeClasses(
              'px-3 py-1.5 text-sm font-medium transition-colors',
              'border border-border',
              index === 0 ? 'rounded-l-md' : '',
              index === PRESET_RATES.length - 1 ? 'rounded-r-md' : '',
              playbackRate === rate
                ? 'bg-button-selected-bg text-button-foreground'
                : 'bg-transparent text-button-foreground-muted hover:bg-button-selected-bg hover:text-button-foreground'
            )}
          >
            {rate}x
          </button>
        ))}
      </div>

      {/* Increment/decrement row */}
      <div className="flex items-center gap-2">
        {/* Minus button */}
        <IconBtn onClick={handleDecrement}>remove</IconBtn>

        {/* Current rate display */}
        <div className="flex-1 flex items-center justify-center text-3xl font-semibold text-foreground tabular-nums min-w-[100px]">
          {formatRate(playbackRate)}x
        </div>

        {/* Plus button */}
        <IconBtn onClick={handleIncrement}>add</IconBtn>
      </div>

      {/* Arrow */}
      <div ref={arrowRef} style={arrowStyles} className="absolute w-2 h-2 rotate-45 bg-background" />
    </div>
  ) : null

  return (
    <>
      {/* toggle widget button showing current playback rate */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls={`${widgetId}-popover`}
        aria-label={`${t('LabelPlaybackRate')}: ${formatRate(playbackRate)}x`}
        className="text-foreground-muted text-base font-medium hover:text-foreground transition-colors tabular-nums"
      >
        {formatRate(playbackRate)}x
      </button>

      {/* Popover rendered via portal */}
      {mounted && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}
