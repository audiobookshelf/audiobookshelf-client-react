'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useMemo } from 'react'

/** Available cover sizes in pixels */
export const AVAILABLE_COVER_SIZES = [60, 80, 100, 120, 140, 160, 180, 200, 220]
export const NUM_AVAILABLE_COVER_SIZES = 9
const DEFAULT_SIZE_INDEX = 3
export const NUM_AVAILABLE_MOBILE_COVER_SIZES = 3
const DEFAULT_MOBILE_SIZE_INDEX = 2
const BASE_COVER_SIZE = 120

function coverSizeToIndex(width: number, numAvailable: number, fallbackIndex: number): number {
  const index = AVAILABLE_COVER_SIZES.indexOf(width)
  return index === -1 || index >= numAvailable ? fallbackIndex : index
}

function coverSizeAtOffset(sizeIndex: number, offset: number, numAvailable: number): number {
  const index = Math.max(0, Math.min(numAvailable - 1, sizeIndex + offset))
  return AVAILABLE_COVER_SIZES[index]
}

interface CoverSizeWidgetProps {
  className?: string
}

export default function CoverSizeWidget({ className }: CoverSizeWidgetProps) {
  const t = useTypeSafeTranslations()
  const { isMobile, setSizeMultiplier } = useCardSize()
  const { bookshelfCoverSize, bookshelfCoverSizeMobile, updateSetting, isSettingsLoaded } = useLibrary()
  const numAvailableCoverSizes = isMobile ? NUM_AVAILABLE_MOBILE_COVER_SIZES : NUM_AVAILABLE_COVER_SIZES

  const settingKey = isMobile ? 'bookshelfCoverSizeMobile' : 'bookshelfCoverSize'
  const savedSize = isMobile ? bookshelfCoverSizeMobile : bookshelfCoverSize
  const sizeIndex = coverSizeToIndex(savedSize, numAvailableCoverSizes, isMobile ? DEFAULT_MOBILE_SIZE_INDEX : DEFAULT_SIZE_INDEX)
  const coverWidth = AVAILABLE_COVER_SIZES[sizeIndex]

  useEffect(() => {
    const multiplier = coverWidth / BASE_COVER_SIZE
    setSizeMultiplier(multiplier)
  }, [coverWidth, setSizeMultiplier])

  const setBookshelfCoverSize = useCallback(
    (size: number) => {
      updateSetting(settingKey, size)
    },
    [updateSetting, settingKey]
  )

  const increaseSize = useCallback(() => {
    setBookshelfCoverSize(coverSizeAtOffset(sizeIndex, 1, numAvailableCoverSizes))
  }, [numAvailableCoverSizes, sizeIndex, setBookshelfCoverSize])

  const decreaseSize = useCallback(() => {
    setBookshelfCoverSize(coverSizeAtOffset(sizeIndex, -1, numAvailableCoverSizes))
  }, [numAvailableCoverSizes, sizeIndex, setBookshelfCoverSize])

  const isAtMinSize = sizeIndex === 0
  const isAtMaxSize = sizeIndex === numAvailableCoverSizes - 1

  const buttonClass = useMemo(() => 'text-base h-6 w-4 disabled:bg-transparent disabled:cursor-default', [])
  const pillClass = useMemo(
    () => mergeClasses('flex w-fit shrink-0 items-center rounded-full border border-border bg-primary px-2 py-1 text-center shadow-modal-content select-none'),
    []
  )
  const textClass = useMemo(() => 'w-10 px-2 text-center font-mono text-base', [])

  if (!isSettingsLoaded) return null

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
