'use client'

import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import { scrollHorizontallyClamped } from '@/lib/scrollContainer'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface ItemSliderProps {
  title: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Scroll edge to edge under the safe-area insets, with content inset at rest. Off when nested in padded page content. */
  bleed?: boolean
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
        'w-8e h-8e rounded-full disabled:bg-transparent',
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

export default function ItemSlider({ title, children, className = '', bleed = true }: ItemSliderProps) {
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
    scrollHorizontallyClamped(slider, -slider.clientWidth)
  }

  const scrollRight = () => {
    const slider = sliderRef.current
    if (!slider) return
    scrollHorizontallyClamped(slider, slider.clientWidth)
  }

  return (
    <div className={mergeClasses('mt-6e', bleed && 'bleed-mx', className)}>
      <div className={mergeClasses('py-1e flex items-center', bleed ? 'safe-ps-10e safe-pe-4e' : 'px-4e')}>
        <div className="text-foreground flex-grow font-bold">{title}</div>

        {isScrollable && (
          <div className="gap-1e flex items-center">
            <SliderNavBtn direction="left" disabled={!canScrollLeft} onClick={scrollLeft} />
            <SliderNavBtn direction="right" disabled={!canScrollRight} onClick={scrollRight} />
          </div>
        )}
      </div>

      <div
        ref={sliderRef}
        className={mergeClasses('no-scroll py-3e flex w-full overflow-x-auto overflow-y-hidden scroll-smooth', bleed ? 'safe-ps-8e safe-pe-2e' : 'px-2e')}
        onScroll={checkScroll}
      >
        {children}
      </div>
    </div>
  )
}
