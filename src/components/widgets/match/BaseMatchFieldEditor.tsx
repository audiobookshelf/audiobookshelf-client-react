'use client'

import Checkbox from '@/components/ui/Checkbox'
import { mergeClasses } from '@/lib/merge-classes'
import { ReactNode } from 'react'

interface BaseMatchFieldEditorProps {
  usageChecked: boolean
  onUsageChange: (checked: boolean) => void
  currentValueDisplay?: ReactNode
  isCheckboxField?: boolean
  hasCurrentValue?: boolean
  className?: string
  children: ReactNode
}

export function BaseMatchFieldEditor({
  usageChecked,
  onUsageChange,
  currentValueDisplay,
  isCheckboxField = false,
  hasCurrentValue = false,
  className,
  children
}: BaseMatchFieldEditorProps) {
  const wrapperClass = isCheckboxField ? mergeClasses('flex items-center pb-2', hasCurrentValue ? '' : 'pt-2') : 'flex items-center py-2'

  const contentClass = isCheckboxField ? mergeClasses('grow ml-4', hasCurrentValue ? 'pt-4' : '', className) : mergeClasses('grow ml-4', className)

  return (
    <div className={wrapperClass}>
      <Checkbox value={usageChecked} onChange={onUsageChange} checkboxBgClass="bg-bg" />
      <div className={contentClass}>
        {children}
        {hasCurrentValue && currentValueDisplay && <p className="text-xs ml-1 text-foreground-subdued">{currentValueDisplay}</p>}
      </div>
    </div>
  )
}
