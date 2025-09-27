'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { calculateNextRunDate, getHumanReadableCronExpression, validateCron } from '@/lib/cron'
import { mergeClasses } from '@/lib/merge-classes'
import { capitalizeFirstLetter } from '@/lib/string'
import { useEffect, useMemo, useState } from 'react'

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
  const t = useTypeSafeTranslations()
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
          <p className="font-medium text-white">{t('LabelSchedule')}:</p>
        </div>
        <p className="text-white" cy-id="cron-description">
          {verbalDescription}
        </p>

        <div className="flex items-center">
          <span className="material-symbols mr-2 text-white">event</span>
          <p className="font-medium text-white">{t('LabelNextRun')}:</p>
        </div>
        <p className="text-white">{nextRunDate || t('LabelNotAvailable')}</p>
      </div>
    </div>
  )
}
