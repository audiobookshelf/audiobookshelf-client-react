'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useLayoutEffect, useRef, useState } from 'react'

interface ExpandableTextProps {
  html: string
  className?: string
  maxLines?: number
}

export default function ExpandableText({ html, className = '', maxLines = 4 }: ExpandableTextProps) {
  const t = useTypeSafeTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  // Heuristic: If text is long > 300 chars, assume it overflows initially to avoid pop-in.
  // This might cause a pop-out (button disappears) but that is less jarring than pop-in.
  const [isOverflowing, setIsOverflowing] = useState(() => html.length > 300)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!contentRef.current) return

    const element = contentRef.current

    // Function to check overflow
    const checkOverflow = () => {
      // If element is hidden (display: none), measurement will be 0. Avoid resetting state.
      if (element.clientHeight === 0) return

      // We use a threshold of 1px to avoid precision issues
      const isOverflowingNow = element.scrollHeight - element.clientHeight > 1
      setIsOverflowing(isOverflowingNow)
    }

    // Initial check
    checkOverflow()

    // Add resize observer to handle window resize or content changes
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [html])

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={`default-style less-spacing max-w-none transition-all duration-300 overflow-hidden ${isExpanded ? '' : 'line-clamp-4'}`}
        dir="auto"
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          // Only apply line clamp when not expanded
          WebkitLineClamp: isExpanded ? 'unset' : maxLines
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {(isOverflowing || isExpanded) && (
        <button
          type="button"
          className="mt-2 text-foreground-muted font-semibold hover:text-foreground flex items-center gap-1 text-sm select-none focus:outline"
          onClick={(e) => {
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
            setIsExpanded((prev) => !prev)
          }}
        >
          {isExpanded ? t('ButtonReadLess') : t('ButtonReadMore')}
          <span className={`material-symbols text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
      )}
    </div>
  )
}
