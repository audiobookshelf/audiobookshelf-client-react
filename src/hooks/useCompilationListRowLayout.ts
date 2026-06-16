'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useEffect, useMemo, useState } from 'react'

export function useCompilationListRowLayout() {
  const { sizeMultiplier } = useCardSize()
  const bookCoverAspectRatio = useBookCoverAspectRatio()

  const [isMdUp, setIsMdUp] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsMdUp(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const coverWidth = useMemo(() => {
    const baseCoverSize = isMdUp ? 50 : 30
    const coverSize = baseCoverSize * sizeMultiplier
    return bookCoverAspectRatio === 1 ? coverSize * 1.6 : coverSize
  }, [bookCoverAspectRatio, isMdUp, sizeMultiplier])

  return { isMdUp, coverWidth, sizeMultiplier }
}
