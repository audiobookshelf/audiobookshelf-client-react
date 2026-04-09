'use client'

import Btn from '@/components/ui/Btn'
import { useSocketEmit } from '@/contexts/SocketContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import { Task } from '@/types/api'
import { TranslationKey } from '@/types/translations'
import { useCallback, useMemo, useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ItemTaskRunningCardProps {
  task: Task
}

interface TaskScanResults {
  added?: number
  updated?: number
  missing?: number
  elapsed?: number
}

interface TaskDataWithScanResults {
  scanResults?: TaskScanResults
}

function mapSubsToValues(subs: string[] | null | undefined): Record<string, string> | undefined {
  if (!subs?.length) {
    return undefined
  }

  return subs.reduce<Record<string, string>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})
}

function getTaskString(
  t: ReturnType<typeof useTypeSafeTranslations>,
  key: string | null,
  subs: string[] | null,
  fallback: string | null,
  defaultValue = ''
): string {
  if (!key) {
    return fallback || defaultValue
  }

  try {
    const values = mapSubsToValues(subs)
    return values ? t(key as TranslationKey, values) : t(key as TranslationKey)
  } catch {
    return fallback || defaultValue
  }
}

export default function ItemTaskRunningCard({ task }: ItemTaskRunningCardProps) {
  const t = useTypeSafeTranslations()
  const { emit } = useSocketEmit()
  const { userIsAdminOrUp } = useUser()
  const [cancelingScan, setCancelingScan] = useState(false)

  const isFinished = !!task.isFinished
  const isFailed = !!task.isFailed
  const isSuccess = isFinished && !isFailed

  const title = useMemo(() => {
    return getTaskString(t, task.titleKey, task.titleSubs, task.title, 'No Title')
  }, [t, task.title, task.titleKey, task.titleSubs])

  const description = useMemo(() => {
    return getTaskString(t, task.descriptionKey, task.descriptionSubs, task.description)
  }, [t, task.description, task.descriptionKey, task.descriptionSubs])

  const failedMessage = useMemo(() => {
    return getTaskString(t, task.errorKey, task.errorSubs, task.error)
  }, [t, task.error, task.errorKey, task.errorSubs])

  const action = task.action || ''

  const isLibraryScan = useMemo(() => {
    return action === 'library-scan' || action === 'library-match-all'
  }, [action])

  const actionIcon = useMemo(() => {
    if (isFailed) {
      return 'error'
    }
    if (isSuccess) {
      return 'done'
    }
  }, [isFailed, isSuccess])

  const actionIconStatus = useMemo(() => {
    if (isFailed) {
      return 'text-error'
    }
    if (isSuccess) {
      return 'text-success'
    }
    return ''
  }, [isFailed, isSuccess])

  const specialMessage = useMemo(() => {
    const scanResults = (task.data as TaskDataWithScanResults | undefined)?.scanResults
    if (!scanResults) {
      return ''
    }

    const messages: string[] = []

    if (scanResults.added) {
      messages.push(t('MessageTaskScanItemsAdded', { 0: scanResults.added }))
    }
    if (scanResults.updated) {
      messages.push(t('MessageTaskScanItemsUpdated', { 0: scanResults.updated }))
    }
    if (scanResults.missing) {
      messages.push(t('MessageTaskScanItemsMissing', { 0: scanResults.missing }))
    }

    const changesDetected = messages.length > 0 ? messages.join(', ') : t('MessageTaskScanNoChangesNeeded')
    if (!scanResults.elapsed) {
      return changesDetected
    }

    const elapsed = formatDuration(scanResults.elapsed / 1000, t, {
      style: 'compact',
      showDays: true,
      showSeconds: true
    })

    return elapsed ? `${changesDetected} (${elapsed})` : changesDetected
  }, [t, task.data])

  const cancelScan = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const libraryId = task.data?.libraryId
      if (!libraryId) {
        console.error('No library id in library-scan task', task)
        return
      }

      setCancelingScan(true)
      emit('cancel_scan', libraryId)
    },
    [emit, task]
  )

  return (
    <div className="flex items-start gap-2 px-2 py-1">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center pt-0.5">
        {isFinished ? <span className={`material-symbols text-base ${actionIconStatus}`}>{actionIcon}</span> : <LoadingSpinner className="!cursor-default" />}
      </div>

      <div className="min-w-0 grow">
        <p className="text-sm leading-5 break-words">{title}</p>
        {!!description && <p className="text-foreground-muted text-xs leading-4 break-words whitespace-normal">{description}</p>}
        {!!specialMessage && <p className="text-foreground-muted text-xs leading-4 break-words whitespace-normal">{specialMessage}</p>}
        {isFailed && !!failedMessage && <p className="text-error text-xs leading-4 break-words whitespace-normal">{failedMessage}</p>}
      </div>

      {userIsAdminOrUp && !isFinished && isLibraryScan && !cancelingScan && (
        <Btn size="small" color="bg-primary" className="my-0.5 shrink-0 px-2 text-xs" onClick={cancelScan}>
          {t('ButtonCancel')}
        </Btn>
      )}
    </div>
  )
}
