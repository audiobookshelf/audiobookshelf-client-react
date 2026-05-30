'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Notification, NotificationData, NotificationSettings, NotificationSettingsPatch } from '@/types/api'
import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import SettingsContent from '../SettingsContent'
import { updateNotificationSettings } from './actions'
import NotificationCard from './NotificationCard'
import NotificationEditModal from './NotificationEditModal'

interface NotificationsClientProps {
  initialSettings: NotificationSettings
  notificationData: NotificationData
}

function toAppriseSettingsPatch(appriseApiUrl: string, maxNotificationQueue: string, maxFailedAttempts: string): NotificationSettingsPatch {
  return {
    appriseApiUrl: appriseApiUrl.trim() || null,
    maxNotificationQueue: Number(maxNotificationQueue),
    maxFailedAttempts: Number(maxFailedAttempts)
  }
}

const appriseDescriptionTags = {
  appriseLink: (chunks: React.ReactNode) => (
    <a href="https://github.com/caronc/apprise-api" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline" rel="noopener noreferrer">
      {chunks}
    </a>
  ),
  code: (chunks: React.ReactNode) => <code className="bg-foreground/10 text-foreground rounded-md px-1 py-0.5">{chunks}</code>,
  br: () => <br />
}

export default function NotificationsClient({ initialSettings, notificationData }: NotificationsClientProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState(initialSettings)
  const [appriseApiUrl, setAppriseApiUrl] = useState(initialSettings.appriseApiUrl ?? '')
  const [maxNotificationQueue, setMaxNotificationQueue] = useState(String(initialSettings.maxNotificationQueue))
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(String(initialSettings.maxFailedAttempts))
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)

  const syncFromSettings = useCallback((notificationSettings: NotificationSettings) => {
    setSettings(notificationSettings)
    setAppriseApiUrl(notificationSettings.appriseApiUrl ?? '')
    setMaxNotificationQueue(String(notificationSettings.maxNotificationQueue))
    setMaxFailedAttempts(String(notificationSettings.maxFailedAttempts))
  }, [])

  useEffect(() => {
    syncFromSettings(initialSettings)
  }, [initialSettings, syncFromSettings])

  useSocketEvent<NotificationSettings>('notifications_updated', syncFromSettings, [syncFromSettings])

  const draftAppriseSettings = useMemo(
    () => toAppriseSettingsPatch(appriseApiUrl, maxNotificationQueue, maxFailedAttempts),
    [appriseApiUrl, maxFailedAttempts, maxNotificationQueue]
  )

  const hasAppriseSettingsUpdates = useMemo(
    () =>
      (settings.appriseApiUrl ?? '') !== (draftAppriseSettings.appriseApiUrl ?? '') ||
      settings.maxNotificationQueue !== draftAppriseSettings.maxNotificationQueue ||
      settings.maxFailedAttempts !== draftAppriseSettings.maxFailedAttempts,
    [draftAppriseSettings, settings]
  )

  const openEditModal = (notification: Notification | null) => {
    setEditingNotification(notification)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setEditingNotification(null)
  }

  const handleSubmitAppriseSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPending || !hasAppriseSettingsUpdates) return

    const trimmedUrl = appriseApiUrl.trim()
    if (trimmedUrl) {
      try {
        new URL(trimmedUrl)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Invalid URL', { type: 'error' })
        return
      }
    }

    const { maxNotificationQueue: queue, maxFailedAttempts: failed } = draftAppriseSettings
    if (isNaN(queue) || queue < 0) {
      showToast(t('ToastNotificationQueueMaximum'), { type: 'error' })
      return
    }
    if (isNaN(failed) || failed < 0) {
      showToast(t('ToastNotificationFailedMaximum'), { type: 'error' })
      return
    }

    startTransition(async () => {
      try {
        await updateNotificationSettings(draftAppriseSettings)
        setSettings((prev) => ({ ...prev, ...draftAppriseSettings }))
        showToast(t('ToastNotificationSettingsUpdateSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to update notification settings', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }

  return (
    <>
      <SettingsContent title={t('HeaderAppriseNotificationSettings')} description={t.rich('MessageAppriseDescription', appriseDescriptionTags)}>
        <form onSubmit={handleSubmitAppriseSettings}>
          <TextInput label="Apprise API Url" value={appriseApiUrl} disabled={isPending} className="mb-2" onChange={setAppriseApiUrl} />

          <div className="flex items-center py-2">
            <TextInput type="number" value={maxNotificationQueue} disabled={isPending} className="w-16" onChange={setMaxNotificationQueue} />
            <Tooltip text={t('LabelNotificationsMaxQueueSizeHelp')} position="right" maxWidth={300} addTabIndex>
              <p className="ps-2 text-base">
                {t('LabelNotificationsMaxQueueSize')}
                <span className="material-symbols icon-text ms-1 text-lg">info</span>
              </p>
            </Tooltip>
          </div>

          <div className="flex items-center py-2">
            <TextInput type="number" value={maxFailedAttempts} disabled={isPending} className="w-16" onChange={setMaxFailedAttempts} />
            <Tooltip text={t('LabelNotificationsMaxFailedAttemptsHelp')} position="right" maxWidth={300} addTabIndex>
              <p className="ps-2 text-base">
                {t('LabelNotificationsMaxFailedAttempts')}
                <span className="material-symbols icon-text ms-1 text-lg">info</span>
              </p>
            </Tooltip>
          </div>

          <div className="flex items-center justify-end pt-4">
            <Btn type="submit" loading={isPending} disabled={isPending || !hasAppriseSettingsUpdates}>
              {t('ButtonSave')}
            </Btn>
          </div>
        </form>

        <div className="bg-border my-6 h-px w-full" />

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('HeaderNotifications')}</h2>
          <Btn size="small" className="flex items-center gap-2" onClick={() => openEditModal(null)}>
            {t('ButtonCreate')}
            <span className="material-symbols text-lg">add</span>
          </Btn>
        </div>

        {!settings.notifications.length ? (
          <p className="text-foreground py-8 text-center text-lg">{t('MessageNoNotifications')}</p>
        ) : (
          settings.notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} onSettingsUpdated={syncFromSettings} onEdit={openEditModal} />
          ))
        )}
      </SettingsContent>

      <NotificationEditModal
        isOpen={isEditModalOpen}
        notification={editingNotification}
        notificationData={notificationData}
        onClose={handleCloseModal}
        onSaved={syncFromSettings}
      />
    </>
  )
}
