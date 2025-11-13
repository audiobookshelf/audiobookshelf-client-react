'use client'

import { embedMetadataQuickAction } from '@/app/actions/toolsActions'
import Btn from '@/components/ui/Btn'
import Alert from '@/components/widgets/Alert'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTasks } from '@/contexts/TasksContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem, isBookLibraryItem } from '@/types/api'
import { TranslationKey } from '@/types/translations'
import { useCallback, useId, useMemo, useState, useTransition } from 'react'

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
  const [isPending, startTransition] = useTransition()
  const [submissionsError, setSubmissionsError] = useState<string | null>(null)

  const baseId = useId()
  const elementIds = useMemo(() => {
    return {
      rootHeader: `${baseId}-audiobook-tools-header`,
      m4bHeader: `${baseId}-m4b-tool-header`,
      m4bDescription: `${baseId}-m4b-tool-description`,
      embedHeader: `${baseId}-embed-tool-header`,
      embedDescription: `${baseId}-embed-tool-description`
    }
  }, [baseId])

  const libraryItemId = libraryItem.id
  const mediaTracks = useMemo(() => {
    if (!isBookLibraryItem(libraryItem)) {
      return []
    }
    return libraryItem.media.tracks || []
  }, [libraryItem])

  const itemTasks = useMemo(() => getTasksByLibraryItemId(libraryItemId), [getTasksByLibraryItemId, libraryItemId])

  const embedTask = useMemo(() => {
    return itemTasks.find((task) => task.action === 'embed-metadata')
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

  const embedTaskError = useMemo(() => {
    if (!embedTask?.isFailed) return null
    // Use errorKey for translation if available, otherwise fall back to error string
    if (embedTask.errorKey) {
      return t(embedTask.errorKey as TranslationKey)
    }
    return embedTask.error
  }, [embedTask, t])

  const embedProgress = useMemo(() => {
    return taskProgress[libraryItemId] || '0%'
  }, [taskProgress, libraryItemId])

  const handleQuickEmbedClick = useCallback(() => {
    setShowConfirmDialog(true)
  }, [])

  const handleConfirmEmbed = useCallback(() => {
    setShowConfirmDialog(false)
    startTransition(async () => {
      try {
        await embedMetadataQuickAction(libraryItemId)
        console.log('Quick embed started for', libraryItemId)
      } catch (error) {
        setSubmissionsError(t('ErrorQuickEmbedSubmission'))
        console.error('Quick embed failed', error)
      }
    })
  }, [libraryItemId, startTransition, t])

  const handleCloseDialog = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  return (
    <section className={mergeClasses('w-full px-4 py-6', className)} aria-labelledby={elementIds.rootHeader}>
      <h2 className="text-xl font-semibold mb-2" id={elementIds.rootHeader}>
        {t('HeaderAudiobookTools')}
      </h2>

      {!mediaTracks.length ? (
        <p className="text-lg text-center my-8">{t('MessageNoAudioTracks')}</p>
      ) : (
        <>
          {/* M4b Maker Section */}
          <section className="w-full border border-black-200 p-4 my-8" aria-labelledby={elementIds.m4bHeader}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg" id={elementIds.m4bHeader}>
                  {t('LabelToolsMakeM4b')}
                </h3>
                <p className="max-w-sm text-sm pt-2 text-gray-300" id={elementIds.m4bDescription}>
                  {t('LabelToolsMakeM4bDescription')}
                </p>
              </div>
              <div className="w-full sm:w-[180px]">
                <Btn
                  to={`/item/${libraryItemId}/manage?tool=m4b`}
                  className="flex items-center justify-center whitespace-nowrap w-full"
                  aria-describedby={elementIds.m4bDescription}
                >
                  {t('ButtonOpenManager')}
                  <span className="material-symbols text-lg ml-2" aria-hidden="true">
                    launch
                  </span>
                </Btn>
              </div>
            </div>
          </section>

          {/* Embed Metadata Section */}
          <section className="w-full border border-black-200 p-4 my-8" aria-labelledby={elementIds.embedHeader}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg" id={elementIds.embedHeader}>
                  {t('LabelToolsEmbedMetadata')}
                </h3>
                <p className="max-w-sm text-sm pt-2 text-gray-300" id={elementIds.embedDescription}>
                  {t('LabelToolsEmbedMetadataDescription')}
                </p>
              </div>
              <div className="flex w-full flex-col items-end sm:w-auto">
                <div className="w-full sm:w-[180px]">
                  <Btn
                    to={`/item/${libraryItemId}/manage?tool=embed`}
                    className="flex items-center justify-center whitespace-nowrap w-full"
                    aria-describedby={elementIds.embedDescription}
                  >
                    {t('ButtonOpenManager')}
                    <span className="material-symbols text-lg ml-2" aria-hidden="true">
                      launch
                    </span>
                  </Btn>
                </div>

                <div className="mt-4 w-full sm:w-[180px]" cy-id="quick-embed-btn">
                  <Btn
                    className="whitespace-nowrap w-full"
                    disabled={isMetadataEmbedQueued || !!isEmbedTaskRunning || isPending}
                    loading={!!isEmbedTaskRunning}
                    progress={embedProgress}
                    onClick={handleQuickEmbedClick}
                    aria-describedby={elementIds.embedDescription}
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

            {embedTaskError && (
              <Alert type="error" className="mt-4">
                <p className="text-lg">{embedTaskError}</p>
              </Alert>
            )}

            {submissionsError && (
              <Alert type="error" className="mt-4">
                <p className="text-lg">{submissionsError}</p>
              </Alert>
            )}
          </section>

          {/* Confirm Dialog */}
          <ConfirmDialog
            isOpen={showConfirmDialog}
            message={t.rich('MessageConfirmQuickEmbed', { br: () => <br /> })}
            onClose={handleCloseDialog}
            onConfirm={handleConfirmEmbed}
          />
        </>
      )}
    </section>
  )
}
