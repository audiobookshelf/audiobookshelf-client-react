import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import React from 'react'

export interface MediaOverlayIconBtnProps {
  icon: string
  onClick: (event: React.MouseEvent) => void
  ariaLabel: string
  position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  className?: string
  selected?: boolean
  cyId?: string
}

export default function MediaOverlayIconBtn({ icon, onClick, ariaLabel, position = 'top-start', className, selected, cyId }: MediaOverlayIconBtnProps) {
  const positionClasses = {
    'top-start': 'top-[0.375em] start-[0.375em]',
    'top-end': 'top-[0.375em] end-[0.375em]',
    'bottom-start': 'bottom-[0.375em] start-[0.375em]',
    'bottom-end': 'bottom-[0.375em] end-[0.375em]'
  }

  return (
    <div cy-id={cyId} className={mergeClasses('absolute z-40', positionClasses[position])}>
      <IconBtn
        borderless
        size="small"
        className={mergeClasses(
          'text-gray-200 hover:not-disabled:text-yellow-300 hover:scale-125 transform duration-150 text-[1em] w-auto h-auto',
          selected && 'text-yellow-400',
          className
        )}
        onClick={onClick}
        ariaLabel={ariaLabel}
      >
        {icon}
      </IconBtn>
    </div>
  )
}
