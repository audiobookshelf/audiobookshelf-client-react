import { format } from 'date-fns'

const DATETIME_LOCAL_INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm"

export function formatJsDate(date: Date, fnsFormat: string = 'MM/dd/yyyy HH:mm') {
  if (!date || !(date instanceof Date)) {
    return ''
  }
  return format(date, fnsFormat)
}

export function formatJsDatetime(date: Date, fnsDateFormat: string = 'MM/dd/yyyy', fnsTimeFormat: string = 'HH:mm') {
  if (!date || !(date instanceof Date)) {
    return ''
  }
  return format(date, `${fnsDateFormat} ${fnsTimeFormat}`)
}

/** Format a millisecond timestamp for `type="datetime-local"` inputs. */
export function timestampToDatetimeLocal(timestamp: number | undefined): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''
  return formatJsDate(date, DATETIME_LOCAL_INPUT_FORMAT)
}

/** Format an RSS/pub date string for `type="datetime-local"` inputs. */
export function pubDateToDatetimeLocal(pubDate: string | null | undefined): string {
  if (!pubDate) return ''
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return ''
  return formatJsDate(date, DATETIME_LOCAL_INPUT_FORMAT)
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
