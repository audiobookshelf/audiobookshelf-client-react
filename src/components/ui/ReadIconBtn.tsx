'use client'

import { mergeClasses } from '@/lib/merge-classes'
import React, { useCallback, useMemo } from 'react'
import IconBtn from './IconBtn'

interface ReadIconBtnProps {
  isRead: boolean
  disabled?: boolean
  borderless?: boolean
  onClick?: () => void
  className?: string
}

export default function ReadIconBtn({ isRead, disabled = false, borderless = false, onClick, className }: ReadIconBtnProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      e.stopPropagation()
      if (disabled) {
        e.preventDefault()
        return
      }
      onClick?.()
    },
    [disabled, onClick]
  )

  const ariaLabel = useMemo(() => (isRead ? 'Mark as not finished' : 'Mark as finished'), [isRead])

  const classes = useMemo(() => mergeClasses(isRead ? 'text-green-400' : 'text-gray-400', className), [isRead, className])

  return (
    <IconBtn
      disabled={disabled}
      borderless={borderless}
      outlined={!isRead}
      ariaLabel={ariaLabel}
      onClick={handleClick}
      aria-pressed={isRead}
      className={classes}
    >
      BeenHere
    </IconBtn>
  )
}
