'use client'

import { useModalRef } from '@/contexts/ModalContext'
import { mergeClasses } from '@/lib/merge-classes'
import type { Placement } from '@floating-ui/dom'
import { arrow as arrowMw, autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react-dom'
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
  usePortal: usePortalProp = false,
  className,
  offsetPx = 8,
  edgePadding = 8,
  maxWidth,
  withArrow = true,
  closeOnClick = false
}: TooltipProps) => {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const arrowRef = useRef<HTMLDivElement | null>(null)

  const modalRef = useModalRef()
  const portalRoot = modalRef?.current ?? undefined
  const usePortal = usePortalProp || Boolean(portalRoot)

  const placement = placementMap[position]

  // Ensure component is mounted before rendering tooltip
  useEffect(() => {
    setMounted(true)
  }, [])

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
    strategy: 'absolute',
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

  const closeSoon = useCallback(() => {
    clearHideTimeout()
    hideTimeoutRef.current = window.setTimeout(() => setOpen(false), 100)
  }, [clearHideTimeout])

  const onMouseEnter = useCallback(() => {
    openNow()
  }, [openNow])

  const onMouseLeave = useCallback(() => {
    closeSoon()
  }, [closeSoon])

  // Focus/blur (keyboard a11y)
  const onFocus = useCallback(() => {
    openNow()
  }, [openNow])

  const onBlur = useCallback(() => {
    setOpen(false)
  }, [])

  // Handle click to close (used when child opens an external link)
  const onClick = useCallback(() => {
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
    }
  }, [closeSoon, closeOnClick, refs.reference])

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

  const tooltipClass = useMemo(
    () =>
      mergeClasses(
        'inline-block whitespace-normal break-words text-center',
        'rounded-sm bg-primary text-white text-xs px-2 py-1 shadow-lg z-[1000]',
        'transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ),
    [open]
  )

  const referenceClass = useMemo(() => {
    return mergeClasses('inline-flex', className)
  }, [className])

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
      <span dangerouslySetInnerHTML={{ __html: text }} />
      {withArrow && <div ref={arrowRef} style={arrowStyles} className="absolute w-2 h-2 rotate-45 bg-primary" />}
    </div>
  )

  return (
    <div
      ref={refs.setReference}
      className={referenceClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
    >
      {children}
      {mounted &&
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
