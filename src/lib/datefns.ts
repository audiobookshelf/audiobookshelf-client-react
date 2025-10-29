import { format } from 'date-fns'

export function formatJsDate(date: Date, fnsFormat: string = 'MM/dd/yyyy HH:mm') {
  if (!date || !(date instanceof Date)) {
    return ''
  }
  return format(date, fnsFormat)
}

/**
 * Converts seconds to timestamp format (HH:MM:SS or MM:SS)
 * @param seconds - Number of seconds to convert
 * @returns Formatted timestamp string
 * @example
 * secondsToTimestamp(3661) // "01:01:01"
 * secondsToTimestamp(125) // "02:05"
 * secondsToTimestamp(0) // "00:00"
 */
export function secondsToTimestamp(seconds: number): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) {
    return '00:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const pad = (num: number) => num.toString().padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
  }
  return `${pad(minutes)}:${pad(secs)}`
}
