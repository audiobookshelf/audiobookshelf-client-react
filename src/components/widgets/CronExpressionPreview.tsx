'use client'

import { useMemo } from 'react'
import { getHumanReadableCronExpression, calculateNextRunDate } from '@/lib/cron'

interface CronExpressionPreviewProps {
  cronExpression: string
  isValid: boolean
  showPreview?: boolean
}

export default function CronExpressionPreview({
  cronExpression,
  isValid,
  showPreview = true
}: CronExpressionPreviewProps) {
  const verbalDescription = useMemo(() => 
    getHumanReadableCronExpression(cronExpression), 
    [cronExpression]
  )

  const nextRunDate = useMemo(() => 
    cronExpression && isValid ? calculateNextRunDate(cronExpression) : '',
    [cronExpression, isValid]
  )

  if (!showPreview || !isValid) {
    return null
  }

  return (
    <div>
      <div className="mb-4 p-3 bg-primary/30 rounded-lg border border-primary/50">
        <div className="flex items-center">
          <span className="material-symbols mr-2 text-blue-400">schedule</span>
          <p className="text-sm font-medium text-gray-300">Schedule:</p>
        </div>
        <p className="text-base font-semibold text-white mt-1" cy-id="cron-description">
          {verbalDescription}
        </p>
        {cronExpression && <p className="text-xs text-gray-400 mt-1 font-mono">{cronExpression}</p>}
      </div>

      {cronExpression && isValid && nextRunDate && (
        <div className="flex items-center justify-center text-yellow-400 mt-2">
          <span className="material-symbols mr-2 text-xl">event</span>
          <p>Next Scheduled Run: {nextRunDate}</p>
        </div>
      )}
    </div>
  )
}