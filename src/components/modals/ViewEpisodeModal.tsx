import PreviewCover from '@/components/covers/PreviewCover'
import Modal from '@/components/modals/Modal'
import { useMediaContext } from '@/contexts/MediaContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { formatDuration } from '@/lib/formatDuration'
import { bytesPretty } from '@/lib/string'
import { PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import React, { useCallback, useMemo } from 'react'

export interface ViewEpisodeModalProps {
  isOpen: boolean
  onClose: () => void
  episode: PodcastEpisode | null
  libraryItem: PodcastLibraryItem | null
}

export default function ViewEpisodeModal({ isOpen, onClose, episode, libraryItem }: ViewEpisodeModalProps) {
  const t = useTypeSafeTranslations()
  const { playItem } = useMediaContext()

  const coverUrl = libraryItem ? getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt) : ''

  const podcastTitle = libraryItem?.media.metadata.title || ''
  const podcastAuthor = libraryItem?.media.metadata.author || ''

  const audioFileFilename = episode?.audioFile?.metadata?.filename || ''
  const audioFileSize = useMemo(() => bytesPretty(episode?.audioFile?.metadata?.size || 0), [episode?.audioFile?.metadata?.size])
  const audioFileDuration = useMemo(
    () => formatDuration(episode?.audioFile?.duration || episode?.audioTrack?.duration || 0, t),
    [episode?.audioFile?.duration, episode?.audioTrack?.duration, t]
  )

  const parsedDescription = useMemo(() => {
    if (!episode?.description && !episode?.subtitle) return ''
    const description = episode.description || episode.subtitle || ''

    const timeMarkerLinkRegex = /<a href="#([^"]*?\b\d{1,2}:\d{1,2}(?::\d{1,2})?)">(.*?)<\/a>/g
    const timeMarkerRegex = /\b\d{1,2}:\d{1,2}(?::\d{1,2})?\b/g

    const convertToSeconds = (time: string) => {
      const timeParts = time.split(':').map(Number)
      return timeParts.reduce((acc, part) => acc * 60 + part, 0)
    }

    return description
      .replace(timeMarkerLinkRegex, (match, href, displayTime) => {
        const timeMatch = displayTime.match(timeMarkerRegex)
        if (!timeMatch) return match
        const time = timeMatch[0]
        const seekTimeInSeconds = convertToSeconds(time)
        return `<span class="time-marker cursor-pointer text-blue-400 hover:text-blue-300 pointer-events-auto" data-time="${seekTimeInSeconds}">${displayTime}</span>`
      })
      .replace(timeMarkerRegex, (match) => {
        const seekTimeInSeconds = convertToSeconds(match)
        return `<span class="time-marker cursor-pointer text-blue-400 hover:text-blue-300 pointer-events-auto" data-time="${seekTimeInSeconds}">${match}</span>`
      })
      .replace(/<a /gi, '<a target="_blank" rel="noopener noreferrer" ')
  }, [episode?.description, episode?.subtitle])

  const handleDescriptionClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (target.matches('span.time-marker')) {
        const timeStr = target.dataset.time
        if (timeStr) {
          const time = parseInt(timeStr, 10)
          if (!isNaN(time) && episode && libraryItem) {
            playItem({
              libraryItem,
              episodeId: episode.id,
              startTime: time,
              queueItems: []
            })
            onClose()
          }
        }
        e.preventDefault()
      }
    },
    [episode, libraryItem, playItem, onClose]
  )

  if (!episode || !libraryItem) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      outerContent={
        <div className="absolute top-0 left-0 p-5 w-2/3 overflow-hidden pointer-events-none">
          <p className="text-3xl text-white truncate">{t('LabelEpisode')}</p>
        </div>
      }
      className="p-4 w-full text-sm rounded-lg bg-bg shadow-lg relative overflow-y-auto max-h-[80vh]"
    >
      <div className="flex mb-4">
        <div className="w-12 h-12 relative flex-shrink-0">
          <PreviewCover src={coverUrl} fill bookCoverAspectRatio={1} showResolution={false} />
        </div>
        <div className="grow px-2 overflow-hidden">
          <p className="text-base mb-1 truncate">{podcastTitle}</p>
          <p className="text-xs text-foreground-muted truncate">{podcastAuthor}</p>
        </div>
      </div>

      <p dir="auto" className="text-lg font-semibold mb-6">
        {episode.title || 'No Episode Title'}
      </p>

      {parsedDescription ? (
        <div
          dir="auto"
          className="default-style less-spacing break-words"
          onClick={handleDescriptionClick}
          dangerouslySetInnerHTML={{ __html: parsedDescription }}
        />
      ) : (
        <p className="mb-2">{t('MessageNoDescription')}</p>
      )}

      <div className="w-full h-px bg-border my-4" />

      <div className="flex flex-wrap items-center gap-y-4">
        <div className="grow w-full sm:w-auto">
          <p className="font-semibold text-xs mb-1">{t('LabelFilename')}</p>
          <p className="mb-2 text-xs truncate" title={audioFileFilename}>
            {audioFileFilename}
          </p>
        </div>
        <div className="grow">
          <p className="font-semibold text-xs mb-1">{t('LabelSize')}</p>
          <p className="mb-2 text-xs">{audioFileSize}</p>
        </div>
        <div className="grow">
          <p className="font-semibold text-xs mb-1">{t('LabelDuration')}</p>
          <p className="mb-2 text-xs">{audioFileDuration}</p>
        </div>
      </div>
    </Modal>
  )
}
