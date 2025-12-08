'use client'

import { mergeClasses } from '@/lib/merge-classes'
import React from 'react'
import IconBtn from './IconBtn'

interface ReadIconBtnProps {
  isRead: boolean
  disabled?: boolean
  borderless?: boolean
  onClick?: () => void
  className?: string
}

export default function ReadIconBtn({ isRead, disabled = false, borderless = false, onClick, className }: ReadIconBtnProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation()
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.()
  }

  const ariaLabel = isRead ? 'Mark as not finished' : 'Mark as finished'
  const classes = mergeClasses(isRead ? 'text-green-400' : 'text-gray-400', className)

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
