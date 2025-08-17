'use client'

import React, { useMemo, useCallback, memo } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import ButtonBase from './ButtonBase'

interface BtnProps {
  to?: string
  color?: string
  type?: 'button' | 'submit' | 'reset'
  size?: 'small' | 'medium'
  loading?: boolean
  disabled?: boolean
  progress?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  className?: string
  ariaLabel?: string
}

// Memoized LoadingSpinner component to prevent unnecessary re-renders
const LoadingSpinner = memo<{ progress?: string }>(({ progress }) => (
  <div className="text-white/100 absolute top-0 left-0 w-full h-full flex items-center justify-center" aria-hidden="true">
    {progress ? (
      <span>{progress}</span>
    ) : (
      <svg className="animate-spin" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
        <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
      </svg>
    )}
  </div>
))

LoadingSpinner.displayName = 'LoadingSpinner'

export default function Btn({
  to,
  color = 'bg-primary',
  type = 'button',
  size = 'medium',
  loading = false,
  disabled = false,
  progress,
  children,
  onClick,
  className = '',
  ariaLabel
}: BtnProps) {
  const classList = useMemo(() => {
    const list: string[] = []

    // Optimize conditional class logic
    list.push(loading ? 'text-white/0 disabled:text-disabled/0' : 'text-white disabled:text-disabled')
    list.push(color)

    if (size === 'small') {
      list.push('text-sm')
      list.push('px-4')
      list.push('py-1')
    } else {
      list.push('px-8')
      list.push('py-2')
    }
    const baseClassList = 'inline-flex'
    return mergeClasses(baseClassList, list, className)
  }, [loading, color, size, className])

  const isDisabled = disabled || loading

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (onClick && !isDisabled) {
        onClick(e)
      }
    },
    [onClick, isDisabled]
  )

  return (
    <ButtonBase
      to={to}
      size={size}
      className={classList}
      disabled={isDisabled}
      type={type}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      ariaLabel={ariaLabel}
    >
      {children}
      {loading && <LoadingSpinner progress={progress} />}
      {loading && <span className="sr-only">{progress ? `Loading: ${progress}` : 'Loading...'}</span>}
    </ButtonBase>
  )
}
