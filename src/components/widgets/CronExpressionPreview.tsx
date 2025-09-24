'use client'

import { useMemo, useEffect, useState } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import { validateCron, getHumanReadableCronExpression, calculateNextRunDate } from '@/lib/cron'
import { capitalizeFirstLetter } from '@/lib/string'

interface CronExpressionPreviewProps {
  cronExpression: string
  className?: string
  isValid?: boolean
  options?: {
    language?: string
    dateFormat?: string
    timeFormat?: string
    timeZone?: string
  }
}

export default function CronExpressionPreview({ cronExpression, className, isValid: isValidProp, options }: CronExpressionPreviewProps) {
  const [clientTimeZone, setClientTimeZone] = useState<string | null>(null)

  useEffect(() => {
    setClientTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const { isValid, verbalDescription, nextRunDate } = useMemo(() => {
    const isValid = isValidProp !== undefined ? isValidProp : validateCron(cronExpression).isValid
    const verbalDescription = isValid ? getHumanReadableCronExpression(cronExpression, options?.language || 'en') : ''
    const nextRunDate = isValid ? capitalizeFirstLetter(calculateNextRunDate(cronExpression, options, clientTimeZone)) : ''

    return { isValid, verbalDescription, nextRunDate }
  }, [cronExpression, isValidProp, options, clientTimeZone])

  if (!isValid || !cronExpression) {
    return null
  }

  return (
    <div className={mergeClasses('p-1', className)}>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2">
        <div className="flex items-center">
          <span className="material-symbols mr-2 text-white">schedule</span>
          <p className="font-medium text-white">Schedule:</p>
        </div>
        <p className="text-white" cy-id="cron-description">
          {verbalDescription}
        </p>

        <div className="flex items-center">
          <span className="material-symbols mr-2 text-white">event</span>
          <p className="font-medium text-white">Next Run:</p>
        </div>
        <p className="text-white">{nextRunDate || 'Not available'}</p>
      </div>
    </div>
  )
}
