import { mergeClasses } from '@/lib/merge-classes'
import { type ReactNode } from 'react'

interface MediaCardFrameProps {
  width: number | string
  height: number | string
  onClick?: (event: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
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
  onClick,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
  cardId,
  cover,
  overlay,
  footer,
  aspectRatio,
  className,
  'cy-id': cyId = 'mediaCard'
}: MediaCardFrameProps) {
  return (
    <div
      cy-id={cyId}
      id={cardId}
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
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
