'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import InputWrapper from './InputWrapper'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useUpdateEffect } from '@/hooks/useUpdateEffect'

export interface DurationPickerProps {
  value?: number
  showThreeDigitHour?: boolean
  disabled?: boolean
  readOnly?: boolean
  borderless?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
  onChange?: (value: number) => void
}

interface Digits {
  hour2: number
  hour1: number
  hour0: number
  minute1: number
  minute0: number
  second1: number
  second0: number
}

const DurationPicker = ({
  value,
  showThreeDigitHour = false,
  disabled = false,
  readOnly = false,
  borderless = false,
  size = 'medium',
  className,
  onChange
}: DurationPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const durationPickerId = useId()

  const div = (a: number, b: number) => {
    return Math.floor(a / b)
  }

  const digitsFromSeconds = (totalSeconds: number | undefined) => {
    const s = !totalSeconds || isNaN(totalSeconds) || totalSeconds < 0 ? 0 : Math.round(totalSeconds)
    const hours = div(s, 3600)
    const minutes = div(s, 60) % 60
    const seconds = s % 60

    const digits: Digits = {
      second1: div(seconds, 10),
      second0: seconds % 10,
      minute1: div(minutes, 10),
      minute0: minutes % 10,
      hour1: div(hours, 10) % 10,
      hour0: hours % 10,
      hour2: div(hours, 100)
    }

    return digits
  }

  const secondsFromDigits = (d: Digits) => {
    return d.second0 + d.second1 * 10 + d.minute0 * 60 + d.minute1 * 600 + d.hour0 * 3600 + d.hour1 * 36000 + d.hour2 * 360000
  }

  const [focusedDigit, setFocusedDigit] = useState<string | null>(null)

  const [digits, setDigits] = useState<Digits>(digitsFromSeconds(value))

  const isOver99Hours = useMemo(() => {
    return digits.hour2 > 0 || showThreeDigitHour
  }, [digits, showThreeDigitHour])

  const digitDisplay = useMemo(() => {
    return isOver99Hours
      ? ['hour2', 'hour1', 'hour0', ':', 'minute1', 'minute0', ':', 'second1', 'second0']
      : ['hour1', 'hour0', ':', 'minute1', 'minute0', ':', 'second1', 'second0']
  }, [isOver99Hours])

  const handleBlur = useCallback(() => {
    setFocusedDigit(null)
  }, [])

  const clickMedian = useCallback((index: number) => {
    if (index >= 5) {
      setFocusedDigit('second1')
    } else {
      setFocusedDigit('minute1')
    }
  }, [])

  const clickInput = useCallback(() => {
    if (disabled) return
    containerRef.current?.focus()
  }, [disabled])

  const shiftFocusLeft = useCallback(() => {
    if (!focusedDigit) return
    if (focusedDigit.endsWith('2')) return

    const isDigit1 = focusedDigit.endsWith('1')
    if (!isDigit1) {
      const digit1Key = focusedDigit.replace('0', '1')
      setFocusedDigit(digit1Key)
    } else if (focusedDigit.startsWith('second')) {
      setFocusedDigit('minute0')
    } else if (focusedDigit.startsWith('minute')) {
      setFocusedDigit('hour0')
    } else if (isOver99Hours && focusedDigit.startsWith('hour')) {
      setFocusedDigit('hour2')
    }
  }, [focusedDigit, isOver99Hours])

  const shiftFocusRight = useCallback(() => {
    if (!focusedDigit) return
    if (focusedDigit.endsWith('2')) {
      setFocusedDigit('hour1')
      return
    }
    const isDigit1 = focusedDigit.endsWith('1')
    if (isDigit1) {
      const digit0Key = focusedDigit.replace('1', '0')
      setFocusedDigit(digit0Key)
    } else if (focusedDigit.startsWith('hour')) {
      setFocusedDigit('minute1')
    } else if (focusedDigit.startsWith('minute')) {
      setFocusedDigit('second1')
    }
  }, [focusedDigit])

  const increaseFocused = useCallback(() => {
    if (!focusedDigit) return
    const isDigit1 = focusedDigit.endsWith('1')
    const digit = Number(digits[focusedDigit as keyof Digits])

    setDigits((prev) => ({
      ...prev,
      [focusedDigit]: isDigit1 && !focusedDigit.startsWith('hour') ? (digit + 1) % 6 : (digit + 1) % 10
    }))
  }, [focusedDigit, digits])

  const decreaseFocused = useCallback(() => {
    if (!focusedDigit) return
    const isDigit1 = focusedDigit.endsWith('1')
    const digit = Number(digits[focusedDigit as keyof Digits])

    setDigits((prev) => ({
      ...prev,
      [focusedDigit]: isDigit1 && !focusedDigit.startsWith('hour') ? (digit - 1 < 0 ? 5 : digit - 1) : digit - 1 < 0 ? 9 : digit - 1
    }))
  }, [focusedDigit, digits])

  const maxDigitValue = useCallback((digit: string) => {
    return digit.endsWith('1') && !digit.startsWith('hour') ? 5 : 9
  }, [])

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!focusedDigit || !e.key || disabled || readOnly) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        shiftFocusLeft()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        shiftFocusRight()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        increaseFocused()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        decreaseFocused()
      } else if (e.key === 'Tab') {
        handleBlur()
      } else if (!isNaN(Number(e.key))) {
        e.preventDefault()
        const digit = Number(e.key)
        const maxDigit = maxDigitValue(focusedDigit)
        const clampedDigit = digit > maxDigit ? maxDigit : digit

        setDigits((prev) => ({
          ...prev,
          [focusedDigit]: clampedDigit
        }))
        shiftFocusRight()
      }
    },
    [focusedDigit, shiftFocusLeft, shiftFocusRight, increaseFocused, decreaseFocused, handleBlur]
  )

  // Update digits when value changes
  useUpdateEffect(() => {
    setDigits(digitsFromSeconds(value))
  }, [value])

  // Call onChange when digits change
  useUpdateEffect(() => {
    const seconds = secondsFromDigits(digits)
    if (seconds !== value) {
      onChange?.(seconds)
    }
  }, [digits])

  // Use click outside hook
  useClickOutside(containerRef, inputRef, handleBlur)

  const inputClass = useMemo(() => {
    return mergeClasses(
      'flex items-center w-full h-full focus:outline-none px-1',
      focusedDigit ? 'bg-primary/50' : 'bg-transparent',
      disabled ? 'cursor-not-allowed' : 'cursor-text'
    )
  }, [focusedDigit, disabled])

  const colonClass = useMemo(() => {
    return mergeClasses(
      'px-px cursor-pointer select-none',
      size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base',
      disabled ? 'text-disabled cursor-not-allowed' : readOnly ? 'text-read-only cursor-text' : 'cursor-text'
    )
  }, [size, disabled, readOnly])

  const digitClass = useCallback(
    (digit: string) => {
      return mergeClasses(colonClass, focusedDigit === digit ? 'bg-gray-500' : '')
    },
    [focusedDigit, colonClass]
  )

  const handleFocus = useCallback(() => {
    if (disabled || readOnly) return
    // Only set default focus if no digit is currently focused
    if (!focusedDigit) {
      setFocusedDigit('second0')
    }
  }, [disabled, readOnly, focusedDigit])

  const handleColonClick = useCallback(
    (index: number) => {
      if (disabled || readOnly) return
      clickMedian(index)
    },
    [disabled, readOnly, clickMedian]
  )

  const handleDigitClick = useCallback(
    (digit: string) => {
      if (disabled || readOnly) return
      // Ensure the container is focused first, then set the focused digit
      containerRef.current?.focus()
      setFocusedDigit(digit)
    },
    [disabled, readOnly]
  )

  const digitLabel = useCallback((digit: string) => {
    switch (digit) {
      case 'hour2':
        return 'hundreds of hours'
      case 'hour1':
        return 'tens of hours'
      case 'hour0':
        return 'units of hours'
      case 'minute1':
        return 'tens of minutes'
      case 'minute0':
        return 'units of minutes'
      case 'second1':
        return 'tens of seconds'
      case 'second0':
        return 'units of seconds'
      default:
        return ''
    }
  }, [])

  const formatHuman = useMemo(() => {
    const hours = digits.hour2 * 100 + digits.hour1 * 10 + digits.hour0
    const minutes = digits.minute1 * 10 + digits.minute0
    const seconds = digits.second1 * 10 + digits.second0

    const parts: string[] = []
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
    if (seconds > 0 || parts.length === 0) {
      // Always include seconds so “0 seconds” is announced if everything is zero
      parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`)
    }

    return parts.join(' ')
  }, [digits])

  return (
    <InputWrapper disabled={disabled} readOnly={readOnly} borderless={borderless} size={size} className={className} inputRef={inputRef}>
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        className={inputClass}
        onClick={clickInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeydown}
        role="group"
        aria-label={`${readOnly ? 'Read only' : ''} duration picker`}
        aria-describedby={`${durationPickerId}-live-region`}
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        aria-activedescendant={focusedDigit ? `${durationPickerId}-digit-${focusedDigit}` : undefined}
        dir="ltr"
      >
        {digitDisplay.map((digit, index) => (
          <div key={index}>
            {digit === ':' ? (
              <div className={colonClass} onClick={() => handleColonClick(index)} aria-hidden="true">
                :
              </div>
            ) : (
              <div
                id={`${durationPickerId}-digit-${digit}`}
                className={digitClass(digit)}
                onClick={() => handleDigitClick(digit)}
                role="spinbutton"
                aria-valuenow={digits[digit as keyof Digits]}
                aria-valuemin={0}
                aria-valuemax={maxDigitValue(digit)}
                aria-disabled={disabled || undefined}
                aria-readonly={readOnly || undefined}
                aria-label={digitLabel(digit)}
                aria-hidden={readOnly}
              >
                {digits[digit as keyof Digits]}
              </div>
            )}
          </div>
        ))}
        <p id={`${durationPickerId}-live-region`} aria-live="polite" className="sr-only">
          {formatHuman}
        </p>
      </div>
    </InputWrapper>
  )
}

export default DurationPicker
