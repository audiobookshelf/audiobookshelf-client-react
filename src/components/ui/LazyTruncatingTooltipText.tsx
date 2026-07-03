'use client'

import LazyTooltip from '@/components/ui/LazyTooltip'
import { usePrimaryInputCanHover } from '@/contexts/SortableCompilationContext'
import { useTruncation } from '@/hooks/useTruncation'
import { mergeClasses } from '@/lib/merge-classes'

interface LazyTruncatingTooltipTextProps {
  text: string
  className: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: number
}

/**
 * Styled tooltip for truncated text. Floating UI mounts only on hover, and only when ellipsis is active.
 * On touch devices, tap toggles the tooltip instead of expanding the text.
 */
export default function LazyTruncatingTooltipText({ text, className, position = 'top', maxWidth }: LazyTruncatingTooltipTextProps) {
  const { ref, isTruncated } = useTruncation(text, false)
  const primaryInputCanHover = usePrimaryInputCanHover()
  const useClickTooltip = !primaryInputCanHover && isTruncated

  return (
    <LazyTooltip
      text={text}
      position={position}
      maxWidth={maxWidth}
      disabled={!isTruncated}
      openOnClick={useClickTooltip}
      className="block w-full min-w-0 overflow-hidden"
    >
      <p ref={ref} className={mergeClasses('min-w-0 truncate select-none', className)}>
        {text}
      </p>
    </LazyTooltip>
  )
}
