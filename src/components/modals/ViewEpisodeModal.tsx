'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import EpisodeModal, { useEpisodeModal, type EpisodeModalItemSource } from '@/components/modals/EpisodeModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import { useMediaContext } from '@/contexts/MediaContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { formatDuration } from '@/lib/formatDuration'
import { bytesPretty } from '@/lib/string'
import Link from 'next/link'
import React, { useCallback, useMemo } from 'react'

export type ViewEpisodeModalProps = {
  isOpen: boolean
  onClose: () => void
} & EpisodeModalItemSource

type ViewEpisodeModalBodyProps = {
  onClose: () => void
}

function ViewEpisodeModalBody({ onClose }: ViewEpisodeModalBodyProps) {
  const t = useTypeSafeTranslations()
  const { playItem } = useMediaContext()
  const { resolvedEpisode, resolvedLibraryItem, fetchPending } = useEpisodeModal()

  const episode = resolvedEpisode
  const libraryItem = resolvedLibraryItem

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

  if (fetchPending && !episode) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingIndicator variant="inline" />
      </div>
    )
  }

  if (!episode || !libraryItem) return null

  const podcastHref = `/library/${libraryItem.libraryId}/item/${libraryItem.id}`

  return (
    <>
      <div className="mb-4 flex">
        <div className="relative h-12 w-12 flex-shrink-0">
          <PreviewCover src={coverUrl} fill bookCoverAspectRatio={1} showResolution={false} />
        </div>
        <div className="min-w-0 grow px-2">
          <Link
            href={podcastHref}
            className="focus-visible:outline-foreground-muted mb-1 inline-block max-w-full rounded-sm text-base underline focus-visible:outline-1 focus-visible:outline-offset-2 md:no-underline md:hover:underline"
            onClick={onClose}
          >
            <span className="block truncate">{podcastTitle}</span>
          </Link>
          <p className="text-foreground-muted truncate text-xs">{podcastAuthor}</p>
        </div>
      </div>

      <p dir="auto" className="mb-6 text-lg font-semibold">
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

      <div className="bg-border my-4 h-px w-full" />

      <div className="flex flex-wrap items-center gap-y-4">
        <div className="w-full grow sm:w-auto">
          <p className="mb-1 text-xs font-semibold">{t('LabelFilename')}</p>
          <p className="mb-2 truncate text-xs" title={audioFileFilename}>
            {audioFileFilename}
          </p>
        </div>
        <div className="grow">
          <p className="mb-1 text-xs font-semibold">{t('LabelSize')}</p>
          <p className="mb-2 text-xs">{audioFileSize}</p>
        </div>
        <div className="grow">
          <p className="mb-1 text-xs font-semibold">{t('LabelDuration')}</p>
          <p className="mb-2 text-xs">{audioFileDuration}</p>
        </div>
      </div>
    </>
  )
}

/**
 * Modal for viewing podcast episode details.
 * Pass `navCtx` to load episodes and enable prev/next, or `libraryItem` + `episode` for direct mode.
 */
export default function ViewEpisodeModal(props: ViewEpisodeModalProps) {
  const { isOpen, onClose } = props
  const navCtxMode = 'navCtx' in props

  return (
    <EpisodeModal
      isOpen={isOpen}
      onClose={onClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem, episode: props.episode })}
      className="bg-bg relative max-h-[80vh] w-full overflow-y-auto rounded-lg p-4 text-sm shadow-lg"
    >
      <ViewEpisodeModalBody onClose={onClose} />
    </EpisodeModal>
  )
}
