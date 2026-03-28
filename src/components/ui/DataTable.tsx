'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import Checkbox from './Checkbox'
import Dropdown from './Dropdown'
import IconBtn from './IconBtn'

/** Tailwind responsive breakpoints */
export type TailwindBreakpoint = 'sm' | 'md' | 'lg'

export interface DataTableColumn<T> {
  /** Header label to display */
  label: ReactNode
  /** Key to access data from row, or render function */
  accessor?: keyof T | ((row: T, index: number) => ReactNode)
  /** Optional key used by sorting state */
  sortKey?: string
  /** Enables sort interaction for this column */
  sortable?: boolean
  /** Optional className for the header cell */
  headerClassName?: string
  /** Optional className for the data cell */
  cellClassName?: string
  /** Optional minimum width of the table (in pixels) required to show this column */
  minTableWidth?: number
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

export interface DataTableSelectionProps<T> {
  /** Selected row keys for controlled selection state */
  selectedRowKeys: Array<string | number>
  /** Toggle a single row selection state */
  onToggleRow: (row: T, index: number, selected: boolean) => void
  /** Toggle all visible rows selection state */
  onToggleAllRows: (selected: boolean, rows: T[]) => void
  /** Optional override for selected row detection */
  getIsRowSelected?: (row: T, index: number) => boolean
  /** Optional className for checkbox cells/column */
  checkboxColumnClassName?: string
  /** Hide checkbox column below this breakpoint */
  hideCheckboxBelow?: TailwindBreakpoint
}

export interface DataTableBulkActionsProps {
  /** Optional selected label" */
  selectedLabel?: ReactNode | ((selectedCount: number) => ReactNode)
  /** Actions rendered on the right side of the bulk header */
  actions: ReactNode
  /** Optional className for bulk header */
  className?: string
}

export interface DataTableSortingProps {
  /** Currently active sort key */
  sortBy: string
  /** Sort direction */
  sortDesc: boolean
  /** Callback when a sortable header is clicked */
  onSortChange: (sortBy: string, sortDesc: boolean) => void
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
  /** Optional row selection configuration */
  selection?: DataTableSelectionProps<T>
  /** Optional bulk actions shown in place of header when rows are selected */
  bulkActions?: DataTableBulkActionsProps
  /** Optional sortable columns configuration */
  sorting?: DataTableSortingProps
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
  onRowClick,
  selection,
  bulkActions,
  sorting
}: DataTableProps<T>) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRowRef = useRef<HTMLTableRowElement>(null)
  const [tableWidth, setTableWidth] = useState<number | null>(null)
  const [headerHeight, setHeaderHeight] = useState(44)

  useEffect(() => {
    if (!containerRef.current) return

    const updateWidth = () => {
      if (containerRef.current) {
        setTableWidth(containerRef.current.getBoundingClientRect().width)
      }
    }

    updateWidth()

    const resizeObserver = new ResizeObserver(() => {
      updateWidth()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (col.minTableWidth === undefined) return true
      // If tableWidth is not yet measured (null), default to showing all columns
      // or specific logic. Here we show all to avoid hydration mismatch/flicker if wide enough.
      // Alternatively, could hide if we want to be conservative.
      if (tableWidth === null) return true
      return tableWidth >= col.minTableWidth
    })
  }, [columns, tableWidth])

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

  const getRowKeyValue = (row: T, index: number): string | number => getRowKey(row, index)

  const selectedRowKeySet = useMemo(() => {
    if (!selection) return new Set<string | number>()
    return new Set(selection.selectedRowKeys)
  }, [selection])

  const isRowSelected = (row: T, index: number): boolean => {
    if (!selection) return false
    if (selection.getIsRowSelected) return selection.getIsRowSelected(row, index)
    return selectedRowKeySet.has(getRowKeyValue(row, index))
  }

  const numSelectedRows = useMemo(() => {
    if (!selection) return 0
    return data.reduce((count, row, index) => {
      const rowSelected = selection.getIsRowSelected ? selection.getIsRowSelected(row, index) : selectedRowKeySet.has(getRowKey(row, index))
      return rowSelected ? count + 1 : count
    }, 0)
  }, [data, selection, selectedRowKeySet, getRowKey])

  const isAllRowsSelected = data.length > 0 && numSelectedRows === data.length
  const isPartiallySelected = numSelectedRows > 0 && !isAllRowsSelected
  const showBulkHeader = !!selection && !!bulkActions && numSelectedRows > 0

  useEffect(() => {
    if (!headerRowRef.current) return

    const updateHeaderHeight = () => {
      if (headerRowRef.current) {
        setHeaderHeight(headerRowRef.current.getBoundingClientRect().height)
      }
    }

    updateHeaderHeight()

    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight()
    })

    resizeObserver.observe(headerRowRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [visibleColumns.length, showBulkHeader])

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
      key={getRowKeyValue(row, index)}
      className={mergeClasses('border-b border-border even:bg-table-row-bg-even hover:bg-table-row-bg-hover', getRowClassName(row, index))}
      onClick={onRowClick ? () => onRowClick(row, index) : undefined}
    >
      {selection && (
        <td
          className={mergeClasses(
            'h-11 w-12 min-w-12 px-0 text-center align-middle',
            getResponsiveHiddenClass(selection.hideCheckboxBelow),
            selection.checkboxColumnClassName
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center">
            <Checkbox
              value={isRowSelected(row, index)}
              size="small"
              checkboxBgClass="bg-bg"
              ariaLabel={'Select row'}
              onChange={(nextSelected) => selection.onToggleRow(row, index, nextSelected)}
            />
          </div>
        </td>
      )}
      {visibleColumns.map((column, colIndex) => (
        <td key={`${id}-cell-${index}-${colIndex}`} className={mergeClasses('py-2 px-2', getResponsiveHiddenClass(column.hiddenBelow), column.cellClassName)}>
          {renderCellContent(row, column, index)}
        </td>
      ))}
    </tr>
  )

  const renderHeaderCell = (column: DataTableColumn<T>, index: number) => {
    const sortKey = column.sortKey || (typeof column.accessor === 'string' ? String(column.accessor) : undefined)
    const isSortable = !!sorting && !!column.sortable && !!sortKey
    const isActiveSort = isSortable && sorting.sortBy === sortKey

    if (!isSortable) {
      return (
        <th
          key={`${id}-header-${index}`}
          className={mergeClasses(
            'text-start py-2 px-2 text-xs font-semibold text-foreground-muted',
            column.headerClassName,
            getResponsiveHiddenClass(column.hiddenBelow)
          )}
          scope="col"
        >
          {column.label}
        </th>
      )
    }

    return (
      <th
        key={`${id}-header-${index}`}
        className={mergeClasses(
          'text-start py-2 px-2 text-xs font-semibold text-foreground-muted group cursor-pointer select-none',
          column.headerClassName,
          getResponsiveHiddenClass(column.hiddenBelow)
        )}
        scope="col"
        onClick={() => sorting.onSortChange(sortKey, isActiveSort ? !sorting.sortDesc : true)}
      >
        <div className="inline-flex items-center">
          {column.label}
          <span className={mergeClasses('material-symbols text-base pl-px', isActiveSort ? '' : 'opacity-0 group-hover:opacity-30')}>
            {sorting.sortDesc ? 'arrow_drop_down' : 'arrow_drop_up'}
          </span>
        </div>
      </th>
    )
  }

  const bulkSelectedLabel =
    typeof bulkActions?.selectedLabel === 'function' ? bulkActions.selectedLabel(numSelectedRows) : bulkActions?.selectedLabel || `${numSelectedRows} selected`

  const renderSelectionHeaderCell = () => {
    if (!selection) return null

    return (
      <th
        className={mergeClasses(
          'h-11 w-12 min-w-12 px-0 text-center align-middle',
          getResponsiveHiddenClass(selection.hideCheckboxBelow),
          selection.checkboxColumnClassName
        )}
        onClick={(e) => e.stopPropagation()}
        scope="col"
      >
        <div className="flex items-center justify-center">
          <Checkbox
            value={isAllRowsSelected}
            partial={isPartiallySelected}
            size="small"
            checkboxBgClass="bg-bg"
            ariaLabel={'Select all rows'}
            onChange={(selected) => selection.onToggleAllRows(selected, data)}
          />
        </div>
      </th>
    )
  }

  return (
    <div ref={containerRef} className={mergeClasses('w-full', className)}>
      <div className="overflow-x-auto rounded-md border border-border relative">
        <table className={mergeClasses('text-sm w-full border-collapse', tableClassName)}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-table-header-bg">
            <tr ref={headerRowRef} className="border-b border-border">
              {renderSelectionHeaderCell()}
              {visibleColumns.map((column, index) => renderHeaderCell(column, index))}
            </tr>
          </thead>
          <tbody>{data.map((row, index) => (renderRow ? renderRow(row, index) : renderDefaultRow(row, index)))}</tbody>
        </table>
        {showBulkHeader && (
          <div className="absolute inset-x-0 top-0 z-20 border-b border-border bg-table-header-bg" style={{ height: `${headerHeight}px` }}>
            <div className={mergeClasses('flex h-full items-center', bulkActions?.className)}>
              {selection && (
                <div
                  className={mergeClasses(
                    'h-full w-12 min-w-12 px-0 text-center align-middle',
                    getResponsiveHiddenClass(selection.hideCheckboxBelow),
                    selection.checkboxColumnClassName
                  )}
                >
                  <div className="flex h-full items-center justify-center">
                    <Checkbox
                      value={isAllRowsSelected}
                      partial={isPartiallySelected}
                      size="small"
                      checkboxBgClass="bg-bg"
                      ariaLabel={'Select all rows'}
                      onChange={(selected) => selection.onToggleAllRows(selected, data)}
                    />
                  </div>
                </div>
              )}
              <div className="flex min-h-0 min-w-0 flex-1 items-center justify-between gap-2 px-2">
                <span className="text-sm text-foreground whitespace-nowrap">{bulkSelectedLabel}</span>
                <div className="shrink-0">{bulkActions?.actions}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {pagination && <DataTablePagination {...pagination} />}
    </div>
  )
}
