'use client'

import { TooltipCore } from '@/components/ui/Tooltip'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { useTruncation } from '@/hooks/useTruncation'
import { mergeClasses } from '@/lib/merge-classes'

export interface TruncatingTooltipTextProps {
  text: string
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: number
  /** Defer mounting the portaled tooltip until hover — use in long lists. */
  lazy?: boolean
}

const wrapperClassName = 'block w-full min-w-0 overflow-hidden'

/**
 * If text is truncated, show the full string in a tooltip on hover (pointer) or tap (touch).
 */
export default function TruncatingTooltipText({ text, className, position = 'top', maxWidth, lazy = false }: TruncatingTooltipTextProps) {
  const { ref, isTruncated } = useTruncation(text, false)
  const primaryInputCanHover = usePrimaryInputCanHover()
  const openOnClick = !primaryInputCanHover && isTruncated

  return (
    <TooltipCore lazy={lazy} text={text} position={position} maxWidth={maxWidth} disabled={!isTruncated} openOnClick={openOnClick} className={wrapperClassName}>
      <p ref={ref} dir="auto" className={mergeClasses('min-w-0 truncate text-start select-none', className)}>
        {text}
      </p>
    </TooltipCore>
  )
}
