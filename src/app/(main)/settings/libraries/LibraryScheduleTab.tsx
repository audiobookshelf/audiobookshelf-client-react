'use client'

import Checkbox from '@/components/ui/Checkbox'
import CronExpressionBuilder from '@/components/widgets/CronExpressionBuilder'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LibrarySettings } from '@/types/api'
import { useState } from 'react'

const DEFAULT_CRON = '0 0 * * 1'

interface LibraryScheduleTabProps {
  settings: LibrarySettings
  onSettingsChange: (updater: (prev: LibrarySettings) => LibrarySettings) => void
}

export default function LibraryScheduleTab({ settings, onSettingsChange }: LibraryScheduleTabProps) {
  const t = useTypeSafeTranslations()
  const [enableAutoScan, setEnableAutoScan] = useState(() => !!settings.autoScanCronExpression)
  const [cronExpression, setCronExpression] = useState(() => settings.autoScanCronExpression || DEFAULT_CRON)
  const [isValid, setIsValid] = useState(true)

  const emitChange = (expression: string | null) => {
    onSettingsChange((prev) => ({
      ...prev,
      autoScanCronExpression: expression
    }))
  }

  const handleToggleEnable = (checked: boolean) => {
    setEnableAutoScan(checked)
    if (!checked) {
      emitChange(null)
    } else {
      if (!cronExpression) {
        setCronExpression(DEFAULT_CRON)
      }
      emitChange(cronExpression || DEFAULT_CRON)
    }
  }

  const handleCronChange = (value: string, valid: boolean) => {
    setCronExpression(value)
    setIsValid(valid)
    if (valid) {
      emitChange(value)
    }
  }

  return (
    <div className="mb-4 h-full w-full px-1 py-1 md:px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-base md:text-lg">{t('HeaderScheduleLibraryScans')}</h2>
        <Checkbox value={enableAutoScan} onChange={handleToggleEnable} label={t('LabelEnable')} size="medium" />
      </div>

      {enableAutoScan ? (
        <>
          <CronExpressionBuilder value={cronExpression} onChange={handleCronChange} />
          <CronExpressionPreview cronExpression={cronExpression} isValid={isValid} />
        </>
      ) : (
        <p className="text-base text-yellow-400">{t('MessageScheduleLibraryScanNote')}</p>
      )}
    </div>
  )
}
