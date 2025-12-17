'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useMemo, useState } from 'react'

/** Available cover sizes in pixels */
export const AVAILABLE_COVER_SIZES = [60, 80, 100, 120, 140, 160, 180, 200, 220]
export const NUM_AVAILABLE_COVER_SIZES = 9
const DEFAULT_SIZE_INDEX = 3
export const NUM_AVAILABLE_MOBILE_COVER_SIZES = 3
const DEFAULT_MOBILE_SIZE_INDEX = 2
const BASE_COVER_SIZE = 120

interface CoverSizeWidgetProps {
  className?: string
}

export default function CoverSizeWidget({ className }: CoverSizeWidgetProps) {
  const t = useTypeSafeTranslations()
  const { isMobile, setSizeMultiplier } = useCardSize()
  const [sizeIndex, setSizeIndex] = useState(isMobile ? DEFAULT_MOBILE_SIZE_INDEX : DEFAULT_SIZE_INDEX)
  const numAvailableCoverSizes = isMobile ? NUM_AVAILABLE_MOBILE_COVER_SIZES : NUM_AVAILABLE_COVER_SIZES
  const [coverWidth, setCoverWidth] = useState(AVAILABLE_COVER_SIZES[sizeIndex])

  // Update context sizeMultiplier when size index changes
  useEffect(() => {
    console.log('isMobile', isMobile)
    setSizeIndex(isMobile ? DEFAULT_MOBILE_SIZE_INDEX : DEFAULT_SIZE_INDEX)
  }, [isMobile])

  useEffect(() => {
    console.log('sizeIndex', sizeIndex)
    setCoverWidth(AVAILABLE_COVER_SIZES[sizeIndex])
  }, [sizeIndex])

  useEffect(() => {
    console.log('coverWidth', coverWidth)
    const multiplier = coverWidth / BASE_COVER_SIZE
    console.log('multiplier', multiplier)
    setSizeMultiplier(multiplier)
  }, [coverWidth, setSizeMultiplier])

  const increaseSize = useCallback(() => {
    setSizeIndex((prev) => Math.min(numAvailableCoverSizes - 1, prev + 1))
  }, [numAvailableCoverSizes])

  const decreaseSize = useCallback(() => {
    setSizeIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const isAtMinSize = sizeIndex === 0
  const isAtMaxSize = sizeIndex === numAvailableCoverSizes - 1

  const buttonClass = useMemo(() => 'text-base h-6 w-4 disabled:bg-transparent disabled:cursor-default', [])
  const containerClass = useMemo(
    () => mergeClasses('rounded-full py-1 bg-primary px-2 border border-border text-center flex items-center shadow-modal-content select-none', className),
    [className]
  )
  const textClass = useMemo(() => 'px-2 font-mono text-center w-10 text-base', [])

  return (
    <div>
      <div aria-label={t('LabelCoverSize')} role="group" className={containerClass}>
        <IconBtn className={buttonClass} disabled={isAtMinSize} onClick={decreaseSize} ariaLabel={t('LabelDecreaseCoverSize')} borderless>
          remove
        </IconBtn>
        <p className={textClass} aria-live="polite">
          {coverWidth}
        </p>
        <IconBtn className={buttonClass} disabled={isAtMaxSize} onClick={increaseSize} ariaLabel={t('LabelIncreaseCoverSize')} borderless>
          add
        </IconBtn>
      </div>
    </div>
  )
}
