'use client'

import { useItemPageEditMode } from '@/contexts/ItemPageEditModeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface ExpandableTextProps {
  html: string
  className?: string
  maxLines?: number
}

function ExpandableText({ html, className = '', maxLines = 4 }: ExpandableTextProps) {
  const { isPageEditMode: pageEditMode } = useItemPageEditMode()
  const t = useTypeSafeTranslations()
  const measurementRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(() => html.length > 300)

  const checkClamping = useCallback(() => {
    if (measurementRef.current) {
      const element = measurementRef.current
      // Compare scrollHeight (full content height) with clientHeight (visible height)
      // We use a small tolerance (e.g., 1px) to avoid false positives due to sub-pixel rendering
      const isOverflowing = element.scrollHeight > element.clientHeight + 1
      setIsClamped(isOverflowing)
    }
  }, [])

  useLayoutEffect(() => {
    setIsExpanded(false)
    checkClamping()
  }, [html, checkClamping])

  useLayoutEffect(() => {
    // Use ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(() => {
      checkClamping()
    })

    if (measurementRef.current) {
      resizeObserver.observe(measurementRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [checkClamping])

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // In page view mode (!pageEditMode), clicking anywhere on the description should expand/collapse
    if (pageEditMode === false) {
      const target = e.target as HTMLElement
      // Don't toggle if clicking on a link or button
      if (target.closest('a') || target.closest('button')) {
        return
      }
      toggleExpanded()
    }
  }

  const showButton = isClamped

  return (
    <div className={mergeClasses('relative', className)}>
      {/* Hidden wrapper to contain measurement div in flow but zero height */}
      <div className="h-0 overflow-hidden invisible" aria-hidden="true">
        <div
          ref={measurementRef}
          className="default-style less-spacing max-w-none overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: maxLines,
            overflow: 'hidden'
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <div
        className={mergeClasses(
          'default-style less-spacing max-w-none transition-all duration-300 overflow-hidden',
          pageEditMode === false ? 'cursor-pointer' : ''
        )}
        dir="auto"
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          // Only apply line clamp when not expanded
          WebkitLineClamp: isExpanded ? 'unset' : maxLines,
          overflow: isExpanded ? 'visible' : 'hidden'
        }}
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {showButton && (
        <button
          type="button"
          className="ps-1 mt-2 text-foreground-muted font-semibold hover:text-foreground flex items-center gap-1 text-sm select-none focus-visible:outline-1 focus-visible:outline-foreground focus-visible:outline-offset-1 rounded"
          onClick={toggleExpanded}
        >
          {isExpanded ? t('ButtonReadLess') : t('ButtonReadMore')}
          <span className={`material-symbols text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
      )}
    </div>
  )
}

export default React.memo(ExpandableText)
