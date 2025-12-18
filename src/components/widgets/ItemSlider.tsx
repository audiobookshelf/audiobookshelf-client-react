'use client'

import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface ItemSliderProps {
  title: React.ReactNode
  children: React.ReactNode
  className?: string
}

interface SliderNavBtnProps {
  direction: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}

const SliderNavBtn = ({ direction, disabled, onClick }: SliderNavBtnProps) => {
  const isLeft = direction === 'left'
  return (
    <IconBtn
      className={mergeClasses(
        'rounded-full w-8e h-8e disabled:bg-transparent',
        !disabled ? 'text-foreground hover:bg-white/10' : 'text-foreground/30 cursor-default'
      )}
      borderless
      size="custom"
      disabled={disabled}
      onClick={onClick}
      ariaLabel={isLeft ? 'Scroll Left' : 'Scroll Right'}
    >
      <span style={{ fontSize: '1.5em' }}>{isLeft ? 'chevron_left' : 'chevron_right'}</span>
    </IconBtn>
  )
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
    <div className={mergeClasses('w-full ps-6e mt-6e', className)}>
      <div className="flex items-center py-1e px-4e">
        <div className="font-bold flex-grow text-foreground">{title}</div>

        {isScrollable && (
          <div className="flex gap-1e items-center">
            <SliderNavBtn direction="left" disabled={!canScrollLeft} onClick={scrollLeft} />
            <SliderNavBtn direction="right" disabled={!canScrollRight} onClick={scrollRight} />
          </div>
        )}
      </div>

      <div ref={sliderRef} className="w-full overflow-y-hidden overflow-x-auto no-scroll scroll-smooth flex px-2e py-3e" onScroll={checkScroll}>
        {children}
      </div>
    </div>
  )
}
