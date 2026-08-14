'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useEffect, useRef } from 'react'

interface RecentEpisodesLoadMoreProps {
  isLoading: boolean
  onLoadMore: () => void | Promise<unknown>
}

function findScrollContainer(element: Element): Element | null {
  let parent = element.parentElement
  while (parent) {
    const { overflow, overflowY } = window.getComputedStyle(parent)
    if (/auto|scroll/.test(`${overflow}${overflowY}`)) return parent
    parent = parent.parentElement
  }
  return null
}

export default function RecentEpisodesLoadMore({ isLoading, onLoadMore }: RecentEpisodesLoadMoreProps) {
  const t = useTypeSafeTranslations()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [onLoadMore])

  return (
    <div className="flex flex-col items-center pt-6">
      <div ref={sentinelRef} cy-id="recent-episodes-load-sentinel" className="h-px w-full" aria-hidden="true" />
      <Btn size="small" loading={isLoading} disabled={isLoading} onClick={() => void onLoadMore()}>
        {t('LabelMore')}
      </Btn>
    </div>
  )
}
