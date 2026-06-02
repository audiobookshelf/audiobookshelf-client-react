'use client'

import { createPodcastsFromOpmlAction } from '@/app/(main)/library/[library]/(podcast)/add-podcast/actions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { OpmlFeed } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

export interface OpmlFeedsModalProps {
  isOpen: boolean
  feeds: OpmlFeed[]
  onClose: () => void
}

export default function OpmlFeedsModal({ isOpen, feeds, onClose }: OpmlFeedsModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { library } = useLibrary()
  const [isPending, startTransition] = useTransition()

  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [autoDownloadEpisodes, setAutoDownloadEpisodes] = useState(false)

  const folderItems = useMemo<DropdownItem[]>(
    () =>
      (library.folders ?? []).map((fold) => ({
        value: fold.id,
        text: fold.fullPath
      })),
    [library.folders]
  )

  useEffect(() => {
    if (!isOpen) return
    setAutoDownloadEpisodes(false)
    setSelectedFolderId(library.folders?.[0]?.id ?? '')
  }, [isOpen, library.folders])

  const handleSubmit = useCallback(() => {
    if (!selectedFolderId || feeds.length === 0) {
      showToast(t('ToastPodcastCreateFailed'), { type: 'error' })
      return
    }

    startTransition(async () => {
      try {
        await createPodcastsFromOpmlAction({
          feeds: feeds.map((f) => f.feedUrl),
          folderId: selectedFolderId,
          libraryId: library.id,
          autoDownloadEpisodes
        })
        onClose()
      } catch (error) {
        console.error('Failed to bulk create podcasts from OPML', error)
        const message = error instanceof Error ? error.message : t('ToastPodcastCreateFailed')
        showToast(message, { type: 'error' })
      }
    })
  }, [autoDownloadEpisodes, feeds, library.id, onClose, selectedFolderId, showToast, t])

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="text-xl text-white">{t('MessageTaskOpmlImport')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} processing={isPending} outerContent={outerContent}>
      <div className="flex max-h-[90vh] flex-col">
        <div className="min-w-0 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="grid min-w-0 gap-4 md:grid-cols-3 [&>*]:min-w-0">
            <div className="md:col-span-2">
              <Dropdown
                label={t('LabelFolder')}
                value={selectedFolderId}
                items={folderItems}
                disabled={isPending}
                onChange={(folderId) => setSelectedFolderId(String(folderId))}
              />
            </div>
            <div className="flex items-end">
              <Checkbox value={autoDownloadEpisodes} onChange={setAutoDownloadEpisodes} label={t('LabelAutoDownloadEpisodes')} checkboxBgClass="bg-primary" />
            </div>
          </div>

          <div>
            <p className="mb-1 text-lg font-semibold">{t('HeaderPodcastsToAdd')}</p>
            <p className="text-foreground-muted mb-4 text-sm">{t('MessageOpmlPreviewNote')}</p>

            <div className="max-h-[50vh] overflow-y-auto">
              <ul className="space-y-2">
                {feeds.map((feed, index) => (
                  <li key={`${feed.feedUrl}-${index}`} className="flex min-w-0 items-start gap-2">
                    <p className="text-lg font-semibold">{index + 1}.</p>
                    <div className="min-w-0 flex-1 ps-1">
                      {feed.title ? <p className="text-sm font-semibold">{feed.title}</p> : null}
                      <p className="text-foreground-muted truncate text-xs" title={feed.feedUrl}>
                        {feed.feedUrl}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-border border-t px-4 py-3 sm:px-6">
          <div className="flex justify-end">
            <Btn disabled={isPending || !selectedFolderId} loading={isPending} onClick={handleSubmit}>
              {t('ButtonAddPodcasts')}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}
