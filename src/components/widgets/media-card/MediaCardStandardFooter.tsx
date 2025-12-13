import { mergeClasses } from '@/lib/merge-classes'
import { memo } from 'react'

interface MediaCardStandardFooterProps {
  /** Text to display */
  displayTitle: string
  /**
   * Font size in 'em'.
   * Defaults to 0.9.
   */
  fontSize?: number
  /**
   * Optional width constraint.
   * Can be a number (px) or string (e.g. '12em').
   * If not provided, it will use the default CSS class width or handle it via parent.
   */
  width?: number | string
  /**
   * Additional class names for the container
   */
  className?: string
}

function MediaCardStandardFooter({ displayTitle, fontSize = 0.9, width, className }: MediaCardStandardFooterProps) {
  const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

  return (
    <div
      cy-id="standardBottomText"
      className={mergeClasses('categoryPlacard absolute z-10 start-0 end-0 mx-auto -bottom-[1.5em] h-[1.5em] rounded-md text-center', className)}
      style={style}
    >
      <div className="w-full h-full shinyBlack flex items-center justify-center rounded-xs border" style={{ padding: '0em 0.5em' }}>
        <p cy-id="standardBottomDisplayTitle" className="truncate" style={{ fontSize: `${fontSize}em` }}>
          {displayTitle}
        </p>
      </div>
    </div>
  )
}

export default memo(MediaCardStandardFooter)
