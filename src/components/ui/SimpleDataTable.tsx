'use client'

import DataTable, { type DataTableColumn, type DataTablePaginationProps, type DataTableProps, type TailwindBreakpoint } from './DataTable'

export type { DataTableColumn, DataTablePaginationProps, TailwindBreakpoint }

export type SimpleDataTableProps<T> = Omit<DataTableProps<T>, 'selection' | 'bulkActions' | 'sorting'>

export default function SimpleDataTable<T>(props: SimpleDataTableProps<T>) {
  return <DataTable {...props} />
}
