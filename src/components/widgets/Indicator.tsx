import React from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'

interface IndicatorProps {
  tooltipText: string
  children?: React.ReactNode
  className?: string
  ariaLabel?: string
  role?: string
}

const Indicator = ({ tooltipText, children, className, ariaLabel, role = 'note' }: IndicatorProps) => {
  const effectiveAriaLabel = ariaLabel || tooltipText

  return (
    <Tooltip text={tooltipText} position="top">
      {typeof children === 'string' ? (
        <span className={mergeClasses('material-symbols text-sm', className)} role={role} aria-label={effectiveAriaLabel}>
          {children}
        </span>
      ) : (
        <div className={className} role={role} aria-label={effectiveAriaLabel}>
          {children}
        </div>
      )}
    </Tooltip>
  )
}

export default Indicator
