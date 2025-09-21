'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import { validateCron, getHumanReadableCronExpression, calculateNextRunDate, type ValidationResult } from '@/lib/cron'
import Dropdown from '@/components/ui/Dropdown'
import { MultiSelect } from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import type { MultiSelectItem } from '@/components/ui/MultiSelect'

interface CronExpressionBuilderProps {
  currentCronValue: string
  onChange?: (value: string, isInvalid?: boolean) => void
}

export default function CronExpressionBuilder({ currentCronValue, onChange }: CronExpressionBuilderProps) {
  // State management
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<number>(0)
  const [selectedMinute, setSelectedMinute] = useState<number>(0)
  const [selectedWeekdays, setSelectedWeekdays] = useState<MultiSelectItem<string>[]>([])

  // Derive these from the value prop
  const [customCronError, setCustomCronError] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(true)
  const [nextRunDate, setNextRunDate] = useState<string>('')

  const customExpressionInputRef = useRef<HTMLInputElement>(null)

  // Calculate next run date on client side only
  useEffect(() => {
    if (!currentCronValue) {
      setNextRunDate('')
      return
    }

    const nextRun = calculateNextRunDate(currentCronValue)
    setNextRunDate(nextRun)
  }, [currentCronValue])

  const verbalDescription = useMemo(() => getHumanReadableCronExpression(currentCronValue), [currentCronValue])

  // Combined interval configuration with both display and matching logic
  const intervalOptions = useMemo(
    () => [
      // Daily - can express: M H * * * where M and H are specific numbers
      {
        text: 'Daily',
        value: 'daily',
        canExpress: (expr: string) => /^\d+ \d+ \* \* \*$/.test(expr)
      },
      // Weekly - can express: M H * * D where M and H are specific numbers, D is * or comma-separated weekdays
      {
        text: 'Weekly',
        value: 'weekly',
        canExpress: (expr: string) => /^\d+ \d+ \* \* (\*|(\d+(,\d+)*))$/.test(expr)
      },
      // Predefined intervals (exact matches) - most specific first
      {
        text: 'Every 12 Hours',
        value: '0 */12 * * *',
        canExpress: (expr: string) => expr === '0 */12 * * *'
      },
      {
        text: 'Every 6 Hours',
        value: '0 */6 * * *',
        canExpress: (expr: string) => expr === '0 */6 * * *'
      },
      {
        text: 'Every 2 Hours',
        value: '0 */2 * * *',
        canExpress: (expr: string) => expr === '0 */2 * * *'
      },
      {
        text: 'Every Hour',
        value: '0 * * * *',
        canExpress: (expr: string) => expr === '0 * * * *'
      },
      {
        text: 'Every 30 Minutes',
        value: '*/30 * * * *',
        canExpress: (expr: string) => expr === '*/30 * * * *'
      },
      {
        text: 'Every 15 Minutes',
        value: '*/15 * * * *',
        canExpress: (expr: string) => expr === '*/15 * * * *'
      },
      // Advanced - matches everything
      {
        text: 'Custom',
        value: 'advanced',
        canExpress: () => true
      }
    ],
    []
  )

  const weekdays: MultiSelectItem<string>[] = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days.map((day, index) => ({
      value: index.toString(),
      content: day
    }))
  }, [])

  const updateCron = useCallback(() => {
    let newCronExpression = ''

    if (selectedInterval === 'weekly') {
      const sortedWeekdays = selectedWeekdays.map((w) => parseInt(w.value)).sort()
      const daysOfWeekPiece = sortedWeekdays.length === 7 || sortedWeekdays.length === 0 ? '*' : sortedWeekdays.join(',')
      newCronExpression = `${selectedMinute} ${selectedHour} * * ${daysOfWeekPiece}`
    } else if (selectedInterval === 'daily') {
      newCronExpression = `${selectedMinute} ${selectedHour} * * *`
    } else if (selectedInterval === 'advanced') {
      // For advanced mode, don't auto-generate - let the user input the cron expression manually
      return
    } else {
      newCronExpression = selectedInterval || ''
    }

    // Only notify parent if the expression actually changed
    if (newCronExpression !== currentCronValue) {
      onChange?.(newCronExpression)
    }
  }, [selectedInterval, selectedWeekdays, selectedMinute, selectedHour, onChange, currentCronValue])

  // Helper to format time from hour/minute values
  const formatTimeValue = useCallback(() => {
    const hour = selectedHour.toString().padStart(2, '0')
    const minute = selectedMinute.toString().padStart(2, '0')
    return `${hour}:${minute}`
  }, [selectedHour, selectedMinute])

  // Handler for time input changes
  const handleTimeChange = useCallback((value: string) => {
    if (!value) return

    const [hourStr, minuteStr] = value.split(':')
    const hour = parseInt(hourStr) || 0
    const minute = parseInt(minuteStr) || 0

    setSelectedHour(Math.max(0, Math.min(23, hour)))
    setSelectedMinute(Math.max(0, Math.min(59, minute)))
  }, [])

  const parseAndUpdateStates = useCallback(
    (cronExpr: string) => {
      const validationResult = validateCron(cronExpr)
      if (!validationResult.isValid) {
        setSelectedInterval('advanced')
        setCustomCronError(validationResult.error || '')
        setIsValid(false)
        onChange?.(cronExpr, false)
        return
      }

      const pieces = cronExpr.split(' ')

      // Find all interval types that can express this cron expression
      const matchingTypes = intervalOptions.filter((config) => config.canExpress(cronExpr))

      // If no matches found, default to advanced (this is just defensive programming - should never happen)
      if (matchingTypes.length === 0) {
        setSelectedInterval('advanced')
        return
      }

      // Determine which interval type to use
      setSelectedInterval((currentInterval) => {
        // If current interval is in the matching types, prefer it
        const currentMatch = matchingTypes.find((config) => config.value === currentInterval)
        if (currentMatch) {
          // Parse and set the appropriate state values for the current interval
          if (currentInterval === 'daily') {
            setSelectedHour(Number(pieces[1]))
            setSelectedMinute(Number(pieces[0]))
            setSelectedWeekdays([])
          } else if (currentInterval === 'weekly') {
            setSelectedHour(Number(pieces[1]))
            setSelectedMinute(Number(pieces[0]))

            if (pieces[4] === '*') {
              setSelectedWeekdays([])
            } else {
              const weekdayValues = pieces[4].split(',')
              const weekdayItems = weekdayValues
                .map((val) => ({
                  value: val.trim(),
                  content: weekdays.find((w) => w.value === val.trim())?.content || ''
                }))
                .filter((item) => item.content) // Filter out invalid weekdays
              setSelectedWeekdays(weekdayItems)
            }
          }
          return currentInterval
        }

        // Otherwise, use the first (most specific) match
        const selectedType = matchingTypes[0].value

        // Parse and set the appropriate state values based on the selected type
        if (selectedType === 'daily') {
          setSelectedHour(Number(pieces[1]))
          setSelectedMinute(Number(pieces[0]))
          setSelectedWeekdays([])
        } else if (selectedType === 'weekly') {
          setSelectedHour(Number(pieces[1]))
          setSelectedMinute(Number(pieces[0]))

          if (pieces[4] === '*') {
            setSelectedWeekdays([])
          } else {
            const weekdayValues = pieces[4].split(',')
            const weekdayItems = weekdayValues
              .map((val) => ({
                value: val.trim(),
                content: weekdays.find((w) => w.value === val.trim())?.content || ''
              }))
              .filter((item) => item.content) // Filter out invalid weekdays
            setSelectedWeekdays(weekdayItems)
          }
        }
        // For predefined intervals and advanced mode, no additional state parsing needed

        return selectedType
      })
    },
    [intervalOptions, weekdays]
  )

  const handleCronExpressionChange = useCallback(
    (newValue: string) => {
      // Real-time validation for immediate feedback
      const validationResult = validateCron(newValue)
      setIsValid(validationResult.isValid)
      setCustomCronError(validationResult.error || '')

      onChange?.(newValue, !validationResult.isValid)
    },
    [onChange]
  )

  const handleCronExpressionBlur = useCallback(() => {
    if (!currentCronValue) {
      setCustomCronError('Cron expression is required')
      setIsValid(false)
      return
    }

    // Final validation on blur
    const validationResult = validateCron(currentCronValue)
    setIsValid(validationResult.isValid)
    setCustomCronError(validationResult.error || '')

    // The onChange was already called during typing, so we don't need to call it again
    // The parent will update the value prop, which will trigger re-parsing if needed
  }, [currentCronValue])

  // Handle weekday selection changes
  const handleWeekdayChange = useCallback((items: MultiSelectItem<string>[]) => {
    setSelectedWeekdays(items)
  }, [])

  // Initialize component when value changes
  useEffect(() => {
    parseAndUpdateStates(currentCronValue)
  }, [currentCronValue, parseAndUpdateStates])

  // Track if we're in initialization phase to prevent unnecessary updates
  const isInitializingRef = useRef(false)

  // Update cron when user makes changes (but not during initialization)
  useEffect(() => {
    if (selectedInterval !== null) updateCron()
  }, [selectedInterval, selectedHour, selectedMinute, selectedWeekdays, updateCron])

  return (
    <div className="w-full py-2" cy-id="cron-expression-builder">
      {selectedInterval !== null && (
        <div style={{ minHeight: '160px' }}>
          <Dropdown
            value={selectedInterval}
            onChange={(value) => setSelectedInterval(String(value))}
            label="Interval"
            items={intervalOptions}
            className="mb-2"
            cy-id="interval-dropdown"
          />

          <div className="flex items-center gap-2 mb-2">
            {(selectedInterval === 'weekly' || selectedInterval === 'daily') && (
              <div>
                <TextInput
                  value={formatTimeValue()}
                  onChange={handleTimeChange}
                  type="time"
                  label="Time"
                  customInputClass="[&::-webkit-calendar-picker-indicator]:hidden"
                  className="w-fit"
                  cy-id="time-input"
                />
              </div>
            )}

            {selectedInterval === 'weekly' && (
              <MultiSelect
                selectedItems={selectedWeekdays}
                items={weekdays}
                label="Weekdays to Run"
                onItemAdded={(item) => {
                  const newItems = [...selectedWeekdays, item]
                  handleWeekdayChange(newItems)
                }}
                onItemRemoved={(item) => {
                  const newItems = selectedWeekdays.filter((w) => w.value !== item.value)
                  handleWeekdayChange(newItems)
                }}
                cy-id="weekdays-multiselect"
              />
            )}

            {selectedInterval === 'advanced' && (
              <div className="w-full">
                <TextInput
                  ref={customExpressionInputRef}
                  label="Cron Expression"
                  value={currentCronValue}
                  onChange={handleCronExpressionChange}
                  onBlur={handleCronExpressionBlur}
                  customInputClass={'text-2xl md:text-3xl font-mono text-center'}
                  className="w-full mb-2"
                  error={customCronError}
                  cy-id="cron-expression-input"
                />
              </div>
            )}
          </div>
        </div>
      )}
      <div>
        {/* Verbal Description - hide in advanced mode if there's a validation error */}
        {!(selectedInterval === 'advanced' && !isValid) && (
          <div className="mb-4 p-3 bg-primary/30 rounded-lg border border-primary/50">
            <div className="flex items-center">
              <span className="material-symbols mr-2 text-blue-400">schedule</span>
              <p className="text-sm font-medium text-gray-300">Schedule:</p>
            </div>
            <p className="text-base font-semibold text-white mt-1" cy-id="cron-description">
              {verbalDescription}
            </p>
            {currentCronValue && <p className="text-xs text-gray-400 mt-1 font-mono">{currentCronValue}</p>}
          </div>
        )}

        {currentCronValue && isValid && nextRunDate && !(selectedInterval === 'advanced' && !isValid) && (
          <div className="flex items-center justify-center text-yellow-400 mt-2">
            <span className="material-symbols mr-2 text-xl">event</span>
            <p>Next Scheduled Run: {nextRunDate}</p>
          </div>
        )}
      </div>
    </div>
  )
}
