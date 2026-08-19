'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { findScrollContainer } from '@/lib/scrollContainer'
import { useEffect, useRef } from 'react'

interface RecentEpisodesLoadMoreProps {
  isLoading: boolean
  autoLoadEnabled?: boolean
  onLoadMore: (options?: { manual?: boolean }) => void | Promise<unknown>
}

export default function RecentEpisodesLoadMore({ isLoading, autoLoadEnabled = true, onLoadMore }: RecentEpisodesLoadMoreProps) {
  const t = useTypeSafeTranslations()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading || !autoLoadEnabled) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void onLoadMore()
      },
      {
        root: findScrollContainer(sentinel),
        rootMargin: '600px 0px'
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [autoLoadEnabled, isLoading, onLoadMore])

  return (
    <div className="flex flex-col items-center pt-6">
      <div ref={sentinelRef} cy-id="recent-episodes-load-sentinel" className="h-px w-full" aria-hidden="true" />
      <Btn size="small" loading={isLoading} disabled={isLoading} onClick={() => void onLoadMore({ manual: true })}>
        {t('LabelMore')}
      </Btn>
    </div>
  )
}
