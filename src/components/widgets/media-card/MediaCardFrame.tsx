import { mergeClasses } from '@/lib/merge-classes'
import { type ReactNode } from 'react'

interface MediaCardFrameProps {
  width: number
  height: number
  onClick?: (event: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  cardId?: string
  cover: ReactNode
  overlay: ReactNode
  footer?: ReactNode
  'cy-id'?: string
}

export default function MediaCardFrame({
  width,
  height,
  onClick,
  onMouseEnter,
  onMouseLeave,
  cardId,
  cover,
  overlay,
  footer,
  'cy-id': cyId = 'mediaCard'
}: MediaCardFrameProps) {
  return (
    <div
      cy-id={cyId}
      id={cardId}
      tabIndex={0}
      className={mergeClasses('relative rounded-xs z-10', 'focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-8')}
      style={{ minWidth: `${width}px`, maxWidth: `${width}px` }}
    >
      <div
        className="relative w-full top-0 start-0 rounded-sm overflow-hidden z-10 bg-primary box-shadow-book cursor-pointer"
        style={{ height: `${height}px` }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="absolute w-full h-full top-0 start-0 rounded-sm overflow-hidden z-10">
          {cover}
          {overlay}
        </div>
      </div>
      {footer}
    </div>
  )
}
