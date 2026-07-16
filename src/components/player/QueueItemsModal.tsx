'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import Modal from '@/components/modals/Modal'
import ViewEpisodeModal from '@/components/modals/ViewEpisodeModal'
import Checkbox from '@/components/ui/Checkbox'
import IconBtn from '@/components/ui/IconBtn'
import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import type { EpisodeNavigationContext } from '@/lib/episodeEditNavigation'
import { formatDuration } from '@/lib/formatDuration'
import { mergeClasses } from '@/lib/merge-classes'
import { getPlayerQueueEpisodeNavigationContext } from '@/lib/playerQueue'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface QueueItemsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function QueueItemsModal({ isOpen, onClose }: QueueItemsModalProps) {
  const t = useTypeSafeTranslations()
  const { playerQueueItems, playerQueueAutoPlay, setPlayerQueueAutoPlay, isStreaming, isPlaying, playQueueItemAtIndex, removeItemFromQueue, playerControls } =
    useMediaContext()
  const [viewEpisodeNavCtx, setViewEpisodeNavCtx] = useState<EpisodeNavigationContext | null>(null)
  const primaryInputCanHover = usePrimaryInputCanHover()

  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  const queueCountLabel = useMemo(() => {
    const count = playerQueueItems.length
    if (count === 0) {
      return t('LabelItemsPlural', { count })
    }

    const hasEpisodes = playerQueueItems.some((item) => item.episodeId)
    const hasBooks = playerQueueItems.some((item) => !item.episodeId)

    if (hasEpisodes && !hasBooks) {
      return t('LabelXEpisodes', { count })
    }

    if (hasBooks && !hasEpisodes) {
      return t('LabelXBooks', { count })
    }

    return t('LabelItemsPlural', { count })
  }, [playerQueueItems, t])

  const handleOpenEpisode = useCallback(
    (item: PlayerQueueItem) => {
      if (!item.episodeId) return
      setViewEpisodeNavCtx(getPlayerQueueEpisodeNavigationContext(playerQueueItems, item))
    },
    [playerQueueItems]
  )

  const handleCloseViewEpisodeModal = useCallback(() => {
    setViewEpisodeNavCtx(null)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setViewEpisodeNavCtx(null)
    }
  }, [isOpen])

  const handlePlay = useCallback(
    (index: number) => {
      void playQueueItemAtIndex(index).then(() => {
        onClose()
      })
    },
    [onClose, playQueueItemAtIndex]
  )

  const handleRemove = useCallback(
    (item: PlayerQueueItem) => {
      removeItemFromQueue({ libraryItemId: item.libraryItemId, episodeId: item.episodeId })
    },
    [removeItemFromQueue]
  )

  const handlePause = useCallback(() => {
    playerControls.playPause()
  }, [playerControls])

  const renderQueueItemText = useCallback(
    (item: PlayerQueueItem) => {
      const title = item.title || ''
      const titleClassName = 'text-foreground text-sm hover:underline'
      const titleFocusClassName = 'rounded-sm focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-2'
      const titleWrapperClassName = mergeClasses('block w-fit max-w-full min-w-0 px-0.5 text-start', titleFocusClassName)

      const titleContent = primaryInputCanHover ? (
        <TruncatingTooltipText lazy text={title} className={titleClassName} position="top" />
      ) : (
        <span className={mergeClasses('block truncate', titleClassName)}>{title}</span>
      )

      return (
        <div className="min-w-0 py-1">
          {item.episodeId ? (
            <button
              type="button"
              className={titleWrapperClassName}
              onClick={(e) => {
                e.stopPropagation()
                handleOpenEpisode(item)
              }}
            >
              {titleContent}
            </button>
          ) : (
            <Link
              href={`/library/${item.libraryId}/item/${item.libraryItemId}`}
              className={titleWrapperClassName}
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              {titleContent}
            </Link>
          )}
          {item.subtitle ? <TruncatingTooltipText lazy text={item.subtitle} className="text-foreground-muted text-sm" position="top" /> : null}
          {item.caption ? <TruncatingTooltipText lazy text={item.caption} className="text-foreground-subdued text-xs" position="top" /> : null}
        </div>
      )
    },
    [handleOpenEpisode, onClose, primaryInputCanHover]
  )

  const renderQueueItemActions = useCallback(
    (item: PlayerQueueItem, index: number) => {
      const isCurrentlyPlaying = isStreaming(item.libraryItemId, item.episodeId)
      const isItemPlaying = isPlaying(item.libraryItemId, item.episodeId)
      const actionBtnSize = primaryInputCanHover ? 'medium' : 'large'
      const actionBtnGap = primaryInputCanHover ? 'gap-0' : 'gap-1'

      const actionButtons = (
        <>
          <IconBtn
            borderless
            outlined={false}
            size={actionBtnSize}
            className="text-success w-auto shrink-0"
            ariaLabel={isCurrentlyPlaying && isItemPlaying ? t('ButtonPause') : t('ButtonPlay')}
            onClick={isCurrentlyPlaying ? handlePause : () => handlePlay(index)}
          >
            {isCurrentlyPlaying && isItemPlaying ? 'pause' : 'play_arrow'}
          </IconBtn>
          <IconBtn
            borderless
            size={actionBtnSize}
            className="text-error w-auto shrink-0"
            ariaLabel={t('ButtonQueueRemoveItem')}
            onClick={() => handleRemove(item)}
          >
            close
          </IconBtn>
        </>
      )

      const durationLabel = item.duration ? formatDuration(item.duration, t) : 'N/A'
      const statusLabel = isCurrentlyPlaying ? t('ButtonPlaying') : durationLabel

      if (!primaryInputCanHover) {
        return (
          <div className="flex flex-col items-end gap-0.5">
            <div className={mergeClasses('flex items-center justify-end', actionBtnGap)}>{actionButtons}</div>
            <p className="text-foreground-subdued text-xs whitespace-nowrap">{statusLabel}</p>
          </div>
        )
      }

      if (isCurrentlyPlaying) {
        return <div className={mergeClasses('flex items-center justify-end', actionBtnGap)}>{actionButtons}</div>
      }

      return (
        <div className="relative flex h-9 items-center justify-end">
          <p className="text-foreground-subdued text-sm whitespace-nowrap transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">
            {durationLabel}
          </p>
          <div className="absolute inset-y-0 end-0 flex items-center justify-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {actionButtons}
          </div>
        </div>
      )
    },
    [handlePause, handlePlay, handleRemove, isPlaying, isStreaming, primaryInputCanHover, t]
  )

  const getRowClassName = useCallback(
    (item: PlayerQueueItem, index: number) => {
      const isCurrentlyPlaying = isStreaming(item.libraryItemId, item.episodeId)

      if (isCurrentlyPlaying) {
        return 'border-0 bg-warning/10'
      }

      const stripeBg = index % 2 === 0 ? 'bg-white/5' : 'bg-bg'
      return mergeClasses('border-0 hover:bg-white/10 focus-within:bg-white/10', stripeBg)
    },
    [isStreaming]
  )

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('HeaderPlayerQueue')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="sm:max-w-[800px] md:max-w-[800px] lg:max-w-[800px]">
      <div className="max-h-[80vh] w-full min-w-0 overflow-x-hidden overflow-y-auto py-4">
        <div className="flex items-center px-4 pb-4">
          <p className="text-foreground-muted shrink-0 text-base">{queueCountLabel}</p>
          <div className="grow" />
          <Checkbox
            value={playerQueueAutoPlay}
            label="Auto Play"
            onChange={setPlayerQueueAutoPlay}
            checkboxBgClass="bg-primary"
            borderColorClass="border-gray-600"
            labelClass="mb-px ps-2"
            className="shrink-0"
          />
        </div>

        <ul className="grid w-full min-w-0 list-none grid-cols-[auto_1fr_auto]" aria-label={t('HeaderPlayerQueue')}>
          {playerQueueItems.map((item, index) => {
            const coverSrc = item.coverPath ? getLibraryItemCoverUrl(item.libraryItemId) : placeholderUrl

            return (
              <li
                key={`${item.libraryItemId}:${item.episodeId ?? ''}`}
                className={mergeClasses('group col-span-full grid grid-cols-subgrid items-center px-4 py-2', getRowClassName(item, index))}
              >
                <div className="pe-2">
                  <PreviewCover src={coverSrc} width={48} showResolution={false} />
                </div>
                <div className="min-w-0 px-2">{renderQueueItemText(item)}</div>
                <div className="justify-self-end ps-1">{renderQueueItemActions(item, index)}</div>
              </li>
            )
          })}
        </ul>
      </div>

      {viewEpisodeNavCtx && <ViewEpisodeModal isOpen navCtx={viewEpisodeNavCtx} onClose={handleCloseViewEpisodeModal} />}
    </Modal>
  )
}
