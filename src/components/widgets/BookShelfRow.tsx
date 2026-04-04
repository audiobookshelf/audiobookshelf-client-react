'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useRef, useState } from 'react'

interface BookShelfRowProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function BookShelfRow({ title, children, className }: BookShelfRowProps) {
  const t = useTypeSafeTranslations()
  const shelfRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null)

  const checkCanScroll = useCallback(() => {
    if (!shelfRef.current) return
    const { clientWidth, scrollWidth, scrollLeft } = shelfRef.current
    if (scrollWidth > clientWidth) {
      setCanScrollRight(Math.ceil(scrollLeft) + clientWidth < scrollWidth)
      setCanScrollLeft(scrollLeft > 0)
    } else {
      setCanScrollRight(false)
      setCanScrollLeft(false)
    }
  }, [])

  useEffect(() => {
    checkCanScroll()
    window.addEventListener('resize', checkCanScroll)
    return () => window.removeEventListener('resize', checkCanScroll)
  }, [checkCanScroll, children]) // Re-check when children change

  const handleScroll = () => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(false)
      checkCanScroll()
    }, 50)
  }

  const scrollLeft = () => {
    if (!shelfRef.current) return
    setIsScrolling(true)
    shelfRef.current.scrollBy({ left: -window.innerWidth, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!shelfRef.current) return
    setIsScrolling(true)
    shelfRef.current.scrollBy({ left: window.innerWidth, behavior: 'smooth' })
  }

  return (
    <div className={mergeClasses('relative w-full', className)}>
      <div
        ref={shelfRef}
        className="bookshelf-row categorizedBookshelfRow no-scroll pl-4e md:pl-8e relative w-full max-w-full overflow-x-auto overflow-y-hidden"
        onScroll={handleScroll}
      >
        <div className="pt-6e pr-4e flex h-full w-full items-center">{children}</div>
      </div>

      <div className="relative">
        <div className="categoryPlacard left-4e md:left-8e w-44e relative top-0 z-30 transform rounded-md text-center">
          <div className="shinyBlack px-2e flex h-full w-full items-center justify-center rounded-xs border">
            <h2 style={{ fontSize: '0.9em' }}>{title}</h2>
          </div>
        </div>

        <div className="bookshelfDividerCategorized h-6e absolute top-0 right-0 left-0 z-5 w-full"></div>
      </div>

      {canScrollLeft && !isScrolling && (
        <button
          className="book-shelf-arrow-left absolute top-0 left-0 z-40 hidden w-32 cursor-pointer items-center justify-center bg-black pr-8 opacity-0 transition-opacity hover:opacity-100 sm:flex"
          onClick={scrollLeft}
          aria-label={t('ButtonScrollLeft')}
        >
          <span className="material-symbols text-white" style={{ fontSize: '3.75em' }}>
            chevron_left
          </span>
        </button>
      )}

      {canScrollRight && !isScrolling && (
        <button
          className="book-shelf-arrow-right absolute top-0 right-0 z-40 hidden w-32 cursor-pointer items-center justify-center bg-black pl-8 opacity-0 transition-opacity hover:opacity-100 sm:flex"
          onClick={scrollRight}
          aria-label={t('ButtonScrollRight')}
        >
          <span className="material-symbols text-white" style={{ fontSize: '3.75em' }}>
            chevron_right
          </span>
        </button>
      )}
    </div>
  )
}
