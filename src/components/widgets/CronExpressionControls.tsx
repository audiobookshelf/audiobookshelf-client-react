'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { validateCron } from '@/lib/cron'
import Dropdown from '@/components/ui/Dropdown'
import { MultiSelect } from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import type { MultiSelectItem } from '@/components/ui/MultiSelect'

interface CronExpressionControlsProps {
  currentCronValue: string
  onChange?: (value: string, isInvalid?: boolean) => void
}

export default function CronExpressionControls({ currentCronValue, onChange }: CronExpressionControlsProps) {
  const [selectedInterval, setSelectedInterval] = useState<string>('daily')
  const [customCronError, setCustomCronError] = useState<string>('')

  const customExpressionInputRef = useRef<HTMLInputElement>(null)

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
      { text: 'Custom', value: 'advanced', canExpress: () => true }
    ],
    []
  )

  const weekdays = useMemo<MultiSelectItem<string>[]>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days.map((day, index) => ({ value: index.toString(), content: day }))
  }, [])

  const parsedValues = useMemo(() => {
    const pieces = currentCronValue.split(' ').filter(Boolean)
    if (pieces.length < 5) {
      // Return a default state for invalid or incomplete cron strings.
      return { hour: 0, minute: 0, selectedWeekdays: [] }
    }

    const hour = parseInt(pieces[1]) || 0
    const minute = parseInt(pieces[0]) || 0
    let selectedWeekdays: MultiSelectItem<string>[] = []

    if (pieces[4] && pieces[4] !== '*') {
      const weekdayValues = pieces[4].split(',')
      selectedWeekdays = weekdays.filter((w) => weekdayValues.includes(w.value))
    }

    return { hour, minute, selectedWeekdays }
  }, [currentCronValue, weekdays])

  // Effect to parse the incoming cron value and set the correct UI view.
  useEffect(() => {
    const validationResult = validateCron(currentCronValue)
    setCustomCronError(validationResult.error || '')

    if (!validationResult.isValid) {
      setSelectedInterval('advanced')
      return
    }

    // Find all interval types that can express this cron expression
    const matchingTypes = intervalOptions.filter((config) => config.canExpress(currentCronValue))
    setSelectedInterval((currentInterval) => {
      const matchesCurrent = matchingTypes.some((config) => config.value === currentInterval)
      return matchesCurrent ? currentInterval : matchingTypes[0].value
    })
  }, [currentCronValue, intervalOptions])

  const handleIntervalChange = useCallback((newInterval: string) => {
    setSelectedInterval(newInterval)

    if (newInterval === 'daily') {
      onChange?.(`${parsedValues.minute} ${parsedValues.hour} * * *`)
    } else if (newInterval === 'weekly') {
      const daysOfWeek =
        parsedValues.selectedWeekdays.length > 0
          ? parsedValues.selectedWeekdays
              .map((w) => w.value)
              .sort()
              .join(',')
          : '*'
      onChange?.(`${parsedValues.minute} ${parsedValues.hour} * * ${daysOfWeek}`)
    } else if (newInterval !== 'advanced') {
      onChange?.(newInterval)
    }
  }, [parsedValues.minute, parsedValues.hour, parsedValues.selectedWeekdays, onChange])

  const handleTimeChange = useCallback((value: string) => {
    if (!value) return

    const [hourStr, minuteStr] = value.split(':')
    const newHour = Math.max(0, Math.min(23, parseInt(hourStr) || 0))
    const newMinute = Math.max(0, Math.min(59, parseInt(minuteStr) || 0))

    const pieces = currentCronValue.split(' ')
    pieces[0] = String(newMinute)
    pieces[1] = String(newHour)
    onChange?.(pieces.join(' '))
  }, [currentCronValue, onChange])

  const handleWeekdayChange = useCallback((items: MultiSelectItem<string>[]) => {
    const sortedItems = [...items].sort((a, b) => parseInt(a.value) - parseInt(b.value))
    const daysOfWeek = sortedItems.length === 0 || sortedItems.length === 7 ? '*' : sortedItems.map((w) => w.value).join(',')

    const pieces = currentCronValue.split(' ')
    pieces[4] = daysOfWeek
    onChange?.(pieces.join(' '))
  }, [currentCronValue, onChange])

  const handleCustomCronChange = useCallback((newValue: string) => {
    const validationResult = validateCron(newValue)
    setCustomCronError(validationResult.error || '')
    onChange?.(newValue, !validationResult.isValid)
  }, [onChange])

  const formatTimeValue = useMemo(() => {
    const hour = String(parsedValues.hour).padStart(2, '0')
    const minute = String(parsedValues.minute).padStart(2, '0')
    return `${hour}:${minute}`
  }, [parsedValues.hour, parsedValues.minute])

  return (
    <div className="w-full" cy-id="cron-expression-controls">
      <div style={{ minHeight: '160px' }}>
        <Dropdown
          value={selectedInterval}
          onChange={(value) => handleIntervalChange(String(value))}
          label="Interval"
          items={intervalOptions}
          className="mb-2"
          cy-id="interval-dropdown"
        />

        <div className="flex items-center gap-2 mb-2">
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
                ref={customExpressionInputRef}
                label="Cron Expression"
                value={currentCronValue}
                onChange={handleCustomCronChange}
                customInputClass={'text-2xl md:text-3xl font-mono text-center'}
                className="w-full mb-2"
                error={customCronError}
                cy-id="cron-expression-input"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}