import cronstrue from 'cronstrue'

interface ValidationResult {
  isValid: boolean
  error?: string
}

// Helper function to validate individual cron fields
const isValidCronField = (field: string, min: number, max: number): boolean => {
  // Handle wildcard
  if (field === '*') return true

  // Helper to check if a string is a valid integer
  const isValidInteger = (str: string): boolean => {
    const trimmed = str.trim()
    return /^\d+$/.test(trimmed) && !isNaN(parseInt(trimmed))
  }

  // Handle step values (*/n)
  if (field.startsWith('*/')) {
    const stepStr = field.substring(2)
    if (!isValidInteger(stepStr)) return false
    const step = parseInt(stepStr)
    return step > 0 && step <= max
  }

  // Handle ranges (n-m)
  if (field.includes('-')) {
    const parts = field.split('-')
    if (parts.length !== 2) return false
    const [startStr, endStr] = parts
    if (!isValidInteger(startStr) || !isValidInteger(endStr)) return false
    const start = parseInt(startStr)
    const end = parseInt(endStr)
    return start >= min && end <= max && start <= end
  }

  // Handle comma-separated values (n,m,o)
  if (field.includes(',')) {
    const parts = field.split(',')
    if (parts.length === 0) return false
    return parts.every((part) => {
      if (!isValidInteger(part)) return false
      const val = parseInt(part.trim())
      return val >= min && val <= max
    })
  }

  // Handle single number
  if (!isValidInteger(field)) return false
  const num = parseInt(field)
  return num >= min && num <= max
}

// Client-side cron validation
export const validateCron = (expression: string): ValidationResult => {
  try {
    const parts = expression.trim().split(/\s+/)

    if (parts.length !== 5) {
      return { isValid: false, error: 'Cron expression must have exactly 5 parts (minute hour day month weekday)' }
    }

    const [minute, hour, day, month, weekday] = parts

    // Validate minute (0-59)
    if (!isValidCronField(minute, 0, 59)) {
      return { isValid: false, error: 'Invalid minute field. Must be 0-59, *, */n, or comma-separated values' }
    }

    // Validate hour (0-23)
    if (!isValidCronField(hour, 0, 23)) {
      return { isValid: false, error: 'Invalid hour field. Must be 0-23, *, */n, or comma-separated values' }
    }

    // Validate day (1-31)
    if (!isValidCronField(day, 1, 31)) {
      return { isValid: false, error: 'Invalid day field. Must be 1-31, *, */n, or comma-separated values' }
    }

    // Validate month (1-12)
    if (!isValidCronField(month, 1, 12)) {
      return { isValid: false, error: 'Invalid month field. Must be 1-12, *, */n, or comma-separated values' }
    }

    // Validate weekday (0-7, where 0 and 7 are Sunday)
    if (!isValidCronField(weekday, 0, 7)) {
      return { isValid: false, error: 'Invalid weekday field. Must be 0-7 (0=Sunday), *, */n, or comma-separated values' }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Invalid cron expression format' }
  }
}

// Convert cron expression to human-readable description
export const getHumanReadableCronExpression = (cronExpr: string): string => {
  if (!cronExpr) return 'No schedule set'

  try {
    return cronstrue.toString(cronExpr, {
      verbose: false,
      throwExceptionOnParseError: true,
      use24HourTimeFormat: false
    })
  } catch {
    return 'Invalid cron expression'
  }
}

// Helper function to check if a value matches a cron field
const matchesCronField = (value: number, field: string, min: number, max: number): boolean => {
  // Handle wildcard
  if (field === '*') return true

  // Handle step values (*/n)
  if (field.startsWith('*/')) {
    const step = parseInt(field.substring(2))
    return value % step === 0
  }

  // Handle ranges (n-m)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number)
    return value >= start && value <= end
  }

  // Handle comma-separated values (n,m,o)
  if (field.includes(',')) {
    const values = field.split(',').map(Number)
    // Handle special case for weekday where 7 = Sunday = 0
    if (max === 7 && values.includes(7)) {
      values.push(0)
    }
    return values.includes(value)
  }

  // Handle single number
  const fieldValue = parseInt(field)
  // Handle special case for weekday where 7 = Sunday = 0
  if (max === 7 && fieldValue === 7) {
    return value === 0
  }
  return value === fieldValue
}

// Helper function to check if a date matches a cron expression
const matchesCronExpression = (date: Date, minute: string, hour: string, day: string, month: string, weekday: string): boolean => {
  const dateMinute = date.getMinutes()
  const dateHour = date.getHours()
  const dateDay = date.getDate()
  const dateMonth = date.getMonth() + 1 // JavaScript months are 0-indexed
  const dateWeekday = date.getDay() // 0 = Sunday, 1 = Monday, etc.

  return (
    matchesCronField(dateMinute, minute, 0, 59) &&
    matchesCronField(dateHour, hour, 0, 23) &&
    matchesCronField(dateDay, day, 1, 31) &&
    matchesCronField(dateMonth, month, 1, 12) &&
    matchesCronField(dateWeekday, weekday, 0, 7) // 0 and 7 both represent Sunday
  )
}

// Calculate next run date based on cron expression
export const calculateNextRunDate = (cronExpr: string): string => {
  if (!cronExpr) return ''

  try {
    const parts = cronExpr.trim().split(/\s+/)
    if (parts.length !== 5) return ''

    const [minute, hour, day, month, weekday] = parts
    const now = new Date()

    // Start from the next minute to avoid returning current time
    const nextMinute = new Date(now)
    nextMinute.setSeconds(0, 0)
    nextMinute.setMinutes(nextMinute.getMinutes() + 1)

    // Find the next valid date/time (check up to 4 years in the future to handle edge cases)
    const maxIterations = 366 * 4 // 4 years worth of days
    let candidate = new Date(nextMinute)

    for (let i = 0; i < maxIterations; i++) {
      if (matchesCronExpression(candidate, minute, hour, day, month, weekday)) {
        return candidate.toLocaleString()
      }
      candidate.setMinutes(candidate.getMinutes() + 1)
    }

    return 'Unable to calculate next run'
  } catch {
    return ''
  }
}

export type { ValidationResult }
