'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { KeyboardEvent, MouseEvent, ReactNode, useCallback, useId, useMemo, useState } from 'react'
import IconBtn from './IconBtn'

interface AccordionSectionProps {
  /** Title displayed in the header */
  title: string
  /** Optional badge content (e.g. text pill) */
  badge?: ReactNode
  /** Optional numerical count (displayed in circular badge) */
  count?: number
  /** Whether the section is initially expanded */
  defaultExpanded?: boolean
  /** Controlled expanded state */
  expanded?: boolean
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void
  /** If true, the section is always expanded and header is not interactive */
  keepOpen?: boolean
  /** Content to render when expanded */
  children: ReactNode
  /** Additional class names for the container */
  className?: string
  /** Optional actions to display in the header */
  headerActions?: ReactNode
}

/**
 * Reusable accordion section component for collapsible content.
 *
 * Features:
 * - Accessible expand/collapse with keyboard support (Enter/Space)
 * - ARIA attributes for screen readers
 * - Customizable header with title, badge, and actions
 * - Smooth expand/collapse animation
 * - Can be controlled or uncontrolled
 */
export default function AccordionSection({
  title,
  badge,
  count,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  keepOpen = false,
  children,
  className,
  headerActions
}: AccordionSectionProps) {
  const id = useId()
  const t = useTypeSafeTranslations()

  // Internal state for uncontrolled mode
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)

  // Use controlled value if provided, otherwise internal state
  const isExpanded = keepOpen || (controlledExpanded !== undefined ? controlledExpanded : internalExpanded)

  const handleToggle = useCallback(() => {
    if (keepOpen) return

    const newValue = !isExpanded
    if (controlledExpanded === undefined) {
      setInternalExpanded(newValue)
    }
    onExpandedChange?.(newValue)
  }, [isExpanded, controlledExpanded, onExpandedChange, keepOpen])

  const handleHeaderClick = useCallback(
    (e: MouseEvent) => {
      if (keepOpen) return

      // Prevent toggling if clicking on an interactive element
      const target = e.target as HTMLElement
      if (target.closest('button, a, input, [role="button"]')) {
        return
      }

      handleToggle()
    },
    [keepOpen, handleToggle]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (keepOpen) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggle()
      }
    },
    [handleToggle, keepOpen]
  )

  const contentId = useMemo(() => `${id}-content`, [id])
  const headerId = useMemo(() => `${id}-header`, [id])

  const headerClasses = useMemo(
    () =>
      mergeClasses(
        'w-full bg-primary py-2 pl-4 pr-2 md:pl-6 md:pr-3 flex items-center',
        'transition-colors duration-150',
        keepOpen ? '' : 'cursor-pointer focus-visible:outline-1 focus-visible:outline-white/80 focus-visible:outline-offset-0'
      ),
    [keepOpen]
  )

  const iconClasses = useMemo(
    () =>
      mergeClasses(
        'h-8 w-8 md:h-10 md:w-10 rounded-full flex justify-center items-center',
        'transition-transform duration-300 flex-shrink-0',
        isExpanded ? 'rotate-180' : ''
      ),
    [isExpanded]
  )

  const contentClasses = useMemo(
    () => mergeClasses('overflow-hidden transition-all duration-300 ease-in-out', isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'),
    [isExpanded]
  )

  const countBadgeClasses = 'h-5 md:h-7 w-5 md:w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0'
  const countAriaLabel = count !== undefined ? t('LabelItemsPlural', { count }) : ''

  return (
    <div className={mergeClasses('w-full', className)}>
      {/* Header - clickable to toggle */}
      <div id={headerId} className={headerClasses} onClick={handleHeaderClick}>
        <div className="flex items-center flex-1 min-w-0 flex-wrap gap-1 md:gap-2 text-left bg-transparent border-none p-0 text-inherit">
          <div className="flex items-center flex-shrink-0 min-w-0 gap-2">
            <p className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{title}</p>
            {count !== undefined && (
              <div className={countBadgeClasses} aria-label={countAriaLabel} role="status">
                <span className="text-sm font-mono" aria-hidden="true">
                  {count}
                </span>
              </div>
            )}
            {badge && (
              <div className="h-6 px-2 rounded-full bg-white/10 flex items-center justify-center text-sm" aria-hidden="true">
                {badge}
              </div>
            )}
          </div>
        </div>

        {headerActions && <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2">{headerActions}</div>}

        {!keepOpen && (
          <IconBtn
            borderless
            size="custom"
            className={mergeClasses(iconClasses, 'cursor-pointer focus-visible:outline-1 focus-visible:outline-white/80 focus-visible:outline-offset-0')}
            iconClass="text-2xl md:text-3xl"
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            ariaLabel={isExpanded ? t('LabelCollapse') : t('LabelExpand')}
          >
            keyboard_arrow_down
          </IconBtn>
        )}
      </div>

      {/* Collapsible content */}
      <div id={contentId} className={contentClasses} role="region" aria-labelledby={headerId} inert={!keepOpen && !isExpanded ? true : undefined}>
        {children}
      </div>
    </div>
  )
}
