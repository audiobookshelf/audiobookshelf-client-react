'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useMemo, useState } from 'react'

/** Available cover sizes in pixels */
export const availableCoverSizes = [60, 80, 100, 120, 140, 160, 180, 200, 220]
/** Base cover size for calculating size multiplier */
const BASE_COVER_SIZE = 120
/** Default size index */
const DEFAULT_SIZE_INDEX = 3

interface CoverSizeWidgetProps {
  className?: string
}

export default function CoverSizeWidget({ className }: CoverSizeWidgetProps) {
  const t = useTypeSafeTranslations()
  const { setSizeMultiplier } = useCardSize()

  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX)

  const coverWidth = useMemo(() => availableCoverSizes[sizeIndex], [sizeIndex])

  // Update context sizeMultiplier when size index changes
  useEffect(() => {
    const multiplier = coverWidth / BASE_COVER_SIZE
    setSizeMultiplier(multiplier)
  }, [coverWidth, setSizeMultiplier])

  const increaseSize = useCallback(() => {
    setSizeIndex((prev) => Math.min(availableCoverSizes.length - 1, prev + 1))
  }, [])

  const decreaseSize = useCallback(() => {
    setSizeIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const isAtMinSize = sizeIndex === 0
  const isAtMaxSize = sizeIndex === availableCoverSizes.length - 1

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
