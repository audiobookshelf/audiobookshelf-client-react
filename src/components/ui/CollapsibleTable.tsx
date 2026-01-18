import AccordionSection from '@/components/ui/AccordionSection'
import { mergeClasses } from '@/lib/merge-classes'
import { ReactNode } from 'react'

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
  className?: string
  containerRef?: React.RefObject<HTMLDivElement | null>
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
  className,
  containerRef,
  children
}: CollapsibleTableProps) {
  const tableClasses = mergeClasses('text-sm w-full border-collapse border border-border', tableClassName)

  return (
    <AccordionSection
      title={title}
      count={count}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      keepOpen={keepOpen}
      headerActions={headerActions}
      className={mergeClasses(!keepOpen && 'my-2', className)}
    >
      <div ref={containerRef}>
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
    </AccordionSection>
  )
}
