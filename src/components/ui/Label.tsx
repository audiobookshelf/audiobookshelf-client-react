'use client'

import { mergeClasses } from '@/lib/merge-classes'

export interface LabelProps {
  children: React.ReactNode
  id?: string
  htmlFor?: string
  disabled?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Standardized label component for form inputs
 * Consolidates common label styling patterns across UI components
 */
export default function Label({ children, id, htmlFor, disabled = false, className, onClick }: LabelProps) {
  const labelClass = mergeClasses('w-fit text-sm font-semibold px-1 block mb-1', disabled ? 'text-disabled' : '', className)
  const handleClick = disabled || !onClick ? undefined : onClick

  return (
    <label id={id} htmlFor={htmlFor} className={labelClass} cy-id="label" onClick={handleClick}>
      {children}
    </label>
  )
}
