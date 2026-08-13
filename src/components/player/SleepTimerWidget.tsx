'use client'

import ButtonBase from '@/components/ui/ButtonBase'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useRegisterPlayerPopover } from '@/lib/player/playerPopoverStore'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SleepTimerPanel from './SleepTimerPanel'
import type { PlayerControlsState } from './usePlayerControlsState'

interface SleepTimerWidgetProps {
  controls: PlayerControlsState
  /** Where the popover opens — `right` keeps it off the artwork on the fullscreen rail */
  placement?: 'top' | 'right'
  className?: string
  /** Overrides the trigger's contents, so each toolbar can keep its own sizing */
  children?: React.ReactNode
  ariaLabel: string
}

/**
 * Sleep timer as a popover anchored to its own button, instead of a modal that dims the
 * whole player to set a countdown. Same {@link SleepTimerPanel} inside either way — the
 * "legacy sleep timer dialog" setting picks which container it lands in, and when that is on
 * this widget opens the modal instead of its own panel.
 */
export default function SleepTimerWidget({ controls, placement = 'top', className, children, ariaLabel }: SleepTimerWidgetProps) {
  const t = useTypeSafeTranslations()
  const { playerHandler, chapters, sleepTimer, setIsSleepTimerModalOpen } = controls
  const { sleepTimerSet, sleepTimerRemaining, sleepTimerType, setSleepTimer, cancelSleepTimer, incrementSleepTimer, decrementSleepTimer } = sleepTimer
  const useLegacyDialog = playerHandler.state.settings.useLegacySleepTimerDialog

  const widgetId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const middleware = useMemo(() => [offset(10), shift({ padding: 8 }), flip({ fallbackAxisSideDirection: 'none' })], [])

  const { refs, floatingStyles, update } = useFloating({
    open: isOpen,
    placement,
    strategy: 'fixed',
    middleware,
    whileElementsMounted: autoUpdate
  })

  useEffect(() => {
    if (triggerRef.current) refs.setReference(triggerRef.current)
  }, [refs])

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

  useRegisterPlayerPopover(widgetId, 'sleepTimer', isOpen)

  const close = useCallback(() => setIsOpen(false), [])

  // Dismiss on a press outside, pointer events so a tap counts on touch too
  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [close, isOpen])

  // Escape closes the popover rather than the player behind it
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      e.preventDefault()

      const focusWasInPopover = popoverRef.current?.contains(document.activeElement)
      close()
      if (focusWasInPopover) triggerRef.current?.focus()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close, isOpen])

  const handleTriggerClick = useCallback(() => {
    if (useLegacyDialog) {
      setIsSleepTimerModalOpen(true)
      return
    }
    setIsOpen((open) => !open)
  }, [setIsSleepTimerModalOpen, useLegacyDialog])

  const popoverContent =
    isOpen && !useLegacyDialog ? (
      <div
        ref={popoverRef}
        id={`${widgetId}-popover`}
        role="dialog"
        aria-label={t('HeaderSleepTimer')}
        style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
        className="z-70 w-[21rem] max-w-[calc(100vw-1rem)]"
      >
        {/* The open animation lives on this inner panel, never on the element above it:
            Floating UI positions with `transform`, and an animation that also drives
            `transform` overrides it for its whole duration — the panel renders at the
            top-left corner and only snaps into place when the animation finishes */}
        <div className="player-volume-popover border-border overflow-hidden rounded-xl border bg-black shadow-2xl">
          <div className="border-border flex items-center border-b px-4 py-3">
            <p className="text-foreground-muted text-sm tracking-widest uppercase">{t('HeaderSleepTimer')}</p>
          </div>
          <SleepTimerPanel
            isVisible={isOpen}
            timerSet={sleepTimerSet}
            timerType={sleepTimerType}
            remaining={sleepTimerRemaining}
            hasChapters={chapters.length > 0}
            onClose={close}
            onSet={setSleepTimer}
            onCancel={() => {
              close()
              cancelSleepTimer()
            }}
            onIncrement={incrementSleepTimer}
            onDecrement={decrementSleepTimer}
            className="max-h-[60vh]"
          />
        </div>
      </div>
    ) : null

  return (
    <>
      <ButtonBase
        ref={triggerRef}
        size="custom"
        borderless
        className={mergeClasses(className)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleTriggerClick}
        aria-expanded={useLegacyDialog ? undefined : isOpen}
        aria-controls={useLegacyDialog ? undefined : `${widgetId}-popover`}
        ariaLabel={ariaLabel}
      >
        {children}
      </ButtonBase>

      {mounted && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}
