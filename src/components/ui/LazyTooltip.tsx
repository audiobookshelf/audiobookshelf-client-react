'use client'

import Tooltip, { type TooltipProps } from '@/components/ui/Tooltip'

export interface LazyTooltipProps extends TooltipProps {
  /** Milliseconds to wait after hover before mounting the floating label. */
  activationDelayMs?: number
  /** When false, only hover (or openOnClick) shows the tooltip — not child focus. Default false for action controls. */
  activateOnFocus?: boolean
}

/**
 * Defers mounting the portaled tooltip label until hover (after a delay).
 * Children stay in a stable wrapper and are never remounted by this component.
 */
export default function LazyTooltip({ activationDelayMs = 400, activateOnFocus = false, ...tooltipProps }: LazyTooltipProps) {
  return <Tooltip {...tooltipProps} activationDelayMs={activationDelayMs} activateOnFocus={activateOnFocus} lazyUnmountFloating />
}
