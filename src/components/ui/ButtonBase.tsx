'use client'

import React, { useMemo, useCallback } from 'react'
import Link from 'next/link'
import { mergeClasses } from '@/lib/merge-classes'

interface ButtonBaseProps {
  id?: string
  to?: string
  children: React.ReactNode
  disabled?: boolean
  borderless?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
  className?: string
  ref?: React.Ref<any>
  // Allow any additional HTML attributes
  [key: string]: any
}

const ButtonBase = ({
  id,
  to,
  children,
  disabled = false,
  borderless = false,
  size = 'medium',
  className = '',
  onClick,
  onMouseDown,
  onKeyDown,
  type = 'button',
  ariaLabel,
  ref,
  ...props
}: ButtonBaseProps) => {
  const buttonClass = useMemo(() => {
    return mergeClasses(
      // Base styles
      'relative shadow-md border border-gray-600 rounded-md bg-primary flex items-center justify-center',

      // Focus styles
      'focus-visible:outline-1 focus-visible:outline-white/80 focus-visible:outline-offset-0',

      // Size-based height (identical to InputWrapper)
      size === 'small' ? 'h-9' : size === 'large' ? 'h-11' : size === 'auto' ? 'min-h-10 h-auto' : 'h-10',

      // Disabled styles
      'disabled:bg-bg-disabled disabled:cursor-not-allowed disabled:border-none disabled:text-disabled',

      // Borderless styles
      borderless ? 'border-0 bg-transparent shadow-none' : 'border',

      // Before pseudo-element (replacing abs-btn::before)
      'before:content-[""] before:absolute before:inset-0 before:rounded-md before:bg-transparent before:pointer-events-none',

      // Hover styles
      borderless ? 'hover:not-disabled:text-yellow-300 hover:not-disabled:scale-125' : 'hover:not-disabled:before:bg-bg-hover',

      // Custom className
      className
    )
  }, [disabled, size, className])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (onClick && !disabled) {
        onClick(e)
      }
    },
    [onClick, disabled]
  )

  const isDisabled = disabled

  if (to) {
    return (
      <Link
        href={to}
        className={buttonClass}
        onClick={handleClick}
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
        style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      id={id}
      ref={ref}
      type={type}
      disabled={disabled}
      className={buttonClass}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )
}

export default ButtonBase
