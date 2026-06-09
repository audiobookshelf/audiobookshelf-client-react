import { mergeClasses } from '@/lib/merge-classes'
import { type HTMLAttributes, type MouseEvent as ReactMouseEvent, type ReactNode, type Ref } from 'react'

interface MediaCardFrameProps {
  width: number | string
  height: number | string
  /** e.g. dnd-kit `setActivatorNodeRef` for keyboard sort when focus is on the card frame */
  rootRef?: Ref<HTMLDivElement | null>
  /** Props merged onto the root (e.g. dnd-kit `attributes`). `onKeyDown` / `tabIndex` are merged explicitly. */
  sortableFrameProps?: HTMLAttributes<HTMLDivElement>
  onClick?: (event: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  /** Fires on bubble (unlike mouseenter); use when descendants need to drive hover reliably. */
  onMouseOver?: (event: ReactMouseEvent) => void
  onKeyDown?: (event: React.KeyboardEvent) => void
  cardId?: string
  cover: ReactNode
  overlay: ReactNode
  footer?: ReactNode
  aspectRatio?: number
  className?: string
  'cy-id'?: string
}

export default function MediaCardFrame({
  width,
  height,
  rootRef,
  sortableFrameProps,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseOver,
  onKeyDown,
  cardId,
  cover,
  overlay,
  footer,
  aspectRatio,
  className,
  'cy-id': cyId = 'mediaCard'
}: MediaCardFrameProps) {
  const { onKeyDown: sortableOnKeyDown, tabIndex: sortableTabIndex, ...sortableRest } = sortableFrameProps ?? {}

  return (
    <div
      ref={rootRef}
      cy-id={cyId}
      id={cardId}
      {...sortableRest}
      tabIndex={sortableTabIndex ?? 0}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseOver={onMouseOver}
      onKeyDown={(event) => {
        sortableOnKeyDown?.(event)
        onKeyDown?.(event)
      }}
      className={mergeClasses(
        'relative z-30 rounded-xs',
        onClick && 'cursor-pointer',
        'focus-visible:outline-foreground-muted focus-visible:outline-1 focus-visible:outline-offset-[0.5em]',
        className
      )}
      style={{
        minWidth: typeof width === 'number' ? `${width}px` : width,
        maxWidth: typeof width === 'number' ? `${width}px` : width
      }}
    >
      <div
        className="bg-primary box-shadow-book relative start-0 top-0 z-10 w-full overflow-hidden rounded-sm"
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined
        }}
      >
        <div className="absolute start-0 top-0 z-10 h-full w-full overflow-hidden rounded-sm">
          {cover}
          {overlay}
        </div>
      </div>
      {footer}
    </div>
  )
}
