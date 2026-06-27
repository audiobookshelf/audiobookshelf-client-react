'use client'

import Tooltip from '@/components/ui/Tooltip'
import { useTruncation } from '@/hooks/useTruncation'
import { mergeClasses } from '@/lib/merge-classes'

interface TruncatingTooltipTextProps {
  text: string
  className: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * If the text is truncated, a tooltip will be shown.
 */
export default function TruncatingTooltipText({ text, className, position = 'top' }: TruncatingTooltipTextProps) {
  const { ref, isTruncated } = useTruncation(text, false)
  return (
    <Tooltip text={text} position={position} disabled={!isTruncated} className="block w-full">
      <p ref={ref} className={mergeClasses('truncate', className)}>
        {text}
      </p>
    </Tooltip>
  )
}
