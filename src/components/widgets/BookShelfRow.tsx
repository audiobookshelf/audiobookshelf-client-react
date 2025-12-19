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
        className="w-full max-w-full bookshelf-row categorizedBookshelfRow relative overflow-x-auto no-scroll overflow-y-hidden pl-4e md:pl-8e"
        onScroll={handleScroll}
      >
        <div className="w-full h-full pt-6e flex items-center pr-4e">{children}</div>
      </div>

      <div className="relative">
        <div className="relative text-center categoryPlacard transform z-30 top-0 left-4e md:left-8e w-44e rounded-md">
          <div className="w-full h-full shinyBlack flex items-center justify-center rounded-xs border px-2e">
            <h2 style={{ fontSize: '0.9em' }}>{title}</h2>
          </div>
        </div>

        <div className="bookshelfDividerCategorized h-6e w-full absolute top-0 left-0 right-0 z-5"></div>
      </div>

      {canScrollLeft && !isScrolling && (
        <button
          className="hidden sm:flex absolute top-0 left-0 w-32 pr-8 bg-black book-shelf-arrow-left items-center justify-center cursor-pointer opacity-0 hover:opacity-100 z-40 transition-opacity"
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
          className="hidden sm:flex absolute top-0 right-0 w-32 pl-8 bg-black book-shelf-arrow-right items-center justify-center cursor-pointer opacity-0 hover:opacity-100 z-40 transition-opacity"
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
