'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface CoverSizeWidgetProps {
  sizeIndex?: number
  onSizeIndexChange?: (size: number) => void
  className?: string
}

export const availableCoverSizes = [60, 80, 100, 120, 140, 160, 180, 200, 220]

export default function CoverSizeWidget({ sizeIndex: sizeIndexProp = 3, onSizeIndexChange, className }: CoverSizeWidgetProps) {
  const t = useTypeSafeTranslations()
  const sizeIndex = useMemo(() => {
    if (sizeIndexProp === undefined) return 3
    if (sizeIndexProp >= 0 && sizeIndexProp < availableCoverSizes.length) return sizeIndexProp
    return 3
  }, [sizeIndexProp])

  const [selectedSizeIndex, setSelectedSizeIndex] = useState(sizeIndex)

  const bookCoverWidth = useMemo(() => availableCoverSizes[selectedSizeIndex], [selectedSizeIndex])

  // Update index when initialSize prop changes
  useEffect(() => {
    setSelectedSizeIndex(sizeIndex)
  }, [sizeIndex])

  // Call onSizeChange when size changes
  useEffect(() => {
    onSizeIndexChange?.(selectedSizeIndex)
  }, [selectedSizeIndex, onSizeIndexChange])

  const increaseSize = useCallback(() => {
    setSelectedSizeIndex((prevIndex) => {
      const newIndex = Math.min(availableCoverSizes.length - 1, prevIndex + 1)
      return newIndex
    })
  }, [])

  const decreaseSize = useCallback(() => {
    setSelectedSizeIndex((prevIndex) => {
      const newIndex = Math.max(0, prevIndex - 1)
      return newIndex
    })
  }, [])

  const isAtMinSize = selectedSizeIndex === 0
  const isAtMaxSize = selectedSizeIndex === availableCoverSizes.length - 1

  const buttonClass = useMemo(() => 'text-base h-6 w-4 disabled:bg-transparent disabled:cursor-default', [])
  const containerClass = useMemo(
    () => mergeClasses('rounded-full py-1 bg-primary px-2 border border-black-200 text-center flex items-center box-shadow-md select-none', className),
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
          {bookCoverWidth}
        </p>
        <IconBtn className={buttonClass} disabled={isAtMaxSize} onClick={increaseSize} ariaLabel={t('LabelIncreaseCoverSize')} borderless>
          add
        </IconBtn>
      </div>
    </div>
  )
}
