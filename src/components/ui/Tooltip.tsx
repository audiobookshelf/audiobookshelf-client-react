'use client'

import { MODAL_ROOT_SELECTOR } from '@/components/modals/Modal'
import { useModalRef } from '@/contexts/ModalContext'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { mergeClasses } from '@/lib/merge-classes'
import { type Placement, arrow as arrowMw, autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react-dom'
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const OFFSET_PX = 8
const EDGE_PADDING = 8
const LAZY_ACTIVATION_DELAY_MS = 400
const LAZY_UNMOUNT_DELAY_MS = 150

interface TooltipProps {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: number
  /** Defer mounting the portaled label until hover (after a delay). Use in dense UIs or long lists. */
  lazy?: boolean
}

/** Extra interaction options used by HelpTooltipIcon, TruncatingTooltipText, and similar wrappers. */
interface TooltipCoreProps extends TooltipProps {
  /** Suppress the tooltip and skip rendering the portaled label — internal wrappers only (e.g. TruncatingTooltipText). */
  disabled?: boolean
  /** Classes for the reference/trigger wrapper — internal wrappers only; use a layout div at call sites. */
  className?: string
  /** Classes for the portaled floating label — internal wrappers only. */
  tooltipClassName?: string
  /** Use a span reference element so the trigger is valid inside phrasing content (e.g. `<p>`). */
  inline?: boolean
  /** Tap to toggle instead of hover — used on touch-primary devices. */
  openOnClick?: boolean
  /** When false, hover-only activation — focus on children does not open the tooltip. Defaults to false when `lazy`. */
  activateOnFocus?: boolean
  closeOnClick?: boolean
  /** Make the reference focusable when the child is not (tests and rare a11y cases). */
  addTabIndex?: boolean
}

const placementMap: Record<NonNullable<TooltipProps['position']>, Placement> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right'
}

/** Prefer vertical fallbacks before flipping to the opposite horizontal side (e.g. right → top, not left). */
function getTooltipFlipFallbackPlacements(position: NonNullable<TooltipProps['position']>): Placement[] {
  switch (position) {
    case 'right':
      return ['top', 'bottom', 'left']
    case 'left':
      return ['top', 'bottom', 'right']
    case 'top':
      return ['bottom', 'left', 'right']
    case 'bottom':
      return ['top', 'left', 'right']
  }
}

