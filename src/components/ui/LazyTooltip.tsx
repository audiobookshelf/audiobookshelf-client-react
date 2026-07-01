'use client'

import Tooltip, { type TooltipProps } from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface LazyTooltipProps extends TooltipProps {
  /** Milliseconds to wait after hover before mounting the full Tooltip. Keyboard focus activates immediately. */
  activationDelayMs?: number
}

/**
 * Defers mounting Floating UI until hover (after a delay) or focus, matching Vue tooltip behavior.
 * Unmounts the full Tooltip again once it closes so rows do not accumulate floating-ui instances.
 */
export default function LazyTooltip({ className, children, disabled = false, activationDelayMs = 400, ...tooltipProps }: LazyTooltipProps) {
  const [activated, setActivated] = useState(false)
  const activateTimeoutRef = useRef<number | null>(null)

  const clearActivateTimeout = useCallback(() => {
    if (activateTimeoutRef.current != null) {
      clearTimeout(activateTimeoutRef.current)
      activateTimeoutRef.current = null
    }
  }, [])

  useEffect(() => clearActivateTimeout, [clearActivateTimeout])

  const activateNow = useCallback(() => {
    clearActivateTimeout()
    if (!disabled) {
      setActivated(true)
    }
  }, [clearActivateTimeout, disabled])

  const scheduleActivate = useCallback(() => {
    if (disabled || activated) {
      return
    }
    clearActivateTimeout()
    activateTimeoutRef.current = window.setTimeout(activateNow, activationDelayMs)
  }, [activated, activationDelayMs, activateNow, clearActivateTimeout, disabled])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setActivated(false)
    }
  }, [])

  if (disabled) {
    return <div className={mergeClasses('inline-flex', className)}>{children}</div>
  }

  if (!activated) {
    return (
      <div className={mergeClasses('inline-flex', className)} onMouseEnter={scheduleActivate} onMouseLeave={clearActivateTimeout} onFocusCapture={activateNow}>
        {children}
      </div>
    )
  }

  return (
    <Tooltip {...tooltipProps} disabled={disabled} className={className} defaultOpen onOpenChange={handleOpenChange}>
      {children}
    </Tooltip>
  )
}
