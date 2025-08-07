import React from 'react'
import IconBtn from './IconBtn'
import { mergeClasses } from '@/lib/merge-classes'

interface ReadIconBtnProps {
  isRead: boolean
  disabled?: boolean
  borderless?: boolean
  onClick?: () => void
  className?: string
}

export default function ReadIconBtn({ isRead, disabled = false, borderless = false, onClick, className }: ReadIconBtnProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.()
  }

  const ariaLabel = isRead ? 'Mark as not finished' : 'Mark as finished'

  return (
    <IconBtn
      icon="&#xe52d;" // BeenHere icon
      disabled={disabled}
      borderless={borderless}
      ariaLabel={ariaLabel}
      onClick={handleClick}
      className={mergeClasses(isRead ? 'text-green-400' : 'text-gray-400', className)}
    />
  )
}
