'use client'

import { useMemo } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

export interface LabelProps {
  children: React.ReactNode
  id?: string
  htmlFor?: string
  disabled?: boolean
  className?: string
}

/**
 * Standardized label component for form inputs
 * Consolidates common label styling patterns across UI components
 */
export default function Label({ children, id, htmlFor, disabled = false, className }: LabelProps) {
  const labelClass = useMemo(() => {
    return mergeClasses('w-fit text-sm font-semibold px-1 block mb-1', disabled ? 'text-disabled' : '', className)
  }, [disabled, className])

  return (
    <label id={id} htmlFor={htmlFor} className={labelClass} cy-id="label">
      {children}
    </label>
  )
}
