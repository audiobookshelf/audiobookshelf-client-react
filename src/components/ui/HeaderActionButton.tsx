'use client'

import Btn, { BtnProps } from '@/components/ui/Btn'
import { mergeClasses } from '@/lib/merge-classes'

export default function HeaderActionButton({ onClick, className, size = 'small', color = 'bg-primary', ...props }: BtnProps) {
  return (
    <Btn
      size={size}
      color={color}
      className={mergeClasses('md:me-2', className)}
      onClick={(e) => {
        e.stopPropagation()
        if (onClick) onClick(e)
      }}
      {...props}
    />
  )
}
