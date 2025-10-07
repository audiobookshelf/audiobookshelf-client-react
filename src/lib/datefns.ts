import { format } from 'date-fns'

export function formatJsDate(date: Date, fnsFormat: string = 'MM/dd/yyyy HH:mm') {
  if (!date || !(date instanceof Date)) {
    return ''
  }
  return format(date, fnsFormat)
}
