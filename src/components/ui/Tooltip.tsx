'use client'

import { useModalRef } from '@/contexts/ModalContext'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { mergeClasses } from '@/lib/merge-classes'
import { type Placement, arrow as arrowMw, autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react-dom'
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  usePortal?: boolean
  className?: string
  offsetPx?: number
  edgePadding?: number
  maxWidth?: number
  withArrow?: boolean
  closeOnClick?: boolean
  tooltipClassName?: string
  disabled?: boolean
  addTabIndex?: boolean
  openOnClick?: boolean
  /** Defer mounting the portaled label until hover (after a delay). Use in dense UIs or long lists. */
  lazy?: boolean
  /** When true, tooltip starts open on mount (used when lazy-mounting on first hover). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Delay (ms) before showing on hover. Defaults to 400 when `lazy`, otherwise 0. */
  activationDelayMs?: number
  /** When false, hover-only activation — focus on children does not open the tooltip. Defaults to false when `lazy`. */
  activateOnFocus?: boolean
  /** When true, unmount the portaled label while closed to avoid accumulating Floating UI instances. Defaults to `lazy`. */
  lazyUnmountFloating?: boolean
}

const placementMap: Record<NonNullable<TooltipProps['position']>, Placement> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right'
}

const Tooltip = ({
  text,
  children,
  position = 'right',
  // Default true: portal to `document.body` or modal root so the tooltip is not clipped by
  // ancestor `overflow`, trapped under low z-index stacking contexts, or misaligned when a
  // parent has `transform` (e.g. dnd-kit drag). Opt out with `usePortal={false}` when in-tree
  // rendering is intentional.
  usePortal: usePortalProp = true,
  className,
  offsetPx = 8,
  edgePadding = 8,
  maxWidth,
  withArrow = true,
  closeOnClick = false,
  tooltipClassName,
  disabled = false,
  addTabIndex = false,
  openOnClick = false,
  lazy = false,
  defaultOpen = false,
  onOpenChange,
  activationDelayMs: activationDelayMsProp,
  activateOnFocus: activateOnFocusProp,
  lazyUnmountFloating: lazyUnmountFloatingProp
}: TooltipProps) => {
  const activationDelayMs = activationDelayMsProp ?? (lazy ? 400 : 0)
  const activateOnFocus = activateOnFocusProp ?? !lazy
  const lazyUnmountFloating = lazyUnmountFloatingProp ?? lazy
  const tooltipId = useId()
  const [open, setOpen] = useState(defaultOpen)
  const [mounted, setMounted] = useState(false)
  const [floatingInDom, setFloatingInDom] = useState(!lazyUnmountFloating || defaultOpen)
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const activateTimeoutRef = useRef<number | null>(null)
  const primaryInputCanHover = usePrimaryInputCanHover()

  const modalRef = useModalRef()
  const portalRoot = modalRef?.current ?? undefined
  const usePortal = usePortalProp || Boolean(portalRoot)

  const placement = placementMap[position]

  // Ensure component is mounted before rendering tooltip
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  const clearActivateTimeout = useCallback(() => {
    if (activateTimeoutRef.current != null) {
      clearTimeout(activateTimeoutRef.current)
      activateTimeoutRef.current = null
    }
  }, [])

  useEffect(() => clearActivateTimeout, [clearActivateTimeout])

  useEffect(() => {
    if (open) {
      setFloatingInDom(true)
    }
  }, [open])

  useEffect(() => {
    if (!lazyUnmountFloating || open) return
    const timeout = window.setTimeout(() => setFloatingInDom(false), 150)
    return () => clearTimeout(timeout)
  }, [lazyUnmountFloating, open])

  // Positioning middleware (see https://floating-ui.com/docs/useFloating#middleware)
  const middleware = useMemo(() => {
    const mw = [
      offset(offsetPx),
      shift({ padding: edgePadding }),
      flip({ fallbackAxisSideDirection: 'start' }),
      size({
        padding: edgePadding,
        apply: ({ availableWidth, elements }) => {
          if (maxWidth !== undefined) {
            const effectiveMaxWidth = Math.min(maxWidth, availableWidth)
            Object.assign(elements.floating.style, { maxWidth: `${Math.round(effectiveMaxWidth)}px` })
          }
        }
      })
    ]
    if (withArrow) mw.push(arrowMw({ element: arrowRef }))
    return mw
  }, [offsetPx, edgePadding, maxWidth, withArrow])

  const {
    update,
    refs, // { setReference, setFloating, reference, floating }
    elements,
    floatingStyles,
    placement: resolvedPlacement,
    middlewareData
  } = useFloating({
    open,
    placement,
    // `fixed` keeps the floating element attached to the viewport so it doesn't widen `<body>`
    // when its reference sits near the right edge or is being transformed (e.g. dnd-kit cards
    // during a drag). Functionally identical to `absolute` for our usage — Floating UI applies
    // the same computed `top/left` either way, and the `shift` middleware keeps the tooltip in
    // the viewport. Matches the default portaled tooltip path (body or modal root).
    strategy: 'fixed',
    middleware
  })

  useEffect(() => {
    if (open && elements.floating && elements.reference) {
      const cleanup = autoUpdate(elements.reference, elements.floating, update)
      return () => cleanup()
    }
  }, [open, elements.floating, elements.reference, update])

  // Tiny hide delay so moving between ref/tooltip doesn't flicker
  const hideTimeoutRef = useRef<number | null>(null)
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current != null) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])
  useEffect(() => () => clearHideTimeout(), [clearHideTimeout])

  const openNow = useCallback(() => {
    clearHideTimeout()
    setOpen(true)
  }, [clearHideTimeout])

  const dismissTooltip = useCallback(() => {
    clearActivateTimeout()
    clearHideTimeout()
    setOpen(false)
  }, [clearActivateTimeout, clearHideTimeout])

  const closeSoon = useCallback(() => {
    clearHideTimeout()
    hideTimeoutRef.current = window.setTimeout(() => setOpen(false), 100)
  }, [clearHideTimeout])

  const onMouseEnter = () => {
    if (disabled || openOnClick || !primaryInputCanHover) return
    if (activationDelayMs > 0) {
      clearActivateTimeout()
      activateTimeoutRef.current = window.setTimeout(openNow, activationDelayMs)
      return
    }
    openNow()
  }

  const onMouseLeave = () => {
    if (!openOnClick) {
      clearActivateTimeout()
      closeSoon()
    }
  }

  // Focus/blur (keyboard a11y)
  const onFocus = () => {
    if (!disabled && !openOnClick && activateOnFocus) openNow()
  }

  const onBlur = () => {
    if (!openOnClick) setOpen(false)
  }

  const onReferenceClick = () => {
    if (closeOnClick) {
      closeSoon()

      // Blur any focused child elements to prevent tooltip from re-opening
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement !== document.body) {
        // Check if the active element is a child of our reference element
        if (refs.reference.current instanceof HTMLElement && refs.reference.current.contains(activeElement)) {
          activeElement.blur()
        }
      }
      return
    }

    if (!disabled && openOnClick) {
      clearHideTimeout()
      setOpen((prev) => !prev)
    }
  }

  const handleReferenceClick = openOnClick || closeOnClick ? onReferenceClick : undefined

  /** Bubble phase: cancel pending/open tooltips when the user presses a child control (e.g. tap on mobile). */
  const onReferencePointerDown = () => {
    if (!openOnClick) {
      dismissTooltip()
    }
  }

  // Add aria-describedby to the first element child of the container
  useEffect(() => {
    if (refs.reference.current instanceof Element) {
      const firstChild = refs.reference.current.firstElementChild as HTMLElement
      if (firstChild) {
        firstChild.setAttribute('aria-describedby', tooltipId)
      }
    }
  }, [tooltipId, refs.reference])

  // Escape to dismiss
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open, refs.reference, refs.floating])

  // Tap-outside dismiss for click-triggered tooltips (hover/blur paths are unreliable on touch).
  useEffect(() => {
    if (!open || !openOnClick) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      const reference = refs.reference.current
      const floating = elements.floating
      if (reference instanceof Element && reference.contains(target)) return
      if (floating instanceof Element && floating.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, openOnClick, refs.reference, elements.floating])

  // If reference goes offscreen entirely, hide tooltip
  useEffect(() => {
    if (!open) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].intersectionRatio === 0) setOpen(false)
      },
      { root: null, threshold: 0 }
    )
    const refEl = refs.reference.current
    if (refEl instanceof Element) io.observe(refEl)
    return () => io.disconnect()
  }, [open, refs.reference])

  // Position the arrow
  const arrowStyles = useMemo<React.CSSProperties>(() => {
    if (!withArrow) return {}
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
  }, [middlewareData.arrow, resolvedPlacement, withArrow])

  const tooltipClass = mergeClasses(
    'inline-block whitespace-normal break-words text-center',
    'rounded-sm bg-primary text-foreground text-xs px-2 py-1 shadow-lg z-[1000]',
    'transition-opacity duration-300',
    open ? 'opacity-100' : 'opacity-0',
    'pointer-events-none',
    tooltipClassName
  )

  const referenceClass = mergeClasses('inline-flex', className)

  const tooltipElement = (
    <div
      ref={refs.setFloating}
      id={tooltipId}
      role="tooltip"
      aria-hidden={!open}
      style={floatingStyles}
      className={tooltipClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {text}
      {withArrow && <div ref={arrowRef} style={arrowStyles} className="bg-primary absolute h-2 w-2 rotate-45" />}
    </div>
  )

  return (
    <div
      tabIndex={addTabIndex ? 0 : undefined}
      ref={refs.setReference}
      className={referenceClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onReferencePointerDown}
      onFocus={activateOnFocus && !openOnClick && primaryInputCanHover ? onFocus : undefined}
      onBlur={!openOnClick ? onBlur : undefined}
      onClick={handleReferenceClick}
      aria-describedby={tooltipId}
    >
      {children}
      {/* Skip rendering the floating element when disabled: the tooltip can't open anyway, and an
          absolutely-positioned element following a transformed reference (e.g. a dnd-kit card during
          drag) can land past the viewport and widen `<body>`. */}
      {mounted &&
        floatingInDom &&
        !disabled &&
        (usePortal
          ? portalRoot
            ? createPortal(tooltipElement, portalRoot)
            : typeof document !== 'undefined'
              ? createPortal(tooltipElement, document.body)
              : null
          : tooltipElement)}
    </div>
  )
}

export default Tooltip
export type { TooltipProps }
