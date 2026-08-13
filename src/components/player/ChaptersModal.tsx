'use client'

import Modal from '@/components/modals/Modal'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback } from 'react'
import ChapterList from './ChapterList'

interface ChaptersModalProps {
  isOpen: boolean
  playerHandler: PlayerHandler
  onClose: () => void
}

export default function ChaptersModal({ isOpen, playerHandler, onClose }: ChaptersModalProps) {
  const t = useTypeSafeTranslations()

  const { chapters, currentChapter, settings } = playerHandler.state
  const { seek } = playerHandler.controls
  const playbackRate = settings.playbackRate && !Number.isNaN(settings.playbackRate) ? settings.playbackRate : 1

  const handleSeek = useCallback(
    (time: number) => {
      seek(time)
      onClose()
    },
    [onClose, seek]
  )

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('HeaderChapters')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="overflow-hidden sm:max-w-lg md:max-w-lg lg:max-w-lg">
      <div className="flex max-h-[80vh] flex-col">
        <ChapterList
          chapters={chapters}
          currentChapterId={currentChapter?.id ?? -1}
          playbackRate={playbackRate}
          onSeek={handleSeek}
          isVisible={isOpen}
          emptyMessage={t('MessageNoChapters')}
        />
      </div>
    </Modal>
  )
}