function TooltipCore({
  text,
  children,
  position = 'right',
  className,
  maxWidth,
  tooltipClassName,
  disabled = false,
  lazy = false,
  inline = false,
  openOnClick = false,
  activateOnFocus: activateOnFocusProp,
  closeOnClick = false,
  addTabIndex = false
}: TooltipCoreProps) {
  const activationDelayMs = lazy ? LAZY_ACTIVATION_DELAY_MS : 0
  const activateOnFocus = activateOnFocusProp ?? !lazy
  const lazyUnmountFloating = lazy // unmount while closed when lazy — see effect below
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [floatingInDom, setFloatingInDom] = useState(!lazyUnmountFloating)
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const activateTimeoutRef = useRef<number | null>(null)
  /** After pointer activation, ignore hover/focus-open until the pointer re-enters (modal overlay triggers mouseleave). */
  const suppressFocusOpenRef = useRef(false)
  const primaryInputCanHover = usePrimaryInputCanHover()

  const modalRef = useModalRef()
  // Portal to modal root when inside a modal, otherwise `document.body`, so the tooltip is not
  // clipped by ancestor `overflow`, trapped under low z-index stacking contexts, or misaligned when
  // a parent has `transform` (e.g. dnd-kit drag).
  const portalRoot = modalRef?.current ?? undefined

  const placement = placementMap[position]

  // Ensure component is mounted before rendering the portaled tooltip (SSR/hydration).
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // When `lazy`, unmount the portaled label while closed to avoid accumulating Floating UI instances.
  useEffect(() => {
    if (!lazyUnmountFloating || open) return
    const timeout = window.setTimeout(() => setFloatingInDom(false), LAZY_UNMOUNT_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [lazyUnmountFloating, open])

  // Positioning middleware (see https://floating-ui.com/docs/useFloating#middleware)
  const middleware = useMemo(() => {
    const mw = [
      offset(OFFSET_PX),
      shift({ padding: EDGE_PADDING }),
      flip({ fallbackPlacements: getTooltipFlipFallbackPlacements(position) }),
      size({
        padding: EDGE_PADDING,
        apply: ({ availableWidth, elements }) => {
          if (maxWidth !== undefined) {
            const effectiveMaxWidth = Math.min(maxWidth, availableWidth)
            Object.assign(elements.floating.style, { maxWidth: `${Math.round(effectiveMaxWidth)}px` })
          }
        }
      }),
      arrowMw({ element: arrowRef })
    ]
    return mw
  }, [maxWidth, position])

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
    // the viewport. Matches the portaled tooltip path (body or modal root).
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
    if (suppressFocusOpenRef.current) return
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

  const onPointerEnter = () => {
    suppressFocusOpenRef.current = false
  }

  // Focus/blur (keyboard a11y)
  const shouldOpenOnFocus = useCallback(() => {
    const reference = refs.reference.current
    if (!(reference instanceof HTMLElement)) return true
    // Keyboard tab focus opens the tooltip; mouse click and programmatic focus (e.g. modal
    // restore after close) should not — those leave a stale label visible over the player.
    return reference.matches(':focus-visible') || reference.querySelector(':focus-visible') !== null
  }, [refs])

  // On hover-primary tooltips, Enter/Space on a focused child (e.g. HelpTooltipIcon's IconBtn)
  // synthesizes a click with detail === 0; mouse clicks have detail > 0 and are ignored here
  // so pointerdown dismiss does not get undone by an accidental toggle.
  const isKeyboardActivation = useCallback(
    (event: React.MouseEvent) => {
      if (event.detail === 0) return true
      return shouldOpenOnFocus()
    },
    [shouldOpenOnFocus]
  )

  const onFocus = () => {
    if (suppressFocusOpenRef.current) return
    if (!disabled && activateOnFocus) {
      // `:focus-visible` is applied after the focus event; defer so keyboard tab opens reliably.
      requestAnimationFrame(() => {
        if (!disabled && activateOnFocus && shouldOpenOnFocus()) openNow()
      })
    }
  }

  const onBlur = (e: React.FocusEvent) => {
    if (activateOnFocus) setOpen(false)

    const related = e.relatedTarget
    if (!(related instanceof Element)) {
      return
    }
    if (related.closest(MODAL_ROOT_SELECTOR)) {
      return
    }
    suppressFocusOpenRef.current = false
  }

  const onReferenceClick = (event: React.MouseEvent) => {
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
      return
    }

    if (!disabled && activateOnFocus && !openOnClick && isKeyboardActivation(event)) {
      clearHideTimeout()
      setOpen((prev) => !prev)
    }
  }

  const handleReferenceClick = openOnClick || closeOnClick || activateOnFocus ? onReferenceClick : undefined

  /** Bubble phase: cancel pending/open tooltips when the user presses a child control (e.g. tap on mobile). */
  const onReferencePointerDown = () => {
    if (!openOnClick) {
      dismissTooltip()
      suppressFocusOpenRef.current = true
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

  const tooltipClass = mergeClasses(
    'inline-block whitespace-normal break-words text-center',
    'rounded-sm bg-primary text-foreground text-xs px-2 py-1 shadow-lg z-[1000]',
    'transition-opacity duration-300',
    open ? 'opacity-100' : 'opacity-0',
    'pointer-events-none',
    tooltipClassName
  )

  const referenceClass = mergeClasses('inline-flex', className)
  const ReferenceElement = inline ? 'span' : 'div'

  const tooltipElement = (
    <div
      ref={refs.setFloating}
      id={tooltipId}
      cy-id="tooltip-floating"
      role="tooltip"
      aria-hidden={!open}
      style={floatingStyles}
      className={tooltipClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {text}
      <div ref={arrowRef} cy-id="tooltip-arrow" style={arrowStyles} className="bg-primary absolute h-2 w-2 rotate-45" />
    </div>
  )

  const portalTarget = portalRoot ?? (typeof document !== 'undefined' ? document.body : null)

  return (
    <ReferenceElement
      cy-id="tooltip-reference"
      tabIndex={addTabIndex ? 0 : undefined}
      ref={refs.setReference}
      className={referenceClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerEnter={onPointerEnter}
      onPointerDown={onReferencePointerDown}
      onFocus={activateOnFocus ? onFocus : undefined}
      onBlur={activateOnFocus ? onBlur : undefined}
      onClick={handleReferenceClick}
      aria-describedby={tooltipId}
    >
      {children}
      {/* Skip rendering the floating element when disabled: the tooltip can't open anyway, and an
          absolutely-positioned element following a transformed reference (e.g. a dnd-kit card during
          drag) can land past the viewport and widen `<body>`. */}
      {mounted && floatingInDom && !disabled && portalTarget && createPortal(tooltipElement, portalTarget)}
    </ReferenceElement>
  )
}

function Tooltip(props: TooltipProps) {
  return <TooltipCore {...props} />
}

export default Tooltip
export { TooltipCore, LAZY_ACTIVATION_DELAY_MS }
export type { TooltipCoreProps, TooltipProps }
