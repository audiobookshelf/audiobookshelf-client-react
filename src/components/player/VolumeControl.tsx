'use client'

import IconBtn from '@/components/ui/IconBtn'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { VOLUME_HOTKEY_STEP } from '@/lib/player/constants'
import { autoUpdate, flip, offset, useFloating } from '@floating-ui/react-dom'
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
  const [mounted, setMounted] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  // Get the appropriate volume icon based on current level
  const getVolumeIcon = useCallback(() => {
    if (volume === 0) return 'volume_off'
    if (volume < 0.5) return 'volume_down'
    return 'volume_up'
  }, [volume])

  // Ensure component is mounted before rendering popover
  useEffect(() => {
    setMounted(true)
  }, [])

  // Floating UI positioning
  const middleware = useMemo(() => [offset(12), flip({ fallbackAxisSideDirection: 'none' })], [])

  const { refs, floatingStyles, update } = useFloating({
    open: isOpen,
    placement: 'top',
    strategy: 'fixed',
    middleware,
    whileElementsMounted: autoUpdate
  })

  // Sync refs with Floating UI
  useEffect(() => {
    if (triggerRef.current) {
      refs.setReference(triggerRef.current)
    }
  }, [refs])

  useEffect(() => {
    if (popoverRef.current && isOpen) {
      refs.setFloating(popoverRef.current)
      // Force an update and mark as positioned after next frame
      update()
      requestAnimationFrame(() => {
        setIsPositioned(true)
      })
    }
  }, [refs, isOpen, update])

  // Reset positioned state when closing
  useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false)
    }
  }, [isOpen])

  // Clear any pending hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

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

  const closePopover = useCallback(() => {
    clearHideTimeout()
    setIsOpen(false)
  }, [clearHideTimeout])

  // Touch: dismiss popover when tapping outside
  useEffect(() => {
    if (!isOpen || primaryInputCanHover) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      closePopover()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [closePopover, isOpen, primaryInputCanHover])

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
      style={{
        ...floatingStyles,
        visibility: isPositioned ? 'visible' : 'hidden'
      }}
      className="z-70 flex flex-col items-center"
      onMouseEnter={primaryInputCanHover ? openPopover : undefined}
      onMouseLeave={primaryInputCanHover ? closePopoverSoon : undefined}
    >
      {/* Main popover content with background */}
      <div className="bg-background flex flex-col items-center rounded-lg px-1 py-3 shadow-lg" style={{ marginBottom: -8 }}>
        {/* Custom volume slider using div-based track */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={t('LabelVolume')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={volumePercentage}
          aria-valuetext={`${volumePercentage}%`}
          className="relative flex cursor-pointer items-center justify-center select-none"
          style={{ height: trackHeight, width: 24 }}
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
        size="custom"
        borderless
        className="w-9 text-2xl sm:w-10"
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
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={volumePercentage}
      >
        {getVolumeIcon()}
      </IconBtn>

      {/* Popover rendered via portal */}
      {mounted && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}
