'use client'

import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { Notification, NotificationSettings } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useState, useTransition } from 'react'
import { deleteNotification, NotificationTestResult, testNotification, triggerOnTestEvent, updateNotification } from './actions'

interface NotificationCardProps {
  notification: Notification
  onSettingsUpdated: (settings: NotificationSettings) => void
  onEdit: (notification: Notification) => void
}

type TestingAction = 'test' | 'fireSuccess' | 'fireFail' | 'enable' | null

export default function NotificationCard({ notification, onSettingsUpdated, onEdit }: NotificationCardProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTestConfirm, setShowTestConfirm] = useState(false)
  const [testingAction, setTestingAction] = useState<TestingAction>(null)

  const isBusy = isPending || testingAction !== null

  const showTestError = useCallback(
    (error: string) => {
      showToast(error ? `Failed: ${error}` : t('ToastNotificationTestTriggerFailed'), { type: 'error' })
    },
    [showToast, t]
  )

  const runTest = useCallback(
    (action: TestingAction, request: () => Promise<NotificationTestResult>) => {
      setTestingAction(action)
      startTransition(async () => {
        const result = await request()
        if (result.success) {
          showToast(t('ToastNotificationTestTriggerSuccess'), { type: 'success' })
        } else {
          showTestError(result.error)
        }
        setTestingAction(null)
      })
    },
    [showTestError, showToast, t]
  )

  const handleEnable = useCallback(() => {
    setTestingAction('enable')
    startTransition(async () => {
      try {
        const notificationSettings = await updateNotification(notification.id, { id: notification.id, enabled: true })
        onSettingsUpdated(notificationSettings)
      } catch (error) {
        console.error('Failed to enable notification', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      } finally {
        setTestingAction(null)
      }
    })
  }, [notification.id, onSettingsUpdated, showToast, t])

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteConfirm(false)
    startTransition(async () => {
      try {
        onSettingsUpdated(await deleteNotification(notification.id))
      } catch (error) {
        console.error('Failed to delete notification', error)
        showToast(t('ToastNotificationDeleteFailed'), { type: 'error' })
      }
    })
  }, [notification.id, onSettingsUpdated, showToast, t])

  const lastFiredLabel = notification.lastFiredAt ? formatDistanceToNow(new Date(notification.lastFiredAt), { addSuffix: true }) : null
  const isOnTestEvent = notification.eventName === 'onTest'

  return (
    <>
      <div className={mergeClasses('border-border my-2 w-full rounded-xl border p-4', notification.enabled ? 'bg-primary/25' : 'bg-error/5')}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="pe-4 text-base font-semibold">{notification.eventName}</p>
          <div className="grow" />

          {isOnTestEvent && notification.enabled ? (
            <>
              <Btn
                size="small"
                loading={testingAction === 'fireSuccess'}
                disabled={isBusy}
                onClick={() => runTest('fireSuccess', () => triggerOnTestEvent(false))}
              >
                {t('ButtonFireOnTest')}
              </Btn>
              <Btn
                size="small"
                color="bg-error"
                loading={testingAction === 'fireFail'}
                disabled={isBusy}
                onClick={() => runTest('fireFail', () => triggerOnTestEvent(true))}
              >
                {t('ButtonFireAndFail')}
              </Btn>
            </>
          ) : notification.enabled ? (
            <Btn size="small" loading={testingAction === 'test'} disabled={isBusy} onClick={() => setShowTestConfirm(true)}>
              {t('ButtonTest')}
            </Btn>
          ) : (
            <Btn size="small" loading={testingAction === 'enable'} disabled={isBusy} onClick={handleEnable}>
              {t('ButtonEnable')}
            </Btn>
          )}

          <div className="flex items-center gap-1">
            <IconBtn
              ariaLabel={t('ButtonEdit')}
              borderless
              size="small"
              className="text-foreground-muted"
              disabled={isBusy}
              onClick={() => onEdit(notification)}
            >
              edit
            </IconBtn>
            <IconBtn
              ariaLabel={t('ButtonDelete')}
              borderless
              size="small"
              className="text-foreground-muted hover:not-disabled:text-error"
              disabled={isBusy}
              onClick={() => setShowDeleteConfirm(true)}
            >
              delete
            </IconBtn>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-foreground-muted mb-2 text-xs md:text-sm">{notification.urls.join(', ')}</p>
          {notification.lastFiredAt && notification.lastAttemptFailed ? (
            <p className="text-error text-xs">
              Last attempt failed {lastFiredLabel} ({notification.numConsecutiveFailedAttempts} attempt
              {notification.numConsecutiveFailedAttempts === 1 ? '' : 's'})
            </p>
          ) : notification.lastFiredAt ? (
            <p className="text-foreground-subdued text-xs">Last fired {lastFiredLabel}</p>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message={t('MessageConfirmDeleteNotification')}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        isOpen={showTestConfirm}
        message={t('MessageConfirmNotificationTestTrigger')}
        onClose={() => setShowTestConfirm(false)}
        onConfirm={() => {
          setShowTestConfirm(false)
          runTest('test', () => testNotification(notification.id))
        }}
      />
    </>
  )
}
