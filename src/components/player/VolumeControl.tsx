'use client'

import type { UsePlayerHandlerReturn } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { autoUpdate, flip, offset, useFloating } from '@floating-ui/react-dom'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface VolumeControlProps {
  playerHandler: UsePlayerHandlerReturn
}

export default function VolumeControl({ playerHandler }: VolumeControlProps) {
  const t = useTypeSafeTranslations()
  const { volume } = playerHandler.state
  const { setVolume, toggleMute } = playerHandler.controls

  const widgetId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)

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
  const middleware = useMemo(() => [offset(8), flip({ fallbackAxisSideDirection: 'none' })], [])

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

  // Handle hover open/close with delay
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

  // Calculate volume from mouse/touch position
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

  // Handle mouse/touch interactions
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDraggingRef.current = true
      calculateVolumeFromEvent(e.clientY)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (isDraggingRef.current) {
          calculateVolumeFromEvent(moveEvent.clientY)
        }
      }

      const handleMouseUp = () => {
        isDraggingRef.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [calculateVolumeFromEvent]
  )

  const volumePercentage = Math.round(volume * 100)
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
      onMouseEnter={openPopover}
      onMouseLeave={closePopoverSoon}
    >
      {/* Main popover content with background */}
      <div className="bg-background rounded-lg shadow-lg py-3 px-1 flex flex-col items-center" style={{ marginBottom: -8 }}>
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
          className="relative flex items-center justify-center cursor-pointer select-none"
          style={{ height: trackHeight, width: 24 }}
          onMouseDown={handleMouseDown}
        >
          {/* Track background */}
          <div
            className="absolute rounded-full bg-foreground-muted pointer-events-none"
            style={{
              width: 6,
              height: trackHeight,
              opacity: 0.3
            }}
          />
          {/* Track filled portion (from bottom) */}
          <div
            className="absolute rounded-full bg-foreground pointer-events-none"
            style={{
              width: 6,
              height: filledHeight,
              bottom: 0
            }}
          />
          {/* Thumb */}
          <div
            className="absolute rounded-full pointer-events-none bg-foreground"
            style={{
              width: 14,
              height: 14,
              bottom: filledHeight - 7,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Volume icon button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMute}
        onMouseEnter={openPopover}
        onMouseLeave={closePopoverSoon}
        aria-label={t('LabelVolume')}
        aria-expanded={isOpen}
        aria-controls={`${widgetId}-popover`}
        className="w-10 h-10 flex items-center justify-center text-2xl text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <span className="material-symbols" aria-hidden="true">
          {getVolumeIcon()}
        </span>
      </button>

      {/* Popover rendered via portal */}
      {mounted && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}
