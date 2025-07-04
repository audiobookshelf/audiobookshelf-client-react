'use client'

import React, { useMemo, useCallback, memo } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import styles from './IconBtn.module.css'

interface IconBtnProps {
  icon: string
  disabled?: boolean
  bgColor?: string
  outlined?: boolean
  borderless?: boolean
  loading?: boolean
  iconFontSize?: string
  size?: number
  ariaLabel?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}

// Memoized LoadingSpinner component to prevent unnecessary re-renders
const LoadingSpinner = memo(() => (
  <div 
    className="text-white/100 absolute top-0 left-0 w-full h-full flex items-center justify-center"
    aria-hidden="true"
  >
    <svg className="animate-spin" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
      <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
    </svg>
  </div>
))

LoadingSpinner.displayName = 'LoadingSpinner'

export default function IconBtn({
  icon,
  disabled = false,
  bgColor = 'bg-primary',
  outlined = false,
  borderless = false,
  loading = false,
  iconFontSize = '',
  size = 9,
  ariaLabel,
  onClick,
  className = ''
}: IconBtnProps) {
  const classList = useMemo(() => {
    const list: string[] = []
    
    list.push(`h-${size} w-${size}`)
    
    if (!borderless) {
      list.push(`${bgColor} border border-gray-600`)
    }
    
    const baseClassList = `${styles.iconBtn} rounded-md flex items-center justify-center relative`
    return mergeClasses(baseClassList, list, className)
  }, [size, borderless, bgColor, className])

  const fontSize = useMemo(() => {
    if (iconFontSize) return iconFontSize
    if (icon === 'edit') return '1.25rem'
    return '1.4rem'
  }, [iconFontSize, icon])

  const isDisabled = disabled || loading

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    if (onClick) {
      onClick(e)
    }
    e.stopPropagation()
  }, [onClick, isDisabled])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }, [])

  return (
    <button
      aria-label={ariaLabel}
      className={classList}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {loading && <LoadingSpinner />}
      {loading && <span cy-id="icon-btn-loading" className="sr-only">Loading...</span>}
      {!loading && (
        <span
          cy-id="icon-btn-icon" 
          className={outlined ? 'material-symbols' : 'material-symbols fill'}
          style={{ fontSize }}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      )}
    </button>
  )
} 