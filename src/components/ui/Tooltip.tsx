import React, { useState, useId, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useModalRef } from '@/contexts/ModalContext'
import { mergeClasses } from '@/lib/merge-classes'

// Define the component's props
interface TooltipProps {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  usePortal?: boolean
}

const Tooltip = ({ text, children, position = 'right', usePortal: usePortalProp = false }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: string; left: string }>({
    top: '0px',
    left: '0px'
  })
  const modalRef = useModalRef()
  const portalContainerRef = modalRef || undefined
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  // Generate a unique, stable ID for ARIA attributes
  const tooltipId = useId()

  const usePortal: boolean = usePortalProp || modalRef !== null

  // Add event listener for the Escape key to hide the tooltip
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible])

  // Calculate tooltip position when portal is used
  const calculatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) return

    const triggerRect = containerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    // portalRect is the bounding box of the portal container or the document body
    const portalRect = portalContainerRef ? portalContainerRef.current?.getBoundingClientRect() : { top: 0, left: 0 }
    const scrollY = portalContainerRef ? portalContainerRef.current?.scrollTop : window.scrollY
    const scrollX = portalContainerRef ? portalContainerRef.current?.scrollLeft : window.scrollX
    const margin = 4

    const baseTop = triggerRect.top - portalRect.top + scrollY
    const baseLeft = triggerRect.left - portalRect.left + scrollX

    let top: string, left: string

    switch (position) {
      case 'top':
        top = `${baseTop - tooltipRect.height - margin}px`
        left = `${baseLeft + triggerRect.width / 2 - tooltipRect.width / 2}px`
        break
      case 'bottom':
        top = `${baseTop + triggerRect.height + margin}px`
        left = `${baseLeft + triggerRect.width / 2 - tooltipRect.width / 2}px`
        break
      case 'left':
        top = `${baseTop + triggerRect.height / 2 - tooltipRect.height / 2}px`
        left = `${baseLeft - tooltipRect.width - margin}px`
        break
      case 'right':
      default:
        top = `${baseTop + triggerRect.height / 2 - tooltipRect.height / 2}px`
        left = `${baseLeft + triggerRect.width + margin}px`
        break
    }

    setTooltipPosition({ top, left })
  }, [position])

  // Add aria-describedby to the first element child of the container
  useEffect(() => {
    if (containerRef.current) {
      const firstChild = containerRef.current.firstElementChild as HTMLElement
      if (firstChild) {
        firstChild.setAttribute('aria-describedby', tooltipId)
      }
    }
  }, [tooltipId])

  // Update position when tooltip becomes visible and portal is used
  useEffect(() => {
    if (isVisible && usePortal) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        calculatePosition()
      })
    }
  }, [isVisible, usePortal, calculatePosition])

  const handleResize = useCallback(() => calculatePosition(), [calculatePosition])
  const handleScroll = useCallback(() => calculatePosition(), [calculatePosition])

  // Handle window resize and scroll when portal is used
  useEffect(() => {
    if (!isVisible || !usePortal) return

    const scrollTarget = portalContainerRef?.current || window

    window.addEventListener('resize', handleResize)
    scrollTarget.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      scrollTarget.removeEventListener('scroll', handleScroll, true)
    }
  }, [isVisible, usePortal, calculatePosition])

  // Determine the position classes for the tooltip
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1'
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-1'
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-1'
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-1'
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1'
    }
  }, [position])

  const tooltipClasses = useMemo(
    () =>
      mergeClasses(
        'absolute',
        usePortal ? '' : positionClasses,
        'bg-primary text-white text-xs',
        'px-2 py-1 rounded-sm shadow-lg z-50',
        'whitespace-nowrap',
        'transition-opacity duration-300',
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ),
    [usePortal, isVisible, positionClasses]
  )

  const tooltipElement = useMemo(
    () => (
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        aria-hidden={!isVisible}
        className={tooltipClasses}
        style={
          usePortal
            ? {
                position: 'absolute',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                zIndex: 9999
              }
            : undefined
        }
      >
        {text}
      </div>
    ),
    [tooltipRef, tooltipId, isVisible, tooltipClasses, usePortal, tooltipPosition.top, tooltipPosition.left, text]
  )

  const handleMouseEnter = useCallback(() => setIsVisible(true), [])
  const handleMouseLeave = useCallback(() => setIsVisible(false), [])
  const handleFocus = useCallback(() => setIsVisible(true), [])
  const handleBlur = useCallback(() => setIsVisible(false), [])

  return (
    <div
      ref={containerRef}
      className="relative inline-block w-fit"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {!usePortal && tooltipElement}
      {usePortal && typeof document !== 'undefined' && createPortal(tooltipElement, portalContainerRef?.current || document.body)}
    </div>
  )
}
export default Tooltip
