'use client'

import React, { useRef, useState, useCallback, useMemo, useId } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import InputWrapper from './InputWrapper'
import { useUpdateEffect } from '@/hooks/useUpdateEffect'

export interface DurationPickerProps {
  value?: number
  /** true → 000–999; false → 00–99 */
  showThreeDigitHour?: boolean
  disabled?: boolean
  readOnly?: boolean
  borderless?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
  onChange?: (value: number) => void
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const padZeros = (n: number, w: number) => String(n).padStart(w, '0')
const toHMS = (secs?: number) => {
  const s = !secs || isNaN(secs) || secs < 0 ? 0 : Math.round(secs)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return { h, m, s: s % 60 }
}
const fromHMS = (h: number, m: number, s: number) => h * 3600 + m * 60 + s

export default function DurationPicker({
  value,
  showThreeDigitHour = false,
  disabled = false,
  readOnly = false,
  borderless = false,
  size = 'medium',
  className,
  onChange
}: DurationPickerProps) {
  const t = useTypeSafeTranslations()
  const id = useId()
  const hoursW = showThreeDigitHour ? 3 : 2
  const hoursMax = showThreeDigitHour ? 999 : 99

  const hRef = useRef<HTMLInputElement>(null)
  const mRef = useRef<HTMLInputElement>(null)
  const sRef = useRef<HTMLInputElement>(null)

  // single flag: user is actively editing some field
  const [isEditing, setIsEditing] = useState(false)

  // local raw text (no padding while typing)
  const init = () => {
    const { h, m, s } = toHMS(value)
    return { hText: padZeros(clamp(h, 0, hoursMax), hoursW), mText: padZeros(m, 2), sText: padZeros(s, 2) }
  }
  const [{ hText, mText, sText }, setText] = useState(init)

  // remember what we emitted to avoid immediate echo reset
  const lastSentRef = React.useRef<number | null>(null)

  // sync from parent only when not editing, and only if different from last sent
  useUpdateEffect(() => {
    if (isEditing) return
    if (value === lastSentRef.current) {
      lastSentRef.current = null
      return
    }
    const { h, m, s } = toHMS(value)
    setText({ hText: padZeros(clamp(h, 0, hoursMax), hoursW), mText: padZeros(m, 2), sText: padZeros(s, 2) })
  }, [value, isEditing, hoursMax, hoursW])

  // emit to parent on text changes (clamped numerically)
  useUpdateEffect(() => {
    if (disabled || readOnly) return
    const h = clamp(parseInt(hText || '0', 10) || 0, 0, hoursMax)
    const m = clamp(parseInt(mText || '0', 10) || 0, 0, 59)
    const s = clamp(parseInt(sText || '0', 10) || 0, 0, 59)
    const secs = fromHMS(h, m, s)
    if (secs !== (value ?? 0)) {
      lastSentRef.current = secs
      onChange?.(secs)
    }
  }, [hText, mText, sText])

  const sanitize = useCallback((text: string, maxLength: number) => text.replace(/\D/g, '').slice(0, maxLength), [])

  // change handlers (just keep digits; pad on blur)
  const handleHoursChange = useCallback((input: string) => setText((p) => ({ ...p, hText: sanitize(input, hoursW) })), [sanitize, hoursW, hText])
  const handleMinutesChange = useCallback((input: string) => setText((p) => ({ ...p, mText: sanitize(input, 2) })), [sanitize, mText])
  const handleSecondsChange = useCallback((input: string) => setText((p) => ({ ...p, sText: sanitize(input, 2) })), [sanitize, sText])

  const normalize = useCallback(
    (input: string, maxValue: number, maxLength: number) => padZeros(clamp(parseInt(input || '0') || 0, 0, maxValue), maxLength),
    []
  )

  // normalize on blur (clamp + pad)
  const normalizeHours = useCallback(() => setText((p) => ({ ...p, hText: normalize(p.hText, hoursMax, hoursW) })), [normalize, hoursMax, hoursW, hText])
  const normalizeMinutes = useCallback(() => setText((p) => ({ ...p, mText: normalize(p.mText, 59, 2) })), [normalize, mText])
  const normalizeSeconds = useCallback(() => setText((p) => ({ ...p, sText: normalize(p.sText, 59, 2) })), [normalize, sText])

  // select on focus (works for click + programmatic)
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(true)
    const el = e.currentTarget // capture now; don't read from e in rAF
    requestAnimationFrame(() => {
      if (!el || el !== document.activeElement) return
      try {
        el.select()
      } catch {
        /* noop: element might be gone */
      }
    })
  }, [])

  const handleBlur = useCallback(
    (field: 'h' | 'm' | 's') => {
      if (field === 'h') normalizeHours()
      else if (field === 'm') normalizeMinutes()
      else normalizeSeconds()
      setIsEditing(false)
    },
    [normalizeHours, normalizeMinutes, normalizeSeconds]
  )

  const handleWrapperClick = useCallback(() => {
    if (disabled || readOnly) return
    // Only focus hours if none of the inputs are already focused
    const activeElement = document.activeElement
    if (activeElement !== hRef.current && activeElement !== mRef.current && activeElement !== sRef.current) {
      hRef.current?.focus()
    }
  }, [disabled, readOnly])

  // arrow inc/dec; Enter moves forward (minutes→seconds, hours→minutes); seconds Enter blurs
  const arrowAdjust = useCallback(
    (field: 'h' | 'm' | 's', dir: 1 | -1) => {
      setText((prev) => {
        const h = clamp(parseInt(prev.hText || '0', 10) || 0, 0, hoursMax)
        const m = clamp(parseInt(prev.mText || '0', 10) || 0, 0, 59)
        const s = clamp(parseInt(prev.sText || '0', 10) || 0, 0, 59)
        if (field === 'h') return { ...prev, hText: padZeros(clamp(h + dir, 0, hoursMax), hoursW) }
        if (field === 'm') return { ...prev, mText: padZeros((m + (dir + 60)) % 60, 2) }
        return { ...prev, sText: padZeros((s + (dir + 60)) % 60, 2) }
      })
    },
    [hoursMax, hText, mText, sText, hoursW]
  )

  // Navigate between fields cyclically
  const navigateToField = useCallback((currentField: 'h' | 'm' | 's', direction: 'left' | 'right') => {
    const fieldOrder = ['h', 'm', 's'] as const
    const currentIndex = fieldOrder.indexOf(currentField)
    let nextIndex: number

    if (direction === 'left') {
      nextIndex = currentIndex === 0 ? fieldOrder.length - 1 : currentIndex - 1
    } else {
      nextIndex = currentIndex === fieldOrder.length - 1 ? 0 : currentIndex + 1
    }

    const nextField = fieldOrder[nextIndex]
    const nextRef = nextField === 'h' ? hRef : nextField === 'm' ? mRef : sRef
    nextRef.current?.focus()
  }, [])

  const handleHoursKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        arrowAdjust('h', +1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        arrowAdjust('h', -1)
      } else if (e.key === 'ArrowLeft') {
        const input = e.currentTarget
        if (input.selectionStart === 0) {
          e.preventDefault()
          navigateToField('h', 'left')
        }
      } else if (e.key === 'ArrowRight') {
        const input = e.currentTarget
        if (input.selectionStart === input.value.length) {
          e.preventDefault()
          navigateToField('h', 'right')
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        mRef.current?.focus()
      }
    },
    [disabled, readOnly, arrowAdjust, navigateToField]
  )

  const handleMinutesKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        arrowAdjust('m', +1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        arrowAdjust('m', -1)
      } else if (e.key === 'ArrowLeft') {
        const input = e.currentTarget
        if (input.selectionStart === 0) {
          e.preventDefault()
          navigateToField('m', 'left')
        }
      } else if (e.key === 'ArrowRight') {
        const input = e.currentTarget
        if (input.selectionStart === input.value.length) {
          e.preventDefault()
          navigateToField('m', 'right')
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        sRef.current?.focus()
      }
    },
    [disabled, readOnly, arrowAdjust, navigateToField]
  )

  const handleSecondsKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        arrowAdjust('s', +1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        arrowAdjust('s', -1)
      } else if (e.key === 'ArrowLeft') {
        const input = e.currentTarget
        if (input.selectionStart === 0) {
          e.preventDefault()
          navigateToField('s', 'left')
        }
      } else if (e.key === 'ArrowRight') {
        const input = e.currentTarget
        if (input.selectionStart === input.value.length) {
          e.preventDefault()
          navigateToField('s', 'right')
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        ;(e.currentTarget as HTMLInputElement).blur()
      }
    },
    [disabled, readOnly, arrowAdjust, navigateToField]
  )

  const sizeText = useMemo(() => (size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'), [size])

  const sepClass = useMemo(
    () => mergeClasses('select-none px-1', sizeText, disabled ? 'text-disabled' : readOnly ? 'text-read-only' : 'text-white/80'),
    [sizeText, disabled, readOnly]
  )

  const hoursId = useMemo(() => `${id}-h`, [id])
  const minutesId = useMemo(() => `${id}-m`, [id])
  const secondsId = useMemo(() => `${id}-s`, [id])

  const human = useMemo(() => {
    const h = clamp(parseInt(hText || '0', 10) || 0, 0, hoursMax)
    const m = clamp(parseInt(mText || '0', 10) || 0, 0, 59)
    const s = clamp(parseInt(sText || '0', 10) || 0, 0, 59)
    const parts: string[] = []
    if (h > 0) parts.push(t('LabelHoursPlural', { count: h }))
    if (m > 0) parts.push(t('LabelMinutesPlural', { count: m }))
    if (s > 0 || parts.length === 0) parts.push(t('LabelSecondsPlural', { count: s }))
    return parts.join(' ')
  }, [hText, mText, sText, hoursMax, t])

  const wrapperClass = useMemo(() => {
    return mergeClasses('flex items-center gap-0 h-full px-1', disabled ? 'cursor-not-allowed' : 'cursor-text')
  }, [disabled])

  const inputClass = useMemo(() => {
    const inputBase = 'bg-transparent outline-none text-center caret-current tabular-nums box-content'
    const specialClass = 'disabled:cursor-not-allowed disabled:text-disabled read-only:cursor-default read-only:text-read-only'
    const inputBox = 'px-0 py-1 rounded-sm'
    return mergeClasses(sizeText, inputBase, specialClass, inputBox)
  }, [sizeText, showThreeDigitHour])

  const hoursClass = useMemo(() => mergeClasses(inputClass, showThreeDigitHour ? 'w-[3ch]' : 'w-[2ch]'), [inputClass, showThreeDigitHour])
  const minutesClass = useMemo(() => mergeClasses(inputClass, 'w-[2ch]'), [inputClass])
  const secondsClass = useMemo(() => mergeClasses(inputClass, 'w-[2ch]'), [inputClass])

  return (
    <InputWrapper disabled={disabled} readOnly={readOnly} borderless={borderless} size={size} className={className}>
      <fieldset cy-id="duration-picker-wrapper" className={wrapperClass} onClick={handleWrapperClick}>
        <legend className="sr-only">{t('LabelDuration')}</legend>
        {/* HOURS */}
        <div className="flex-shrink min-w-0">
          <label htmlFor={hoursId} className="sr-only">
            {t('LabelHours')}
          </label>
          <input
            id={hoursId}
            ref={hRef}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            enterKeyHint="next"
            maxLength={hoursW}
            disabled={disabled}
            readOnly={readOnly}
            className={hoursClass}
            value={hText}
            onFocus={handleFocus}
            onBlur={() => handleBlur('h')}
            onChange={(e) => handleHoursChange(e.target.value)}
            onKeyDown={handleHoursKeyDown}
            role="spinbutton"
            aria-valuemin={0}
            aria-valuemax={hoursMax}
            aria-valuenow={parseInt(hText, 10)}
          />
        </div>

        <div aria-hidden="true" className={sepClass} onClick={() => mRef.current?.focus()} onMouseDown={(e) => e.preventDefault()}>
          :
        </div>

        {/* MINUTES */}
        <div className="flex-shrink min-w-0">
          <label htmlFor={minutesId} className="sr-only">
            {t('LabelMinutes')}
          </label>
          <input
            id={minutesId}
            ref={mRef}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            enterKeyHint="next"
            maxLength={2}
            disabled={disabled}
            readOnly={readOnly}
            className={minutesClass}
            value={mText}
            onFocus={handleFocus}
            onBlur={() => handleBlur('m')}
            onChange={(e) => handleMinutesChange(e.target.value)}
            onKeyDown={handleMinutesKeyDown}
            role="spinbutton"
            aria-valuemin={0}
            aria-valuemax={59}
            aria-valuenow={parseInt(mText, 10)}
          />
        </div>

        <div aria-hidden="true" className={sepClass} onClick={() => sRef.current?.focus()} onMouseDown={(e) => e.preventDefault()}>
          :
        </div>

        {/* SECONDS */}
        <div className="flex-shrink min-w-0">
          <label htmlFor={secondsId} className="sr-only">
            {t('LabelSeconds')}
          </label>
          <input
            id={secondsId}
            ref={sRef}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            enterKeyHint="done"
            maxLength={2}
            disabled={disabled}
            readOnly={readOnly}
            className={secondsClass}
            value={sText}
            onFocus={handleFocus}
            onBlur={() => handleBlur('s')}
            onChange={(e) => handleSecondsChange(e.target.value)}
            onKeyDown={handleSecondsKeyDown}
            role="spinbutton"
            aria-valuemin={0}
            aria-valuemax={59}
            aria-valuenow={parseInt(sText, 10)}
          />
        </div>

        <p id={`${id}-live`} aria-live="polite" className="sr-only">
          {human}
        </p>
      </fieldset>
    </InputWrapper>
  )
}
