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

  useEffect(() => {
    setSizeIndex(isMobile ? DEFAULT_MOBILE_SIZE_INDEX : DEFAULT_SIZE_INDEX)
  }, [isMobile])

  useEffect(() => {
    setCoverWidth(AVAILABLE_COVER_SIZES[sizeIndex])
  }, [sizeIndex])

  useEffect(() => {
    const multiplier = coverWidth / BASE_COVER_SIZE
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
  const pillClass = useMemo(
    () => mergeClasses('flex w-fit shrink-0 items-center rounded-full border border-border bg-primary px-2 py-1 text-center shadow-modal-content select-none'),
    []
  )
  const textClass = useMemo(() => 'w-10 px-2 text-center font-mono text-base', [])

  return (
    <div className={className}>
      <div aria-label={t('LabelCoverSize')} role="group" className={pillClass}>
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
