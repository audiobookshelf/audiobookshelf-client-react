'use client'

import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import ButtonBase from '@/components/ui/ButtonBase'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useRegisterPlayerPopover } from '@/lib/player/playerPopoverStore'
import { arrow as arrowMw, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import IconBtn from '../ui/IconBtn'

interface PlaybackRateWidgetProps {
  playerHandler: PlayerHandler
  /** `lg` clears the 44px touch minimum, for the fullscreen player's toolbar */
  size?: 'default' | 'lg'
  /**
   * Where the popover opens. The fullscreen hover rail sits against the artwork, and this
   * panel is wide enough that opening upward puts it straight over the cover — `right` sends
   * it out into the empty margin instead.
   */
  placement?: 'top' | 'right'
}

const PRESET_RATES = [0.5, 1, 1.2, 1.5, 2] as const

export default function PlaybackRateWidget({ playerHandler, size = 'default', placement = 'top' }: PlaybackRateWidgetProps) {
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
    update,
    placement: resolvedPlacement,
    middlewareData
  } = useFloating({
    open: isOpen,
    placement,
    strategy: 'fixed',
    middleware,
    whileElementsMounted: autoUpdate,
    elements: {
      reference: triggerRef.current
    }
  })

  // The floating element only exists after the first paint of the open state, so the very
  // first frame has no position yet and the panel would flash at the top-left corner before
  // snapping into place. Stay hidden until the measurement lands.
  const [isPositioned, setIsPositioned] = useState(false)

  useEffect(() => {
    if (!isOpen || !popoverRef.current) return

    refs.setFloating(popoverRef.current)
    update()
    const frame = requestAnimationFrame(() => setIsPositioned(true))
    return () => cancelAnimationFrame(frame)
  }, [isOpen, refs, update])

  useEffect(() => {
    if (!isOpen) setIsPositioned(false)
  }, [isOpen])

  // Update reference element when trigger ref is available
  useEffect(() => {
    if (triggerRef.current) {
      refs.setReference(triggerRef.current)
    }
  }, [refs])

  // Close on pointerdown outside. Pointer rather than mouse events, so a tap dismisses it on
  // touch — synthesized mouse events are not guaranteed there.
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      // Don't close if clicking inside the popover or on the trigger
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  // Lets the global Escape hotkey know a popover owns the key while this is open
  useRegisterPlayerPopover(widgetId, 'playbackRate', isOpen)

  // Close on Escape key, returning focus to the trigger so the tab order does not restart
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      e.preventDefault()

      const focusWasInPopover = popoverRef.current?.contains(document.activeElement)
      setIsOpen(false)
      if (focusWasInPopover) triggerRef.current?.focus()
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

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      id={`${widgetId}-popover`}
      role="dialog"
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
            {rate}x
          </button>
        ))}
      </div>

      {/* Increment/decrement row */}
      <div className="flex items-center gap-2">
        {/* Minus button */}
        <IconBtn onClick={handleDecrement}>remove</IconBtn>

        {/* Current rate display */}
        <div className="text-foreground flex min-w-[100px] flex-1 items-center justify-center text-3xl font-semibold tabular-nums">
          {formatRate(playbackRate)}x
        </div>

        {/* Plus button */}
        <IconBtn onClick={handleIncrement}>add</IconBtn>
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
        size="custom"
        borderless
        className={
          size === 'lg'
            ? 'h-11 min-w-11 shrink-0 px-1 text-lg font-medium tabular-nums'
            : 'min-w-9 px-0.5 text-sm font-medium tabular-nums sm:min-w-10 sm:px-1 sm:text-base'
        }
        onClick={toggleOpen}
        onKeyDown={handlePlaybackRateKeyDown}
        aria-expanded={isOpen}
        aria-controls={`${widgetId}-popover`}
        ariaLabel={t('AriaLabelPlaybackRateWithValue', { 0: formatRate(playbackRate) })}
      >
        {formatRate(playbackRate)}x
      </ButtonBase>

      {/* Popover rendered via portal */}
      {mounted && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}
