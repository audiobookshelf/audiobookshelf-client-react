import { mergeClasses } from '@/lib/merge-classes'
import { ReactNode } from 'react'

export interface TableHeader {
  label: ReactNode
  className?: string
  scope?: string
}

interface TableProps {
  headers: TableHeader[]
  children: ReactNode
  className?: string
  containerRef?: React.RefObject<HTMLDivElement | null>
  title?: string
}

export default function Table({ headers, children, className, containerRef, title }: TableProps) {
  const tableClasses = mergeClasses('text-sm w-full border-collapse border border-border', className)

  return (
    <div ref={containerRef}>
      <table className={tableClasses}>
        {title && <caption className="sr-only">{title}</caption>}
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={mergeClasses('text-start py-1 text-xs', header.className)} scope={header.scope ?? 'col'}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
