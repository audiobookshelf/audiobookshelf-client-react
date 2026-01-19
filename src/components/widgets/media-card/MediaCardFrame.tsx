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
      onKeyDown={onKeyDown}
      className={mergeClasses(
        'relative rounded-xs z-10',
        'focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-[0.5em]',
        'focus:outline-1 focus:outline-foreground-muted focus:outline-offset-[0.5em]',
        className
      )}
      style={{
        minWidth: typeof width === 'number' ? `${width}px` : width,
        maxWidth: typeof width === 'number' ? `${width}px` : width
      }}
    >
      <div
        className="relative w-full top-0 start-0 rounded-sm overflow-hidden z-10 bg-primary box-shadow-book cursor-pointer"
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined
        }}
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
