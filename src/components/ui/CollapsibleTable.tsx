'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { KeyboardEvent, ReactNode, useCallback, useId, useMemo } from 'react'

interface TableHeader {
  label: ReactNode
  className?: string
  scope?: string
}

interface CollapsibleTableProps {
  title: string
  count: number
  expanded?: boolean
  onExpandedChange: (expanded: boolean) => void
  keepOpen?: boolean
  headerActions?: ReactNode
  tableHeaders: TableHeader[]
  tableClassName?: string
  children: ReactNode
}

export default function CollapsibleTable({
  title,
  count,
  expanded = false,
  onExpandedChange,
  keepOpen = false,
  headerActions,
  tableHeaders,
  tableClassName,
  children
}: CollapsibleTableProps) {
  const t = useTypeSafeTranslations()
  const id = useId()

  // Note: Click events from headerActions buttons should call e.stopPropagation()
  // to prevent toggling the table when clicking action buttons
  const handleClickBar = useCallback(() => {
    if (!keepOpen) {
      onExpandedChange(!expanded)
    }
  }, [keepOpen, expanded, onExpandedChange])

  const handleKeyDownBar = useCallback(
    (e: KeyboardEvent) => {
      if (!keepOpen && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onExpandedChange(!expanded)
      }
    },
    [keepOpen, expanded, onExpandedChange]
  )

  const isExpanded = keepOpen || expanded

  const headerClasses = useMemo(() => mergeClasses('w-full bg-primary py-2 flex items-center px-4 md:px-6', keepOpen ? '' : 'cursor-pointer'), [keepOpen])

  const iconClasses = useMemo(
    () =>
      mergeClasses(
        'cursor-pointer h-10 w-10 rounded-full hover:bg-bg-hover flex justify-center items-center duration-500',
        isExpanded ? 'transform rotate-180' : ''
      ),
    [isExpanded]
  )

  const countBadgeClasses = 'h-5 md:h-7 w-5 md:w-7 rounded-full bg-white/10 flex items-center justify-center'

  const countAriaLabel = useMemo(() => t('LabelItemsPlural', { count }), [count, t])

  const tableClasses = mergeClasses('text-sm w-full border-collapse border border-border', tableClassName)

  const contentId = useMemo(() => `${id}-content`, [id])
  const ariaControls = useMemo(() => (keepOpen ? undefined : contentId), [keepOpen, contentId])
  const ariaExpanded = useMemo(() => (keepOpen ? undefined : isExpanded), [keepOpen, isExpanded])
  const role = useMemo(() => (keepOpen ? undefined : 'button'), [keepOpen])
  const tabIndex = useMemo(() => (keepOpen ? undefined : 0), [keepOpen])

  return (
    <div className="w-full my-2">
      <div
        className={headerClasses}
        onClick={handleClickBar}
        onKeyDown={handleKeyDownBar}
        role={role}
        tabIndex={tabIndex}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
      >
        <p className="pe-2 md:pe-4">{title}</p>
        <div className={countBadgeClasses} aria-label={countAriaLabel} role="status">
          <span className="text-sm font-mono" aria-hidden="true">
            {count}
          </span>
        </div>
        <div className="grow" />
        {headerActions}
        {!keepOpen && (
          <div className={iconClasses} aria-hidden="true">
            <span className="material-symbols text-4xl">keyboard_arrow_down</span>
          </div>
        )}
      </div>
      {isExpanded && (
        <div id={`${id}-content`} role="region" aria-label={title}>
          <table className={tableClasses}>
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                {tableHeaders.map((header, index) => (
                  <th key={index} className={mergeClasses('text-start py-1 text-xs', header.className)} scope={header.scope ?? 'col'}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
