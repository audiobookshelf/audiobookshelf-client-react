'use client'

import { isValidIcon } from '@/lib/absicons'
import { mergeClasses } from '@/lib/merge-classes'

interface LibraryIconProps {
  icon?: string
  fontSize?: string
  size?: number
  className?: string
  /** Accessibility label for screen readers */
  ariaLabel?: string
  /** Whether the icon is decorative (true) or meaningful (false) */
  decorative?: boolean
}

/**
 * A component that displays a library icon using the absicons font.
 * The component validates the icon against the list of available icons and falls back to 'audiobookshelf' if invalid.
 */
export default function LibraryIcon({
  icon = 'audiobookshelf',
  fontSize = 'text-lg',
  size = 5,
  className = '',
  ariaLabel,
  decorative = true
}: LibraryIconProps) {
  const sizeClasses = size === 6 ? 'h-6 w-6 min-w-6' : 'h-5 w-5 min-w-5'
  const classList = mergeClasses('flex items-center justify-center', sizeClasses, fontSize, className)

  const iconToUse = isValidIcon(icon) ? icon : 'audiobookshelf'

  // Generate default aria-label if not provided
  const defaultAriaLabel = (() => {
    if (ariaLabel) return ariaLabel
    if (decorative) return ''
    // Convert icon name to readable text
    const readableName = iconToUse.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    return `${readableName} icon`
  })()

  return (
    <div
      cy-id="library-icon"
      className={classList}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : defaultAriaLabel}
      aria-hidden={decorative}
    >
      <span cy-id="library-icon-span" className={`abs-icons icon-${iconToUse}`} />
    </div>
  )
}
