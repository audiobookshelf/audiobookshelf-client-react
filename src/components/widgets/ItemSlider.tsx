'use client'

import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface ItemSliderProps {
  title: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function ItemSlider({ title, children, className = '' }: ItemSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const slider = sliderRef.current
    if (!slider) return

    const { scrollLeft, scrollWidth, clientWidth } = slider
    // Use a small threshold (1px) for float inaccuracies
    const scrollRemaining = Math.abs(scrollLeft + clientWidth - scrollWidth)

    setIsScrollable(scrollWidth > clientWidth)
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollRemaining >= 1)
  }, [])

  useEffect(() => {
    checkScroll()
    const slider = sliderRef.current
    if (!slider) return

    const resizeObserver = new ResizeObserver(() => checkScroll())
    resizeObserver.observe(slider)

    return () => resizeObserver.disconnect()
  }, [checkScroll, children]) // Re-check when children change

  const scrollLeft = () => {
    const slider = sliderRef.current
    if (!slider) return
    const scrollAmount = slider.clientWidth
    slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  }

  const scrollRight = () => {
    const slider = sliderRef.current
    if (!slider) return
    const scrollAmount = slider.clientWidth
    slider.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  return (
    <div className={mergeClasses('w-full', className)}>
      <div className="flex items-center p-2e">
        <div className="font-bold flex-grow text-foreground">{title}</div>

        {isScrollable && (
          <div className="flex gap-1e items-center">
            <IconBtn
              className={mergeClasses('rounded-full w-8e h-8e', canScrollLeft ? 'text-foreground hover:bg-white/10' : 'text-foreground/30 cursor-default')}
              borderless
              size="custom"
              disabled={!canScrollLeft}
              onClick={scrollLeft}
              ariaLabel="Scroll Left"
            >
              chevron_left
            </IconBtn>
            <IconBtn
              className={mergeClasses('rounded-full w-8e h-8e', canScrollRight ? 'text-foreground hover:bg-white/10' : 'text-foreground/30 cursor-default')}
              borderless
              size="custom"
              disabled={!canScrollRight}
              onClick={scrollRight}
              ariaLabel="Scroll Right"
            >
              chevron_right
            </IconBtn>
          </div>
        )}
      </div>

      <div ref={sliderRef} className="w-full overflow-y-hidden overflow-x-auto no-scroll scroll-smooth flex gap-4e p-4e" onScroll={checkScroll}>
        {children}
      </div>
    </div>
  )
}
