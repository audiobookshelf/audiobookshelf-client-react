'use client'

import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { calculateNextRunDate, getCronExpressionOptions, getHumanReadableCronExpression, validateCron, type FormatDateOptions } from '@/lib/cron'
import { capitalizeFirstLetter } from '@/lib/string'
import { useEffect, useMemo, useState } from 'react'

interface CronExpressionPreviewProps {
  cronExpression: string
  isValid?: boolean
  options?: FormatDateOptions
}

export default function CronExpressionPreview({ cronExpression, isValid: isValidProp, options }: CronExpressionPreviewProps) {
  const t = useTypeSafeTranslations()
  const { serverSettings } = useUser()
  const resolvedOptions = useMemo(() => options ?? getCronExpressionOptions(serverSettings), [options, serverSettings])
  const [clientTimeZone, setClientTimeZone] = useState<string | null>(null)

  useEffect(() => {
    setClientTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const { isValid, verbalDescription, nextRunDate } = useMemo(() => {
    const isValid = isValidProp !== undefined ? isValidProp : validateCron(cronExpression).isValid
    const verbalDescription = isValid ? getHumanReadableCronExpression(cronExpression, resolvedOptions.language || 'en') : ''
    const nextRunDate = isValid ? capitalizeFirstLetter(calculateNextRunDate(cronExpression, resolvedOptions, clientTimeZone)) : ''

    return { isValid, verbalDescription, nextRunDate }
  }, [cronExpression, isValidProp, resolvedOptions, clientTimeZone])

  if (!isValid || !cronExpression) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-x-2 gap-y-1 sm:grid-cols-[auto_1fr] sm:gap-y-2">
      <div className="flex items-center">
        <span className="material-symbols text-foreground mr-2">schedule</span>
        <p className="text-foreground font-medium">{t('LabelSchedule')}:</p>
      </div>
      <p className="text-foreground" cy-id="cron-description">
        {verbalDescription}
      </p>

      <div className="mt-2 flex items-center sm:mt-0">
        <span className="material-symbols text-foreground mr-2">event</span>
        <p className="text-foreground font-medium">{t('LabelNextRun')}:</p>
      </div>
      <p className="text-foreground">{nextRunDate || t('LabelNotAvailable')}</p>
    </div>
  )
}
