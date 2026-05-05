'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React from 'react'
import IconBtn from './IconBtn'

interface ReadIconBtnProps {
  isRead: boolean
  size?: 'small' | 'medium' | 'large' | 'auto' | 'custom'
  disabled?: boolean
  borderless?: boolean
  onClick?: () => void
  className?: string
  tabIndex?: number
}

export default function ReadIconBtn({ isRead, size = 'medium', disabled = false, borderless = false, onClick, className, tabIndex }: ReadIconBtnProps) {
  const t = useTypeSafeTranslations()
  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation()
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.()
  }

  const classes = mergeClasses(isRead ? 'text-green-400' : 'text-gray-400', className)

  return (
    <IconBtn
      size={size}
      disabled={disabled}
      borderless={borderless}
      outlined={!isRead}
      ariaLabel={isRead ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')}
      onClick={handleClick}
      aria-pressed={isRead}
      className={classes}
      tabIndex={tabIndex}
    >
      BeenHere
    </IconBtn>
  )
}
