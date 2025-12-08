'use client'

import { mergeClasses } from '@/lib/merge-classes'
import React, { memo } from 'react'
import ButtonBase from './ButtonBase'

interface IconBtnProps {
  children: React.ReactNode
  disabled?: boolean
  outlined?: boolean
  borderless?: boolean
  loading?: boolean
  size?: 'small' | 'medium' | 'large'
  iconClass?: string
  ariaLabel?: string
  to?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  'aria-pressed'?: boolean
  className?: string
  ref?: React.Ref<HTMLButtonElement>
  tabIndex?: number
  [key: string]: unknown
}

// Memoized LoadingSpinner component to prevent unnecessary re-renders
const LoadingSpinner = memo(() => (
  <div
    cy-id="icon-btn-loading-spinner"
    className="absolute top-0 start-0 w-full h-full flex items-center justify-center text-foreground/100"
    aria-hidden="true"
  >
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
  to,
  onClick,
  onMouseDown,
  onKeyDown,
  'aria-pressed': ariaPressed,
  className = '',
  ref,
  tabIndex,
  ...props
}: IconBtnProps) {
  const isDisabled = disabled || loading

  // Icon button specific styling based on size
  const sizeClass = size === 'small' ? 'w-9 text-lg' : size === 'large' ? 'w-11 text-2xl' : 'w-10 text-xl'
  const classList = mergeClasses(sizeClass, className)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  return (
    <ButtonBase
      ref={ref}
      size={size}
      disabled={isDisabled}
      borderless={borderless}
      to={to}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      className={classList}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      tabIndex={tabIndex}
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
