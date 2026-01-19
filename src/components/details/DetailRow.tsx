import { ReactNode } from 'react'

interface DetailRowProps {
  label: string
  value?: ReactNode
  className?: string
  children?: ReactNode
}

/**
 * Shared layout for a detail row in the details section.
 * Renders a fixed-width label and flexible content.
 * Accepts either `value` (for view mode) or `children` (for edit mode/inputs).
 */
export function DetailRow({ label, value, className = '', children }: DetailRowProps) {
  if (!value && !children) return null

  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-32 text-sm font-medium text-foreground-subdued uppercase flex-shrink-0 self-center">{label}</div>
      <div className="flex-1 text-base min-w-0">{children || value}</div>
    </div>
  )
}
