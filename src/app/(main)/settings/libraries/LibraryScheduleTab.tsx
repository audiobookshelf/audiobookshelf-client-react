'use client'

import Checkbox from '@/components/ui/Checkbox'
import RangeInput from '@/components/ui/RangeInput'
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

  const handleMatchAfterScanChange = (checked: boolean) => {
    onSettingsChange((prev) => ({
      ...prev,
      matchAfterScan: checked
    }))
  }

  const handleMatchConfidenceChange = (percentage: number) => {
    const rounded = Math.round(percentage)
    onSettingsChange((prev) => ({
      ...prev,
      matchMinConfidence: rounded / 100
    }))
  }

  return (
    <div className="mb-4 h-full w-full px-1 py-1 md:px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-base md:text-lg">{t('HeaderScheduleLibraryScans')}</h2>
        <Checkbox value={enableAutoScan} onChange={handleToggleEnable} label={t('LabelEnable')} size="medium" checkboxBgClass="bg-primary" />
      </div>

      {enableAutoScan ? (
        <div className="flex flex-col gap-2">
          <CronExpressionBuilder value={cronExpression} onChange={handleCronChange} />
          <CronExpressionPreview cronExpression={cronExpression} isValid={isValid} />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Checkbox
              value={!!settings.matchAfterScan}
              onChange={handleMatchAfterScanChange}
              label={t('LabelMatchAfterScan')}
              size="medium"
              checkboxBgClass="bg-bg"
              className="shrink-0"
            />
            {settings.matchAfterScan && (
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-medium whitespace-nowrap">{t('LabelMatchMinConfidence')}:</span>
                <div className="w-44 sm:w-56">
                  <RangeInput value={Math.round((settings.matchMinConfidence ?? 0) * 100)} min={0} max={100} step={1} onChange={handleMatchConfidenceChange} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-base text-yellow-400">{t('MessageScheduleLibraryScanNote')}</p>
      )}
    </div>
  )
}
