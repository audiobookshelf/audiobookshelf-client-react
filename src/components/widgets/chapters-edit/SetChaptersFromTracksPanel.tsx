'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import ChaptersToolbarPanel from './ChaptersToolbarPanel'

interface SetChaptersFromTracksPanelProps {
  currentChapterCount: number
  trackChapterCount: number
  onClose: () => void
}

export default function SetChaptersFromTracksPanel({ currentChapterCount, trackChapterCount, onClose }: SetChaptersFromTracksPanelProps) {
  const t = useTypeSafeTranslations()

  return (
    <ChaptersToolbarPanel onClose={onClose}>
      <div className="flex h-full flex-col justify-between gap-2">
        <p className="text-sm font-semibold">{t('MessageReplaceChaptersFromTracks', { 0: currentChapterCount, 1: trackChapterCount })}</p>
        <p className="text-foreground-muted max-w-md text-xs">{t('MessageSetChaptersFromTracksDescription')}</p>
      </div>
    </ChaptersToolbarPanel>
  )
}
