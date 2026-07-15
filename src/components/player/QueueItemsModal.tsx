'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import Modal from '@/components/modals/Modal'
import ViewEpisodeModal from '@/components/modals/ViewEpisodeModal'
import Checkbox from '@/components/ui/Checkbox'
import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable, { type DataTableColumn } from '@/components/ui/SimpleDataTable'
import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { useMediaContext } from '@/contexts/MediaContext'
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

  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

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

  const columns = useMemo<DataTableColumn<PlayerQueueItem>[]>(
    () => [
      {
        label: '',
        headerClassName: 'w-14 ps-4 pe-2',
        cellClassName: 'w-14 ps-4 pe-2 align-middle',
        accessor: (item) => {
          const coverSrc = item.coverPath ? getLibraryItemCoverUrl(item.libraryItemId) : placeholderUrl
          return <PreviewCover src={coverSrc} width={48} showResolution={false} />
        }
      },
      {
        label: '',
        headerClassName: 'min-w-0 px-0',
        cellClassName: 'min-w-0 px-0 align-middle',
        accessor: (item) => (
          <div className="min-w-0 truncate px-2 py-1">
            {item.episodeId ? (
              <button
                type="button"
                className="text-foreground block max-w-full truncate text-start text-sm hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenEpisode(item)
                }}
              >
                {item.title}
              </button>
            ) : (
              <Link
                href={`/library/${item.libraryId}/item/${item.libraryItemId}`}
                className="text-foreground block max-w-full truncate text-sm hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
              >
                {item.title}
              </Link>
            )}
            <p className="text-foreground-muted truncate text-sm">{item.subtitle ?? ''}</p>
            {item.caption && <p className="text-foreground-subdued truncate text-xs">{item.caption}</p>}
          </div>
        )
      },
      {
        label: '',
        headerClassName: 'w-28 ps-2 pe-4 text-end',
        cellClassName: 'w-28 ps-2 pe-4 text-end align-middle',
        accessor: (item, index) => {
          const isCurrentlyPlaying = isStreaming(item.libraryItemId, item.episodeId)
          const isItemPlaying = isPlaying(item.libraryItemId, item.episodeId)

          if (isCurrentlyPlaying) {
            return (
              <div className="-mx-1 flex items-center justify-end">
                <IconBtn
                  borderless
                  outlined={false}
                  size="large"
                  className="text-success mx-1 w-auto"
                  ariaLabel={isItemPlaying ? t('ButtonPause') : t('ButtonPlay')}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePause()
                  }}
                >
                  {isItemPlaying ? 'pause' : 'play_arrow'}
                </IconBtn>
                <IconBtn
                  borderless
                  size="large"
                  className="text-error mx-1 w-auto"
                  ariaLabel={t('ButtonQueueRemoveItem')}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(item)
                  }}
                >
                  close
                </IconBtn>
              </div>
            )
          }

          const durationLabel = item.duration ? formatDuration(item.duration, t) : 'N/A'

          return (
            <div className="relative flex h-9 w-full items-center justify-end">
              <p className="text-foreground-subdued text-end text-sm transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">{durationLabel}</p>
              <div className="absolute inset-y-0 end-0 -mx-1 flex items-center justify-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <IconBtn
                  borderless
                  outlined={false}
                  size="large"
                  className="text-success mx-1 w-auto"
                  ariaLabel={t('ButtonPlay')}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlay(index)
                  }}
                >
                  play_arrow
                </IconBtn>
                <IconBtn
                  borderless
                  size="large"
                  className="text-error mx-1 w-auto"
                  ariaLabel={t('ButtonQueueRemoveItem')}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(item)
                  }}
                >
                  close
                </IconBtn>
              </div>
            </div>
          )
        }
      }
    ],
    [handleOpenEpisode, handlePause, handlePlay, handleRemove, isPlaying, isStreaming, onClose, placeholderUrl, t]
  )

  const getRowClassName = useCallback(
    (item: PlayerQueueItem, index: number) => {
      const isCurrentlyPlaying = isStreaming(item.libraryItemId, item.episodeId)

      if (isCurrentlyPlaying) {
        return 'group border-0 bg-warning/10 even:bg-warning/10 hover:bg-warning/10 even:hover:bg-warning/10 focus-within:bg-warning/10 even:focus-within:bg-warning/10'
      }

      const stripeBg = index % 2 === 0 ? 'bg-white/5 even:bg-white/5' : 'bg-bg even:bg-bg'
      return mergeClasses('group border-0 hover:bg-white/10 even:hover:bg-white/10 focus-within:bg-white/10 even:focus-within:bg-white/10', stripeBg)
    },
    [isStreaming]
  )

  const outerContent = (
    <div className="absolute start-0 top-0 w-2/3 overflow-hidden p-5">
      <p className="truncate text-3xl text-white">{t('HeaderPlayerQueue')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="sm:max-w-[800px] md:max-w-[800px] lg:max-w-[800px]">
      <div className="max-h-[80vh] w-full overflow-x-hidden overflow-y-auto py-4">
        <div className="flex items-center px-4 pb-4">
          <p className="text-foreground text-base">{t('HeaderPlayerQueue')}</p>
          <p className="text-foreground-muted px-4 text-base">{t('LabelItemsPlural', { count: playerQueueItems.length })}</p>
          <div className="grow" />
          <Checkbox
            value={playerQueueAutoPlay}
            label="Auto Play"
            onChange={setPlayerQueueAutoPlay}
            checkboxBgClass="bg-primary"
            borderColorClass="border-gray-600"
            labelClass="mb-px ps-2"
          />
        </div>

        <SimpleDataTable
          data={playerQueueItems}
          columns={columns}
          getRowKey={(item) => `${item.libraryItemId}:${item.episodeId ?? ''}`}
          caption={t('HeaderPlayerQueue')}
          tableClassName="[&_thead]:sr-only border-0 [&_tbody_tr]:border-0"
          className="[&>div]:rounded-none [&>div]:border-0"
          rowClassName={getRowClassName}
        />
      </div>

      {viewEpisodeNavCtx && <ViewEpisodeModal isOpen navCtx={viewEpisodeNavCtx} onClose={handleCloseViewEpisodeModal} />}
    </Modal>
  )
}
