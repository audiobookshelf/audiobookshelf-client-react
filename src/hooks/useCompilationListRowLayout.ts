'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMemo } from 'react'
import { useMediaQuery } from './useMediaQuery'

export function useCompilationListRowLayout() {
  const { sizeMultiplier } = useCardSize()
  const bookCoverAspectRatio = useBookCoverAspectRatio()
  const isMdUp = useMediaQuery('md')

  const coverWidth = useMemo(() => {
    const baseCoverSize = isMdUp ? 50 : 30
    const coverSize = baseCoverSize * sizeMultiplier
    return bookCoverAspectRatio === 1 ? coverSize * 1.6 : coverSize
  }, [bookCoverAspectRatio, isMdUp, sizeMultiplier])

  return { isMdUp, coverWidth, sizeMultiplier }
}
