'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback, useEffect, useRef, useState } from 'react'

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
      setIsClamped(element.scrollHeight > element.clientHeight)
    }
  }, [])

  // Check clamping
  useEffect(() => {
    setIsExpanded(false)

    requestAnimationFrame(() => {
      checkClamping()
    })
  }, [description, checkClamping])

  // Re-check clamping on window resize or when collapsing
  useEffect(() => {
    if (!isExpanded) {
      // handles case where window was resized while expanded and no longer needs to be clamped
      requestAnimationFrame(() => {
        checkClamping()
      })
    }

    const handleResize = () => {
      if (!isExpanded) {
        // handles case where window was resized while collapsed and now needs to be clamped
        checkClamping()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isExpanded, checkClamping])

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
