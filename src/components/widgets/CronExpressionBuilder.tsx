'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { getLocalizedServerTimeZone, validateCron, type FormatDateOptions, type ValidationResult } from '@/lib/cron'
import Dropdown from '@/components/ui/Dropdown'
import { MultiSelect } from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import type { MultiSelectItem } from '@/components/ui/MultiSelect'

interface CronExpressionBuilderProps {
  value: string
  onChange?: (value: string, isValid: boolean) => void
  options?: FormatDateOptions
}

export default function CronExpressionBuilder({ value, onChange, options: { language, timeZone } = {} }: CronExpressionBuilderProps) {
  const [selectedInterval, setSelectedInterval] = useState<string>('daily')
  const [customCronError, setCustomCronError] = useState<string>('')

  // Memoize interval options to prevent re-creation on every render.
  const intervalOptions = useMemo(
    () => [
      { text: 'Daily', value: 'daily', canExpress: (expr: string) => /^\d+ \d+ \* \* \*$/.test(expr) },
      { text: 'Weekly', value: 'weekly', canExpress: (expr: string) => /^\d+ \d+ \* \* (\*|(\d+(,\d+)*))$/.test(expr) },
      { text: 'Every 12 Hours', value: '0 */12 * * *', canExpress: (expr: string) => expr === '0 */12 * * *' },
      { text: 'Every 6 Hours', value: '0 */6 * * *', canExpress: (expr: string) => expr === '0 */6 * * *' },
      { text: 'Every 2 Hours', value: '0 */2 * * *', canExpress: (expr: string) => expr === '0 */2 * * *' },
      { text: 'Every Hour', value: '0 * * * *', canExpress: (expr: string) => expr === '0 * * * *' },
      { text: 'Every 30 Minutes', value: '*/30 * * * *', canExpress: (expr: string) => expr === '*/30 * * * *' },
      { text: 'Every 15 Minutes', value: '*/15 * * * *', canExpress: (expr: string) => expr === '*/15 * * * *' },
      { text: 'Custom Cron Expression (advanced)', value: 'advanced', canExpress: () => true }
    ],
    []
  )

  const weekdays = useMemo<MultiSelectItem<string>[]>(() => {
    const formatter = new Intl.DateTimeFormat(language, { weekday: 'long' })

    // Generate localized day names (Sunday = 0, Monday = 1, etc.)
    // Using Jan 7-13, 2024 which is a complete Sun-Sat week
    return Array.from({ length: 7 }, (_, i) => ({
      value: i.toString(),
      content: formatter.format(new Date(2024, 0, 7 + i))
    }))
  }, [language])

  const validation = useMemo<ValidationResult>(() => {
    return validateCron(value)
  }, [value])

  const parsedValues = useMemo<{ hour: number; minute: number; selectedWeekdays: MultiSelectItem<string>[] }>(() => {
    if (!validation.isValid) {
      return { hour: 0, minute: 0, selectedWeekdays: [] }
    }

    const pieces = value.split(' ').filter(Boolean)

    const hour = parseInt(pieces[1]) || 0
    const minute = parseInt(pieces[0]) || 0
    let selectedWeekdays: MultiSelectItem<string>[] = []

    if (pieces[4] && pieces[4] !== '*') {
      const weekdayValues = pieces[4].split(',')
      selectedWeekdays = weekdays.filter((w) => weekdayValues.includes(w.value))
    }

    return { hour, minute, selectedWeekdays }
  }, [value, weekdays, validation])

  // Parse the incoming cron value and set the correct interval type.
  useEffect(() => {
    setCustomCronError(validation.error || '')

    if (!validation.isValid) {
      onChange?.(value, false)
      setSelectedInterval('advanced')
      return
    }

    // Find all interval types that can express this cron expression
    const matchingTypes = intervalOptions.filter((config) => config.canExpress(value))
    setSelectedInterval((currentInterval) => {
      // prefer current interval if it matches
      const matchesCurrent = matchingTypes.some((config) => config.value === currentInterval)
      return matchesCurrent ? currentInterval : matchingTypes[0].value
    })
  }, [value, intervalOptions, validation, onChange])

  const handleIntervalChange = useCallback(
    (newInterval: string) => {
      setSelectedInterval(newInterval)

      if (newInterval === 'daily') {
        onChange?.(`${parsedValues.minute} ${parsedValues.hour} * * *`, true)
      } else if (newInterval === 'weekly') {
        const daysOfWeek =
          parsedValues.selectedWeekdays.length > 0
            ? parsedValues.selectedWeekdays
                .map((w) => w.value)
                .sort()
                .join(',')
            : '*'
        onChange?.(`${parsedValues.minute} ${parsedValues.hour} * * ${daysOfWeek}`, true)
      } else if (newInterval !== 'advanced') {
        onChange?.(newInterval, true)
      }
    },
    [parsedValues, onChange]
  )

  const handleTimeChange = useCallback(
    (newTime: string) => {
      if (!newTime) return

      const [hourStr, minuteStr] = newTime.split(':')
      const newHour = Math.max(0, Math.min(23, parseInt(hourStr) || 0))
      const newMinute = Math.max(0, Math.min(59, parseInt(minuteStr) || 0))

      const pieces = value.split(' ')
      pieces[0] = String(newMinute)
      pieces[1] = String(newHour)
      onChange?.(pieces.join(' '), true)
    },
    [value, onChange]
  )

  const handleWeekdayChange = useCallback(
    (newItems: MultiSelectItem<string>[]) => {
      const sortedItems = [...newItems].sort((a, b) => parseInt(a.value) - parseInt(b.value))
      const daysOfWeek = sortedItems.length === 0 || sortedItems.length === 7 ? '*' : sortedItems.map((w) => w.value).join(',')

      const pieces = value.split(' ')
      pieces[4] = daysOfWeek
      onChange?.(pieces.join(' '), true)
    },
    [value, onChange]
  )

  const handleCustomCronChange = useCallback(
    (newCronExpression: string) => {
      const validationResult = validateCron(newCronExpression)
      onChange?.(newCronExpression, validationResult.isValid)
    },
    [onChange]
  )

  const formatTimeValue = useMemo(() => {
    const hour = String(parsedValues.hour).padStart(2, '0')
    const minute = String(parsedValues.minute).padStart(2, '0')
    return `${hour}:${minute}`
  }, [parsedValues.hour, parsedValues.minute])

  const [clientTimeZone, setClientTimeZone] = useState<string | null>(null)

  useEffect(() => {
    setClientTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const serverTimeZone = useMemo(() => {
    return getLocalizedServerTimeZone(clientTimeZone, timeZone || 'UTC', language || 'en')
  }, [clientTimeZone, timeZone, language])

  return (
    <div className="w-full py-2" cy-id="cron-expression-builder">
      <div style={{ minHeight: '172px' }}>
        <Dropdown
          value={selectedInterval}
          onChange={(value) => handleIntervalChange(String(value))}
          label="Interval"
          items={intervalOptions}
          className="mb-2"
          cy-id="interval-dropdown"
        />

        <div className="flex items-center gap-2 mb-2" cy-id="cron-expression-builder-inputs">
          {(selectedInterval === 'weekly' || selectedInterval === 'daily') && (
            <TextInput
              value={formatTimeValue}
              onChange={handleTimeChange}
              type="time"
              label="Time"
              customInputClass="[&::-webkit-calendar-picker-indicator]:hidden"
              className="w-fit"
              cy-id="time-input"
            />
          )}

          {selectedInterval === 'weekly' && (
            <MultiSelect
              selectedItems={parsedValues.selectedWeekdays}
              items={weekdays}
              label="Weekdays to Run"
              onItemAdded={(item) => handleWeekdayChange([...parsedValues.selectedWeekdays, item])}
              onItemRemoved={(item) => handleWeekdayChange(parsedValues.selectedWeekdays.filter((w) => w.value !== item.value))}
              allowNew={false}
              cy-id="weekdays-multiselect"
            />
          )}

          {selectedInterval === 'advanced' && (
            <div className="w-full">
              <TextInput
                label="Cron Expression"
                value={value}
                onChange={handleCustomCronChange}
                customInputClass={'text-2xl md:text-3xl font-mono text-center'}
                className="w-full mb-2"
                error={customCronError}
                cy-id="cron-expression-input"
              />
            </div>
          )}
        </div>
        {serverTimeZone && (selectedInterval === 'daily' || selectedInterval === 'weekly' || selectedInterval === 'advanced') && (
          <p className="text-sm text-yellow-500">Note: Time should be specified in the server's time zone ({serverTimeZone})</p>
        )}
      </div>
    </div>
  )
}
