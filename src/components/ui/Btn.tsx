'use client'

import React, { useMemo, useCallback, memo } from 'react'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
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
const LoadingSpinner = memo<{ progress?: string }>(({ progress }) => {
  return (
    <div
      className="text-white/100 absolute top-0 start-0 w-full h-full flex items-center justify-center bg-bg-disabled rounded-md cursor-not-allowed"
      aria-hidden="true"
    >
      {progress ? (
        <span>{progress}</span>
      ) : (
        <svg className="animate-spin" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
          <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
        </svg>
      )}
    </div>
  )
})

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
  const t = useTypeSafeTranslations()
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

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      // Prevent clicks during loading or when disabled
      if (onClick && !disabled && !loading) {
        onClick(e)
      }
    },
    [onClick, disabled, loading]
  )

  return (
    <ButtonBase
      to={to}
      size={size}
      className={classList}
      disabled={disabled}
      type={type}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      ariaLabel={ariaLabel}
      aria-busy={loading || undefined}
    >
      {children}
      {loading && <LoadingSpinner progress={progress} />}
      {loading && (
        <span className="sr-only" role="status" aria-live="polite">
          {progress ? progress : t('MessageLoading')}{' '}
        </span>
      )}
    </ButtonBase>
  )
}
