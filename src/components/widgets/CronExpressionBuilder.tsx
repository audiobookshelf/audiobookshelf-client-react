'use client'

import { useState, useEffect, useMemo } from 'react'
import { validateCron } from '@/lib/cron'
import CronExpressionControls from './CronExpressionControls'
import CronExpressionPreview from './CronExpressionPreview'

interface CronExpressionBuilderProps {
  currentCronValue: string
  onChange?: (value: string, isInvalid?: boolean) => void
}

export default function CronExpressionBuilder({ currentCronValue, onChange }: CronExpressionBuilderProps) {
  const [isValid, setIsValid] = useState<boolean>(true)

  // Validate cron expression whenever it changes
  useEffect(() => {
    const validationResult = validateCron(currentCronValue)
    setIsValid(validationResult.isValid)
  }, [currentCronValue])

  // Determine if we should show the preview (hide when in advanced mode with invalid cron)
  const showPreview = useMemo(() => {
    if (!isValid) {
      // Only hide preview if the cron is invalid
      return false
    }
    return true
  }, [isValid])

  return (
    <div className="w-full py-2" cy-id="cron-expression-builder">
      <CronExpressionControls 
        currentCronValue={currentCronValue} 
        onChange={onChange} 
      />
      
      <CronExpressionPreview 
        cronExpression={currentCronValue}
        isValid={isValid}
        showPreview={showPreview}
      />
    </div>
  )
}