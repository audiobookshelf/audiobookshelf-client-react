'use client'

import IconBtn from '@/components/ui/IconBtn'
import { usePlayerPopover } from '@/hooks/usePlayerPopover'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { VOLUME_HOTKEY_STEP, getVolumeIcon } from '@/lib/player/constants'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface VolumeControlProps {
  playerHandler: PlayerHandler
}

export default function VolumeControl({ playerHandler }: VolumeControlProps) {
  const t = useTypeSafeTranslations()
  const primaryInputCanHover = usePrimaryInputCanHover()
  const { volume } = playerHandler.state
  const { setVolume, toggleMute } = playerHandler.controls

  const widgetId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  // Floating UI positioning
  // shift keeps the popover on screen without letting flip throw it to the other axis, and the
  // gap is the popover's only separation from the trigger — the panel used to cancel it with a
  // negative bottom margin, which left the slider sitting on top of the button
  const middleware = useMemo(() => [offset(10), shift({ padding: 8 }), flip({ fallbackAxisSideDirection: 'none' })], [])

  const { refs, floatingStyles, update } = useFloating({
    open: isOpen,
    placement: 'top',
    strategy: 'fixed',
    middleware,
    whileElementsMounted: autoUpdate
  })

  // Clear any pending hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const {
    mounted,
    isPositioned,
    close: closePopoverFromHook
  } = usePlayerPopover({
    widgetId,
    isOpen,
    setIsOpen,
    triggerRef,
    popoverRef,
    floatingRefs: refs,
    update,
    closeOnPointerDownOutside: !primaryInputCanHover
  })

  const closePopover = useCallback(() => {
    clearHideTimeout()
    closePopoverFromHook()
  }, [clearHideTimeout, closePopoverFromHook])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearHideTimeout()
  }, [clearHideTimeout])

  // Handle hover open/close with delay (pointer-hover devices only)
  const openPopover = useCallback(() => {
    clearHideTimeout()
    setIsOpen(true)
  }, [clearHideTimeout])

  const closePopoverSoon = useCallback(() => {
    clearHideTimeout()
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false)
    }, 100)
  }, [clearHideTimeout])

  const trackRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const adjustVolume = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(1, volumeRef.current + delta))
      setVolume(next)
    },
    [setVolume]
  )

  const handleVolumeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let handled = false

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          adjustVolume(VOLUME_HOTKEY_STEP)
          handled = true
          break
        case 'ArrowDown':
        case 'ArrowLeft':
          adjustVolume(-VOLUME_HOTKEY_STEP)
          handled = true
          break
        case 'Home':
          setVolume(0)
          handled = true
          break
        case 'End':
          setVolume(1)
          handled = true
          break
        default:
          return
      }

      if (handled) {
        e.preventDefault()
        e.stopPropagation()
        openPopover()
      }
    },
    [adjustVolume, openPopover, setVolume]
  )

  // Calculate volume from pointer position
  const calculateVolumeFromEvent = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      // Calculate position from bottom (0 = bottom, 1 = top)
      const relativeY = rect.bottom - clientY
      const newVolume = Math.max(0, Math.min(1, relativeY / rect.height))
      setVolume(newVolume)
    },
    [setVolume]
  )

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      const track = e.currentTarget
      isDraggingRef.current = true
      calculateVolumeFromEvent(e.clientY)
      track.setPointerCapture(e.pointerId)

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (isDraggingRef.current) {
          calculateVolumeFromEvent(moveEvent.clientY)
        }
      }

      const endDrag = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== e.pointerId) return
        isDraggingRef.current = false
        track.releasePointerCapture(e.pointerId)
        track.removeEventListener('pointermove', handlePointerMove)
        track.removeEventListener('pointerup', endDrag)
        track.removeEventListener('pointercancel', endDrag)
      }

      track.addEventListener('pointermove', handlePointerMove)
      track.addEventListener('pointerup', endDrag)
      track.addEventListener('pointercancel', endDrag)
    },
    [calculateVolumeFromEvent]
  )

  const handleTriggerClick = useCallback(() => {
    if (primaryInputCanHover) {
      toggleMute()
      return
    }
    setIsOpen((prev) => !prev)
  }, [primaryInputCanHover, toggleMute])

  const handleTriggerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (primaryInputCanHover) {
        e.preventDefault()
      }
    },
    [primaryInputCanHover]
  )

  const isFocusWithinWidget = useCallback((related: EventTarget | null) => {
    if (!(related instanceof Node)) return false
    if (triggerRef.current?.contains(related)) return true
    if (popoverRef.current?.contains(related)) return true
    return false
  }, [])

  const handleTriggerFocus = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>) => {
      if (e.target.matches(':focus-visible')) {
        openPopover()
      }
    },
    [openPopover]
  )

  const handleWidgetBlur = useCallback(
    (e: React.FocusEvent) => {
      if (isFocusWithinWidget(e.relatedTarget)) {
        return
      }
      if (primaryInputCanHover) {
        closePopoverSoon()
      } else {
        closePopover()
      }
    },
    [closePopover, closePopoverSoon, isFocusWithinWidget, primaryInputCanHover]
  )

  const volumePercentage = Math.round(volume * 100)
  const isMuted = volume === 0
  const trackHeight = 128
  const filledHeight = trackHeight * volume

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      id={`${widgetId}-popover`}
      role="dialog"
      aria-label={t('LabelVolume')}
      style={{
        ...floatingStyles,
        visibility: isPositioned ? 'visible' : 'hidden'
      }}
      className="z-70 flex flex-col items-center"
      onMouseEnter={primaryInputCanHover ? openPopover : undefined}
      onMouseLeave={primaryInputCanHover ? closePopoverSoon : undefined}
    >
      {/* The animation lives on the panel, not the positioned wrapper — Floating UI owns that
          element's transform, and animating it there fights the positioning.
          px matches py so the slider is optically centred rather than sitting in a tall narrow
          box with no side breathing room. */}
      <div className="bg-background flex flex-col items-center rounded-xl px-3 py-3 shadow-lg">
        {/* Custom volume slider using div-based track */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={t('LabelVolume')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={volumePercentage}
          className="relative flex cursor-pointer items-center justify-center select-none"
          // touchAction rather than preventDefault: only this stops the browser claiming a
          // vertical drag as a scroll and firing pointercancel mid-drag
          style={{ height: trackHeight, width: 24, touchAction: 'none' }}
          onPointerDown={handleTrackPointerDown}
          onKeyDown={handleVolumeKeyDown}
          onBlur={handleWidgetBlur}
        >
          {/* Track background */}
          <div
            className="bg-foreground-muted pointer-events-none absolute rounded-full"
            style={{
              width: 6,
              height: trackHeight,
              opacity: 0.3
            }}
          />
          {/* Track filled portion (from bottom) */}
          <div
            className="bg-foreground pointer-events-none absolute rounded-full"
            style={{
              width: 6,
              height: filledHeight,
              bottom: 0
            }}
          />
          {/* Thumb */}
          <div
            className="bg-foreground pointer-events-none absolute rounded-full"
            style={{
              width: 14,
              height: 14,
              bottom: filledHeight - 7,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>
        {!primaryInputCanHover && (
          <button
            type="button"
            onClick={toggleMute}
            onBlur={handleWidgetBlur}
            aria-label={isMuted ? t('LabelUnmute') : t('LabelMute')}
            aria-pressed={isMuted}
            className="text-foreground-muted hover:text-foreground mt-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors"
          >
            <span className="material-symbols text-xl" aria-hidden="true">
              {isMuted ? 'volume_up' : 'volume_off'}
            </span>
          </button>
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Volume icon button */}
      <IconBtn
        ref={triggerRef}
        size="large"
        borderless
        onClick={handleTriggerClick}
        onMouseDown={handleTriggerMouseDown}
        onMouseEnter={primaryInputCanHover ? openPopover : undefined}
        onMouseLeave={primaryInputCanHover ? closePopoverSoon : undefined}
        onFocus={handleTriggerFocus}
        onBlur={handleWidgetBlur}
        onKeyDown={handleVolumeKeyDown}
        ariaLabel={t('LabelVolume')}
        aria-expanded={isOpen}
        aria-controls={`${widgetId}-popover`}
      >
        {getVolumeIcon(volume)}
      </IconBtn>

      {/* Popover rendered via portal */}
      {mounted && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}
