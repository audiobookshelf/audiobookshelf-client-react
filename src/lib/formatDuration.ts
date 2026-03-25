import type { TranslationKey, TypeSafeTranslations } from '@/types/translations'

type Unit = 'days' | 'hours' | 'minutes' | 'seconds'

const COMPACT_KEYS: Record<Unit, TranslationKey> = {
  days: 'LabelDurationCompactDays',
  hours: 'LabelDurationCompactHours',
  minutes: 'LabelDurationCompactMinutes',
  seconds: 'LabelDurationCompactSeconds'
}

const LONG_KEYS: Record<Unit, TranslationKey> = {
  days: 'LabelDaysPlural',
  hours: 'LabelHoursPlural',
  minutes: 'LabelMinutesPlural',
  seconds: 'LabelSecondsPlural'
}

type Style = 'compact' | 'long'

const KEYS: Record<Style, Record<Unit, TranslationKey>> = {
  compact: COMPACT_KEYS,
  long: LONG_KEYS
}

function appendSegment(parts: string[], count: number, unit: Unit, style: Style, t: TypeSafeTranslations) {
  const key = KEYS[style][unit]
  parts.push(t(key, { count }))
}

export interface FormatDurationOptions {
  /** compact: "1h 5m" (LabelDurationCompact*). long: ICU plurals (LabelHoursPlural, …). */
  style?: 'compact' | 'long'
  /** Show only the most significant unit (e.g. "5 days" not "5 days 3 hours"). */
  largestUnitOnly?: boolean
  /** When true, split hours into days for durations ≥ 24h. When false, use total hours (e.g. 26h). */
  showDays?: boolean
  /** When false, hide seconds, carry remainder seconds ≥ 30 into minutes (and cascade to hours). */
  showSeconds?: boolean
}

const DEFAULT_OPTIONS: FormatDurationOptions = {
  style: 'compact' as const,
  largestUnitOnly: false,
  showDays: false,
  showSeconds: false
}

/** Locale-aware duration formatter. */
export function formatDuration(seconds: number, t: TypeSafeTranslations, options?: FormatDurationOptions): string {
  const merged = { ...DEFAULT_OPTIONS, ...options }
  const style: Style = merged.style!
  const { largestUnitOnly, showDays, showSeconds } = merged

  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return ''
  }

  const total = Math.round(seconds)
  const s = total % 60
  let m = Math.floor(total / 60) % 60
  let h = Math.floor(total / 3600)

  if (!showSeconds && s > 0) {
    if (s >= 30) m++
    if (m >= 60) {
      h++
      m -= 60
    }
  }

  let d = 0
  if (showDays) {
    d = Math.floor(h / 24)
    h -= d * 24
  }

  const parts: string[] = []
  if (d > 0) appendSegment(parts, d, 'days', style, t)
  if (h > 0) appendSegment(parts, h, 'hours', style, t)
  if (m > 0) appendSegment(parts, m, 'minutes', style, t)
  if (showSeconds && s > 0) appendSegment(parts, s, 'seconds', style, t)

  if (parts.length === 0) {
    if (!showSeconds) appendSegment(parts, 0, 'minutes', style, t)
    else appendSegment(parts, 0, 'seconds', style, t)
  }

  if (largestUnitOnly && parts.length > 1) {
    return parts[0]!
  }
  return parts.join(' ')
}
