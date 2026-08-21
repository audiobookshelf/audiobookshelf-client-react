'use client'

import { useRegisterPlayerPopover } from '@/lib/player/playerPopoverStore'
import type { RefObject } from 'react'
import { useCallback, useEffect, useState } from 'react'

interface PlayerPopoverFloatingRefs {
  setReference: (node: HTMLElement | null) => void
  setFloating: (node: HTMLElement | null) => void
}

interface UsePlayerPopoverOptions {
  widgetId: string
  isOpen: boolean
  setIsOpen: (open: boolean | ((open: boolean) => boolean)) => void
  triggerRef: RefObject<HTMLElement | null>
  popoverRef: RefObject<HTMLElement | null>
  floatingRefs: PlayerPopoverFloatingRefs
  update: () => void
  /** Volume skips this on hover devices and uses a touch-only listener instead */
  closeOnPointerDownOutside?: boolean
}

/**
 * Shared portal popover behavior for player toolbar widgets: mount gate, Floating UI ref
 * sync, hide-until-positioned, Escape with focus return, and pointerdown-outside dismiss.
 */
export function usePlayerPopover({
  widgetId,
  isOpen,
  setIsOpen,
  triggerRef,
  popoverRef,
  floatingRefs,
  update,
  closeOnPointerDownOutside = true
}: UsePlayerPopoverOptions) {
  const [mounted, setMounted] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)

  const close = useCallback(() => setIsOpen(false), [setIsOpen])

  useEffect(() => {
    setMounted(true)
  }, [])

  useRegisterPlayerPopover(widgetId, isOpen)

  useEffect(() => {
    if (triggerRef.current) {
      floatingRefs.setReference(triggerRef.current)
    }
  }, [floatingRefs, triggerRef])

  useEffect(() => {
    if (!isOpen || !popoverRef.current) return

    floatingRefs.setFloating(popoverRef.current)
    update()
    const frame = requestAnimationFrame(() => setIsPositioned(true))
    return () => cancelAnimationFrame(frame)
  }, [isOpen, floatingRefs, popoverRef, update])

  useEffect(() => {
    if (!isOpen) setIsPositioned(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !closeOnPointerDownOutside) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [close, closeOnPointerDownOutside, isOpen, popoverRef, triggerRef])

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
  }, [close, isOpen, popoverRef, triggerRef])

  return { mounted, isPositioned, close }
}
