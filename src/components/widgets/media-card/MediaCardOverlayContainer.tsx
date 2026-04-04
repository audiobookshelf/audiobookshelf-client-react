import { mergeClasses } from '@/lib/merge-classes'
import { memo, type ReactNode } from 'react'

interface MediaCardOverlayContainerProps {
  /** Content to render inside the overlay */
  children: ReactNode
  /** Whether selection mode is active */
  isSelectionMode?: boolean
  /** Whether the card is selected */
  selected?: boolean
  /** Additional class names */
  className?: string
  /** Cypress ID */
  cyId?: string
}

function MediaCardOverlayContainer({ children, isSelectionMode = false, selected = false, className, cyId = 'overlay' }: MediaCardOverlayContainerProps) {
  return (
    <div
      cy-id={cyId}
      className={mergeClasses(
        'absolute start-0 top-0 z-10 h-full w-full rounded-sm bg-black',
        isSelectionMode ? 'bg-black/60' : 'bg-black/40',
        selected && 'border-2 border-yellow-400',
        className
      )}
    >
      {children}
    </div>
  )
}

export default memo(MediaCardOverlayContainer)
