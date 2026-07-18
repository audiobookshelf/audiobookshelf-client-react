'use client'

import { TooltipCore } from '@/components/ui/Tooltip'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { mergeClasses } from '@/lib/merge-classes'
import React from 'react'

interface IndicatorProps {
  tooltipText: string
  children?: React.ReactNode
  className?: string
  ariaLabel?: string
  role?: string
}

const Indicator = ({ tooltipText, children, className, ariaLabel, role = 'note' }: IndicatorProps) => {
  const effectiveAriaLabel = ariaLabel || tooltipText
  const primaryInputCanHover = usePrimaryInputCanHover()

  return (
    <TooltipCore lazy text={tooltipText} position="top" openOnClick={!primaryInputCanHover} className="inline-flex items-center">
      {typeof children === 'string' ? (
        <span className={mergeClasses('material-symbols text-sm', className)} role={role} aria-label={effectiveAriaLabel}>
          {children}
        </span>
      ) : (
        <div className={className} role={role} aria-label={effectiveAriaLabel}>
          {children}
        </div>
      )}
    </TooltipCore>
  )
}

export default Indicator
