'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { MultiSelect } from '@/components/ui/MultiSelect'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Notification, NotificationData, NotificationEvent, NotificationFormPayload, NotificationSettings } from '@/types/api'
import type { TranslationKey } from '@/types/translations'
import { useEffect, useMemo, useState, useTransition } from 'react'
import SettingsToggleSwitch from '../SettingsToggleSwitch'
import { createNotification, updateNotification } from './actions'

const getInitialFormState = (notification: Notification | null, events: NotificationEvent[]): NotificationFormPayload => {
  if (notification) {
    return {
      id: notification.id,
      libraryId: notification.libraryId,
      eventName: notification.eventName,
      urls: [...notification.urls],
      titleTemplate: notification.titleTemplate,
      bodyTemplate: notification.bodyTemplate,
      enabled: notification.enabled,
      type: notification.type
    }
  }

  const defaultEvent = events.find((event) => event.name === 'onTest') ?? events[0]
  return {
    libraryId: null,
    eventName: defaultEvent?.name ?? 'onTest',
    urls: [],
    titleTemplate: defaultEvent?.defaults.title ?? '',
    bodyTemplate: defaultEvent?.defaults.body ?? '',
    enabled: true,
    type: null
  }
}

interface NotificationEditModalProps {
  isOpen: boolean
  notification: Notification | null
  notificationData: NotificationData
  onClose: () => void
  onSaved: (settings: NotificationSettings) => void
}

export default function NotificationEditModal({ isOpen, notification, notificationData, onClose, onSaved }: NotificationEditModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [formState, setFormState] = useState<NotificationFormPayload>(() => getInitialFormState(notification, notificationData.events))

  const isEditing = !!notification

  useEffect(() => {
    if (isOpen) {
      setFormState(getInitialFormState(notification, notificationData.events))
    }
  }, [isOpen, notification, notificationData.events])

  const eventOptions: DropdownItem[] = useMemo(
    () =>
      notificationData.events.map((event) => ({
        value: event.name,
        text: event.name,
        subtext: event.descriptionKey ? t(event.descriptionKey as TranslationKey) : event.description
      })),
    [notificationData.events, t]
  )

  const selectedEvent = useMemo(
    () => notificationData.events.find((event) => event.name === formState.eventName),
    [formState.eventName, notificationData.events]
  )

  const handleEventChange = (eventName: string | number) => {
    const event = notificationData.events.find((item) => item.name === eventName)
    setFormState((prev) => ({
      ...prev,
      eventName: String(eventName),
      titleTemplate: event?.defaults.title ?? prev.titleTemplate,
      bodyTemplate: event?.defaults.body ?? prev.bodyTemplate
    }))
  }

  const handleSubmit = () => {
    if (!formState.urls.length) {
      showToast(t('ToastAppriseUrlRequired'), { type: 'error' })
      return
    }

    startTransition(async () => {
      try {
        const updatedSettings = isEditing ? await updateNotification(formState.id!, formState) : await createNotification(formState)
        onSaved(updatedSettings)
        if (isEditing) {
          showToast(t('ToastNotificationUpdateSuccess'), { type: 'success' })
        }
        onClose()
      } catch (error) {
        console.error('Failed to save notification', error)
        showToast(isEditing ? t('ToastFailedToUpdate') : t('ToastNotificationCreateFailed'), { type: 'error' })
      }
    })
  }

  const outerContentTitle = (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="truncate text-xl text-white">{isEditing ? t('HeaderNotificationUpdate') : t('HeaderNotificationCreate')}</h2>
    </div>
  )

  const urlItems = formState.urls.map((url) => ({ value: url, content: url }))

  return (
    <Modal isOpen={isOpen} processing={isPending} onClose={onClose} outerContent={outerContentTitle} className="w-[800px]">
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex flex-col gap-2 overflow-y-auto px-4 py-6 sm:px-6">
          <Dropdown label={t('LabelNotificationEvent')} items={eventOptions} value={formState.eventName} disabled={isPending} onChange={handleEventChange} />

          <MultiSelect
            label={t('LabelNotificationAppriseURL')}
            selectedItems={urlItems}
            items={[]}
            disabled={isPending}
            allowNew
            showEdit
            onItemAdded={(item) => {
              if (formState.urls.includes(item.value)) return
              setFormState((prev) => ({ ...prev, urls: [...prev.urls, item.value] }))
            }}
            onItemRemoved={(item) => setFormState((prev) => ({ ...prev, urls: prev.urls.filter((url) => url !== item.value) }))}
            onItemEdited={(item, index) =>
              setFormState((prev) => {
                const urls = [...prev.urls]
                urls[index] = item.value
                return { ...prev, urls }
              })
            }
          />

          <TextInput
            label={t('LabelNotificationTitleTemplate')}
            value={formState.titleTemplate}
            disabled={isPending}
            onChange={(value) => setFormState((prev) => ({ ...prev, titleTemplate: value }))}
          />

          <TextareaInput
            label={t('LabelNotificationBodyTemplate')}
            value={formState.bodyTemplate}
            rows={4}
            disabled={isPending}
            onChange={(value) => setFormState((prev) => ({ ...prev, bodyTemplate: value }))}
          />

          {selectedEvent?.variables?.length ? (
            <p className="text-foreground-muted text-sm">
              <strong>{t('LabelNotificationAvailableVariables')}:</strong> {selectedEvent.variables.join(', ')}
            </p>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-border border-t px-4 py-3 sm:px-6">
          <div className="flex justify-between">
            <SettingsToggleSwitch
              label={t('LabelEnable')}
              value={formState.enabled}
              disabled={isPending}
              onChange={(enabled) => setFormState((prev) => ({ ...prev, enabled }))}
            />
            <Btn loading={isPending} disabled={isPending} onClick={handleSubmit}>
              {t('ButtonSubmit')}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}
