'use client'

import { embedMetadataQuickAction } from '@/app/actions/toolsActions'
import Btn from '@/components/ui/Btn'
import Alert from '@/components/widgets/Alert'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTasks } from '@/contexts/TasksContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem, isBookLibraryItem } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

interface ToolsProps {
  libraryItem: LibraryItem
  className?: string
}

/**
 * Tools component for audiobook management
 *
 * Provides quick access to metadata embedding and M4B creation tools.
 * Only Quick Embed is functional - other tools link to management pages.
 */
export default function Tools({ libraryItem, className }: ToolsProps) {
  const t = useTypeSafeTranslations()
  const { queuedEmbedLIds, taskProgress, getTasksByLibraryItemId } = useTasks()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const libraryItemId = libraryItem.id
  const mediaTracks = useMemo(() => {
    if (!isBookLibraryItem(libraryItem)) {
      return []
    }
    return libraryItem.media.tracks || []
  }, [libraryItem])

  const itemTasks = useMemo(() => getTasksByLibraryItemId(libraryItemId), [getTasksByLibraryItemId, libraryItemId])

  const embedTask = useMemo(() => {
    return itemTasks.find((t) => t.action === 'embed-metadata')
  }, [itemTasks])

  const isMetadataEmbedQueued = useMemo(() => {
    return queuedEmbedLIds.includes(libraryItemId)
  }, [queuedEmbedLIds, libraryItemId])

  const isEmbedTaskRunning = useMemo(() => {
    return embedTask && !embedTask.isFinished
  }, [embedTask])

  const embedTaskFinishedSuccessfully = useMemo(() => {
    return embedTask?.isFinished && !embedTask.isFailed
  }, [embedTask])

  const embedProgress = useMemo(() => {
    return taskProgress[libraryItemId] || '0%'
  }, [taskProgress, libraryItemId])

  const handleQuickEmbedClick = useCallback(() => {
    setShowConfirmDialog(true)
  }, [])

  const handleConfirmEmbed = useCallback(async () => {
    setShowConfirmDialog(false)
    setIsSubmitting(true)
    try {
      await embedMetadataQuickAction(libraryItemId)
      console.log('Quick embed started for', libraryItemId)
    } catch (error) {
      console.error('Quick embed failed', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [libraryItemId])

  const handleCloseDialog = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  const showM4bSection = mediaTracks.length > 0

  if (!mediaTracks.length) {
    return (
      <div className={mergeClasses('w-full px-4 py-6', className)}>
        <p className="text-xl font-semibold mb-2">{t('HeaderAudiobookTools')}</p>
        <p className="text-lg text-center my-8">{t('MessageNoAudioTracks')}</p>
      </div>
    )
  }

  return (
    <div className={mergeClasses('w-full px-4 py-6', className)}>
      <p className="text-xl font-semibold mb-2">{t('HeaderAudiobookTools')}</p>

      {/* M4b Maker Section */}
      {showM4bSection && (
        <div className="w-full border border-black-200 p-4 my-8">
          <div className="flex flex-wrap items-center">
            <div>
              <p className="text-lg">{t('LabelToolsMakeM4b')}</p>
              <p className="max-w-sm text-sm pt-2 text-gray-300">{t('LabelToolsMakeM4bDescription')}</p>
            </div>
            <div className="grow" />
            <div className="flex justify-end">
              <div className="w-[180px] flex justify-end">
                <Btn to={`/item/${libraryItemId}/manage?tool=m4b`} className="flex items-center justify-center whitespace-nowrap w-full">
                  {t('ButtonOpenManager')}
                  <span className="material-symbols text-lg ml-2">launch</span>
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed Metadata Section */}
      <div className="w-full border border-black-200 p-4 my-8">
        <div className="flex items-center">
          <div>
            <p className="text-lg">{t('LabelToolsEmbedMetadata')}</p>
            <p className="max-w-sm text-sm pt-2 text-gray-300">{t('LabelToolsEmbedMetadataDescription')}</p>
          </div>
          <div className="grow" />
          <div className="flex flex-col items-end">
            <div className="w-[180px] flex justify-end">
              <Btn to={`/item/${libraryItemId}/manage?tool=embed`} className="flex items-center justify-center whitespace-nowrap w-full">
                {t('ButtonOpenManager')}
                <span className="material-symbols text-lg ml-2">launch</span>
              </Btn>
            </div>

            <div className="w-[180px] flex justify-end mt-4">
              <Btn
                cy-id="quick-embed-btn"
                className="whitespace-nowrap w-full"
                disabled={isMetadataEmbedQueued || !!isEmbedTaskRunning || isSubmitting}
                loading={!!isEmbedTaskRunning}
                progress={embedProgress}
                onClick={handleQuickEmbedClick}
              >
                {t('ButtonQuickEmbed')}
              </Btn>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {isMetadataEmbedQueued && (
          <Alert type="warning" className="mt-4">
            <p className="text-lg">{t('MessageQuickEmbedQueue', { count: queuedEmbedLIds.length })}</p>
          </Alert>
        )}

        {embedTaskFinishedSuccessfully && (
          <Alert type="success" className="mt-4">
            <p className="text-lg">{t('MessageQuickEmbedFinished')}</p>
          </Alert>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t.rich('MessageConfirmQuickEmbed', { br: () => <br /> })}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmEmbed}
      />
    </div>
  )
}
