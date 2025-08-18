'use client'

import React, { useMemo, useCallback, memo } from 'react'
import ButtonBase from './ButtonBase'
import { mergeClasses } from '@/lib/merge-classes'

interface IconBtnProps {
  children: React.ReactNode
  disabled?: boolean
  outlined?: boolean
  borderless?: boolean
  loading?: boolean
  size?: 'small' | 'medium' | 'large'
  iconClass?: string
  ariaLabel?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  'aria-pressed'?: boolean
  className?: string
  ref?: React.Ref<HTMLButtonElement>
}

// Memoized LoadingSpinner component to prevent unnecessary re-renders
const LoadingSpinner = memo(() => (
  <div cy-id="icon-btn-loading-spinner" className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white/100" aria-hidden="true">
    <svg className="animate-spin" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
      <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
    </svg>
  </div>
))

LoadingSpinner.displayName = 'LoadingSpinner'

export default function IconBtn({
  children,
  disabled = false,
  outlined = true,
  borderless = false,
  loading = false,
  size = 'medium',
  iconClass,
  ariaLabel,
  onClick,
  onKeyDown,
  'aria-pressed': ariaPressed,
  className = '',
  ref,
  ...props
}: IconBtnProps) {
  const isDisabled = disabled || loading

  const additionalClasses = useMemo(() => {
    const list: string[] = []

    // Icon button specific styling
    if (size === 'small') {
      list.push('w-9 text-lg')
    } else if (size === 'large') {
      list.push('w-11 text-2xl')
    } else {
      list.push('w-10 text-xl')
    }

    return list
  }, [size])

  const classList = useMemo(() => {
    return mergeClasses(additionalClasses, className)
  }, [additionalClasses, className])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (isDisabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
    },
    [onClick, isDisabled]
  )

  return (
    <ButtonBase
      ref={ref}
      size={size}
      disabled={isDisabled}
      borderless={borderless}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      className={classList}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {loading && (
        <span cy-id="icon-btn-loading" className="sr-only">
          Loading...
        </span>
      )}
      {!loading && (
        <span cy-id="icon-btn-icon" className={mergeClasses(outlined ? 'material-symbols' : 'material-symbols fill', iconClass)}>
          {children}
        </span>
      )}
    </ButtonBase>
  )
}
