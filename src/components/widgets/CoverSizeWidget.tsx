'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { AVAILABLE_COVER_SIZES, NUM_AVAILABLE_COVER_SIZES, coverSizeToIndex } from '@/lib/coverSizes'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useMemo } from 'react'

function coverSizeAtOffset(sizeIndex: number, offset: number): number {
  const index = Math.max(0, Math.min(NUM_AVAILABLE_COVER_SIZES - 1, sizeIndex + offset))
  return AVAILABLE_COVER_SIZES[index]
}

interface CoverSizeWidgetProps {
  className?: string
}

export default function CoverSizeWidget({ className }: CoverSizeWidgetProps) {
  const t = useTypeSafeTranslations()
  const { coverWidth: savedCoverWidth, setCoverSize } = useCardSize()

  const sizeIndex = coverSizeToIndex(savedCoverWidth)
  const coverWidth = AVAILABLE_COVER_SIZES[sizeIndex]

  const increaseSize = useCallback(() => {
    setCoverSize(coverSizeAtOffset(sizeIndex, 1))
  }, [setCoverSize, sizeIndex])

  const decreaseSize = useCallback(() => {
    setCoverSize(coverSizeAtOffset(sizeIndex, -1))
  }, [setCoverSize, sizeIndex])

  const isAtMinSize = sizeIndex === 0
  const isAtMaxSize = sizeIndex === NUM_AVAILABLE_COVER_SIZES - 1

  const buttonClass = useMemo(() => 'text-base h-6 w-4 disabled:bg-transparent disabled:cursor-default', [])
  const pillClass = useMemo(
    () => mergeClasses('flex w-fit shrink-0 items-center rounded-full border border-border bg-primary px-2 py-1 text-center shadow-modal-content select-none'),
    []
  )
  const textClass = useMemo(() => 'w-10 px-2 text-center font-mono text-base', [])

  return (
    <div className={mergeClasses('max-sm:hidden', className)}>
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
