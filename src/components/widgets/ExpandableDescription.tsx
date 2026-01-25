'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface ExpandableDescriptionProps {
  description: string
  lineClamp?: number
  className?: string
}

export default function ExpandableDescription({ description, lineClamp = 4, className = '' }: ExpandableDescriptionProps) {
  const t = useTypeSafeTranslations()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  const checkClamping = useCallback(() => {
    if (contentRef.current) {
      const element = contentRef.current
      // Compare scrollHeight (full content height) with clientHeight (visible height)
      // We use a small tolerance (e.g., 1px) to avoid false positives due to sub-pixel rendering
      const isOverflowing = element.scrollHeight > element.clientHeight + 1
      setIsClamped(isOverflowing)
    }
  }, [])

  // Reset expanded state when description changes
  useLayoutEffect(() => {
    setIsExpanded(false)
  }, [description])

  // Use useLayoutEffect to check clamping immediately after DOM updates but before paint
  useLayoutEffect(() => {
    // Initial check
    if (!isExpanded) {
      checkClamping()
    }

    // Use ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(() => {
      if (!isExpanded) {
        checkClamping()
      }
    })

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [description, checkClamping, isExpanded])

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  const showButton = isClamped || isExpanded

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="text-base text-foreground transition-all duration-200"
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: isExpanded ? 'unset' : lineClamp,
          overflow: isExpanded ? 'visible' : 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: description }}
      />
      {showButton && (
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex items-center gap-1 mt-2 text-foreground-subdued hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <span className="text-sm">{isExpanded ? t('ButtonReadLess') : t('ButtonReadMore')}</span>
          <span className="material-symbols text-lg transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </button>
      )}
    </div>
  )
}
