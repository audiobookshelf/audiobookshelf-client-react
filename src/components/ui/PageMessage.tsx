import { mergeClasses } from '@/lib/merge-classes'

interface PageMessageProps {
  message: string
  description?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Short centered status message at the top of a page (empty library, no results, not found).
 */
export default function PageMessage({ message, description, children, className }: PageMessageProps) {
  return (
    <div className={mergeClasses('flex flex-col items-center justify-center py-10', className)}>
      <p className="max-w-lg text-center text-xl">{message}</p>
      {description ? <p className="text-foreground-muted mt-2 max-w-lg text-center">{description}</p> : null}
      {children ? <div className="mt-4 flex items-center justify-center gap-2">{children}</div> : null}
    </div>
  )
}
