'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { ReactNode, useId, useMemo } from 'react'
import Dropdown from './Dropdown'
import IconBtn from './IconBtn'

/** Tailwind responsive breakpoints */
export type TailwindBreakpoint = 'sm' | 'md' | 'lg'

export interface DataTableColumn<T> {
  /** Header label to display */
  label: ReactNode
  /** Key to access data from row, or render function */
  accessor?: keyof T | ((row: T, index: number) => ReactNode)
  /** Optional className for the header cell */
  headerClassName?: string
  /** Optional className for the data cell */
  cellClassName?: string
  /** Hide column below this breakpoint (e.g., 'md' hides on sm screens) */
  hiddenBelow?: TailwindBreakpoint
}

export interface DataTablePaginationProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Number of rows per page */
  rowsPerPage: number
  /** Available options for rows per page */
  rowsPerPageOptions?: number[]
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when rows per page changes */
  onRowsPerPageChange: (rowsPerPage: number) => void
  /** Label for rows per page (for i18n) */
  rowsPerPageLabel?: string
  /** Label format for page indicator (for i18n) */
  pageLabel?: string
}

export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[]
  /** Column definitions */
  columns: DataTableColumn<T>[]
  /** Key extractor for unique row keys */
  getRowKey: (row: T, index: number) => string | number
  /** Optional custom row renderer - if provided, overrides default row rendering */
  renderRow?: (row: T, index: number) => ReactNode
  /** Optional pagination configuration */
  pagination?: DataTablePaginationProps
  /** Optional table caption for accessibility */
  caption?: string
  /** Optional className for the table container */
  className?: string
  /** Optional className for the table element */
  tableClassName?: string
  /** Optional className for rows */
  rowClassName?: string | ((row: T, index: number) => string)
  /** Optional callback when a row is clicked */
  onRowClick?: (row: T, index: number) => void
}

function DataTablePagination({
  currentPage,
  totalPages,
  rowsPerPage,
  rowsPerPageOptions = [10, 25, 50, 100],
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageLabel = 'Rows per page',
  pageLabel
}: DataTablePaginationProps) {
  const dropdownItems = useMemo(
    () =>
      rowsPerPageOptions.map((opt) => ({
        text: String(opt),
        value: opt
      })),
    [rowsPerPageOptions]
  )

  const pageIndicator = pageLabel || `Page ${currentPage} of ${totalPages}`

  return (
    <div className="flex items-center justify-end gap-4 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">{rowsPerPageLabel}</span>
        <div className="w-20">
          <Dropdown value={rowsPerPage} items={dropdownItems} onChange={(value) => onRowsPerPageChange(value as number)} size="small" />
        </div>
      </div>
      <span className="text-sm text-foreground">{pageIndicator}</span>
      <div className="flex items-center gap-1">
        <IconBtn ariaLabel="Previous page" size="small" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          chevron_left
        </IconBtn>
        <IconBtn ariaLabel="Next page" size="small" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          chevron_right
        </IconBtn>
      </div>
    </div>
  )
}

export default function DataTable<T>({
  data,
  columns,
  getRowKey,
  renderRow,
  pagination,
  caption,
  className,
  tableClassName,
  rowClassName,
  onRowClick
}: DataTableProps<T>) {
  const id = useId()

  const getRowClassName = (row: T, index: number): string => {
    const baseClassName = typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName || ''
    const clickableClassName = onRowClick ? 'cursor-pointer' : ''
    return mergeClasses(baseClassName, clickableClassName)
  }

  const getResponsiveHiddenClass = (breakpoint?: TailwindBreakpoint): string => {
    if (!breakpoint) return ''
    const hiddenClasses: Record<TailwindBreakpoint, string> = {
      sm: 'hidden sm:table-cell',
      md: 'hidden md:table-cell',
      lg: 'hidden lg:table-cell'
    }
    return hiddenClasses[breakpoint]
  }

  const renderCellContent = (row: T, column: DataTableColumn<T>, index: number): ReactNode => {
    if (!column.accessor) {
      return null
    }
    if (typeof column.accessor === 'function') {
      return column.accessor(row, index)
    }
    const value = row[column.accessor]
    if (value === null || value === undefined) {
      return null
    }
    return String(value)
  }

  const renderDefaultRow = (row: T, index: number) => (
    <tr
      key={getRowKey(row, index)}
      className={mergeClasses('border-b border-border even:bg-table-row-bg-even hover:bg-table-row-bg-hover', getRowClassName(row, index))}
      onClick={onRowClick ? () => onRowClick(row, index) : undefined}
    >
      {columns.map((column, colIndex) => (
        <td key={`${id}-cell-${index}-${colIndex}`} className={mergeClasses('py-2 px-2', getResponsiveHiddenClass(column.hiddenBelow), column.cellClassName)}>
          {renderCellContent(row, column, index)}
        </td>
      ))}
    </tr>
  )

  return (
    <div className={mergeClasses('w-full', className)}>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className={mergeClasses('text-sm w-full border-collapse', tableClassName)}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-table-header-bg">
            <tr className="border-b border-border">
              {columns.map((column, index) => (
                <th
                  key={`${id}-header-${index}`}
                  className={mergeClasses(
                    'text-start py-2 px-2 text-xs font-semibold text-foreground-muted',
                    getResponsiveHiddenClass(column.hiddenBelow),
                    column.headerClassName
                  )}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{data.map((row, index) => (renderRow ? renderRow(row, index) : renderDefaultRow(row, index)))}</tbody>
        </table>
      </div>
      {pagination && <DataTablePagination {...pagination} />}
    </div>
  )
}
