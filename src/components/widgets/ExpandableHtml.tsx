'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface ExpandableHtmlProps {
  html: string
  lineClamp?: number
  className?: string
}

function ExpandableHtml({ html, lineClamp = 4, className = '' }: ExpandableHtmlProps) {
  const t = useTypeSafeTranslations()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  const checkClamping = useCallback(() => {
    const element = contentRef.current
    if (!element) return

    const setIsClampedIfOverflowing = () => {
      const isOverflowing = element.scrollHeight > element.clientHeight + 1
      setIsClamped(isOverflowing)
    }

    if (!isExpanded) {
      // If it's already clamped by React, just measure it!
      setIsClampedIfOverflowing()
    } else {
      // If it's expanded, we have to "fake" the clamp to see if it SHOULD be clampable
      const { webkitLineClamp, overflow, display } = element.style

      element.style.webkitLineClamp = lineClamp.toString()
      element.style.overflow = 'hidden'
      element.style.display = '-webkit-box'

      setIsClampedIfOverflowing()

      // Restore
      element.style.webkitLineClamp = webkitLineClamp
      element.style.overflow = overflow
      element.style.display = display
    }
  }, [lineClamp, isExpanded])

  // Handle content changes
  useLayoutEffect(() => {
    checkClamping()
  }, [html, checkClamping])

  // Handle resize changes (e.g., window width narrowing)
  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      checkClamping()
    })

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [checkClamping])

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="default-style less-spacing max-w-none transition-all duration-300 overflow-hidden cursor-pointer"
        dir="auto"
        style={{
          display: isExpanded ? 'block' : '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: isExpanded ? 'unset' : lineClamp,
          overflow: isExpanded ? 'visible' : 'hidden'
        }}
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {isClamped && (
        <button
          type="button"
          className="ps-1 mt-2 text-foreground-muted font-semibold hover:text-foreground flex items-center gap-1 text-[0.875em] select-none focus-visible:outline-1 focus-visible:outline-foreground focus-visible:outline-offset-1 rounded"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? t('ButtonReadLess') : t('ButtonReadMore')}
          <span className={`material-symbols text-[1.125em] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
      )}
    </div>
  )
}

export default React.memo(ExpandableHtml)
