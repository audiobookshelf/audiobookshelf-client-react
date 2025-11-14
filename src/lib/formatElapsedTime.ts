/**
 * First attempts to use Intl.DurationFormat to format the elapsed time using locale
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat
 *
 * @param seconds
 * @param locale
 * @param useFullNames
 * @param useMilliseconds
 * @returns
 */
export const elapsedPretty = (seconds: number, locale: string, useFullNames: boolean = false, useMilliseconds: boolean = false): string => {
  if (isNaN(seconds) || seconds === null) return ''

  try {
    // @ts-expect-error Intl.DurationFormat is not supported in TypeScript
    const df = new Intl.DurationFormat(locale, {
      style: useFullNames ? 'long' : 'short'
    })

    const duration: { milliseconds?: number; seconds?: number; minutes?: number; hours?: number; days?: number } = {}

    if (seconds < 60) {
      if (useMilliseconds && seconds < 1) {
        duration.milliseconds = Math.floor(seconds * 1000)
      } else {
        duration.seconds = Math.floor(seconds)
      }
    } else if (seconds < 3600) {
      // 1 hour
      duration.minutes = Math.floor(seconds / 60)
    } else if (seconds < 86400) {
      // 1 day
      duration.hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (minutes > 0) {
        duration.minutes = minutes
      }
    } else {
      duration.days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      if (hours > 0) {
        duration.hours = hours
      }
    }

    return df.format(duration)
  } catch (error) {
    // Handle not supported
    console.warn('Intl.DurationFormat not supported, not localizing duration', error)

    if (useMilliseconds && seconds > 0 && seconds < 1) {
      return `${Math.floor(seconds * 1000)} ms`
    }
    if (seconds < 60) {
      return `${Math.floor(seconds)} sec${useFullNames ? 'onds' : ''}`
    }
    let minutes = Math.floor(seconds / 60)
    if (minutes < 70) {
      return `${minutes} min${useFullNames ? `ute${minutes === 1 ? '' : 's'}` : ''}`
    }
    const hours = Math.floor(minutes / 60)
    minutes -= hours * 60
    if (!minutes) {
      return `${hours} ${useFullNames ? 'hours' : 'hr'}`
    }
    return `${hours} ${useFullNames ? `hour${hours === 1 ? '' : 's'}` : 'hr'} ${minutes} ${useFullNames ? `minute${minutes === 1 ? '' : 's'}` : 'min'}`
  }
}
