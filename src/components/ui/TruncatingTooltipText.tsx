'use client'

import Tooltip from '@/components/ui/Tooltip'
import { useTruncation } from '@/hooks/useTruncation'
import { mergeClasses } from '@/lib/merge-classes'

interface TruncatingTooltipTextProps {
  text: string
  className: string
}

/**
 * If the text is truncated, a tooltip will be shown.
 */
export default function TruncatingTooltipText({ text, className }: TruncatingTooltipTextProps) {
  const { ref, isTruncated } = useTruncation(text, false)
  return (
    <Tooltip text={text} position="top" disabled={!isTruncated} className="block w-full">
      <p ref={ref} className={mergeClasses('truncate', className)}>
        {text}
      </p>
    </Tooltip>
  )
}
