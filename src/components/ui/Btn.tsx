'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React, { memo } from 'react'
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
  ariaDescription?: string
  ariaExpanded?: boolean
  ariaControls?: string
}

// Memoized LoadingSpinner component to prevent unnecessary re-renders
const LoadingSpinner = memo<{ progress?: string }>(({ progress }) => {
  return (
    <div className="text-button-foreground absolute inset-0 flex items-center justify-center bg-bg-disabled cursor-not-allowed" aria-hidden="true">
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
  ariaLabel,
  ariaDescription,
  ariaExpanded,
  ariaControls
}: BtnProps) {
  const t = useTypeSafeTranslations()

  const textClass = loading ? 'text-button-foreground/0 disabled:text-disabled/0' : 'text-button-foreground disabled:text-disabled'
  const sizeClass = size === 'small' ? 'text-sm px-4 py-1' : 'px-8 py-2'
  const classList = mergeClasses('inline-flex', textClass, color, sizeClass, className)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    // Prevent clicks during loading or when disabled
    if (onClick && !disabled && !loading) {
      onClick(e)
    }
  }

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
      aria-description={ariaDescription}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
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
