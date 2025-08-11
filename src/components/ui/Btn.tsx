'use client'

import React, { useMemo, useCallback, memo } from 'react'
import Link from 'next/link'
import { mergeClasses } from '@/lib/merge-classes'

interface BtnProps {
  to?: string
  color?: string
  type?: 'button' | 'submit' | 'reset'
  small?: boolean
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
  small = false,
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

    if (small) {
      list.push('text-sm')
      list.push('px-4')
      list.push('py-1')
    } else {
      list.push('px-8')
      list.push('py-2')
    }
    const baseClassList = 'abs-btn rounded-md shadow-md relative border border-gray-600 text-center inline-flex disabled:cursor-not-allowed'
    return mergeClasses(baseClassList, list, className)
  }, [loading, color, small, className])

  const isDisabled = disabled || loading

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (onClick && !isDisabled) {
        onClick(e)
      }
    },
    [onClick, isDisabled]
  )

  if (to) {
    return (
      <Link
        href={to}
        className={classList}
        onClick={handleClick}
        style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        aria-label={ariaLabel}
      >
        {children}
        {loading && <LoadingSpinner progress={progress} />}
        {loading && <span className="sr-only">{progress ? `Loading: ${progress}` : 'Loading...'}</span>}
      </Link>
    )
  }

  return (
    <button className={classList} disabled={isDisabled} type={type} onClick={handleClick} onMouseDown={(e) => e.preventDefault()} aria-label={ariaLabel}>
      {children}
      {loading && <LoadingSpinner progress={progress} />}
      {loading && <span className="sr-only">{progress ? `Loading: ${progress}` : 'Loading...'}</span>}
    </button>
  )
}
