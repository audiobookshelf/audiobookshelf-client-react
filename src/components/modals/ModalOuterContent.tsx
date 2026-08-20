'use client'

import { mergeClasses } from '@/lib/merge-classes'
import type { ReactNode } from 'react'

export interface ModalOuterContentProps {
  children: ReactNode
  /** Tooltip when the title is truncated */
  title?: string
  className?: string
}

/**
 * Standard title rendered above the modal panel (outside the main panel box).
 */
export default function ModalOuterContent({ children, title, className }: ModalOuterContentProps) {
  const tooltipTitle = title ?? (typeof children === 'string' ? children : undefined)

  return (
    <div className="absolute start-0 top-0 p-4">
      <h2 className={mergeClasses('max-w-[calc(100vw-4rem)] truncate text-xl text-white', className)} title={tooltipTitle}>
        {children}
      </h2>
    </div>
  )
}
