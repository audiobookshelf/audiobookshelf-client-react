'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { EmailSettings, EmailSettingsFormFields } from '@/types/api'
import { FormEvent, useMemo, useState, useTransition } from 'react'
import SettingsContent from '../SettingsContent'
import SettingsToggleSwitch from '../SettingsToggleSwitch'
import { sendTestEmail, updateEmailSettings } from './actions'

function toFormFields(settings: EmailSettings): EmailSettingsFormFields {
  return {
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    rejectUnauthorized: settings.rejectUnauthorized,
    user: settings.user,
    pass: settings.pass,
    testAddress: settings.testAddress,
    fromAddress: settings.fromAddress
  }
}

interface EmailClientProps {
  initialSettings: EmailSettings
}

export default function EmailClient({ initialSettings }: EmailClientProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [savedSettings, setSavedSettings] = useState(initialSettings)
  const [draftSettings, setDraftSettings] = useState<EmailSettingsFormFields>(() => toFormFields(initialSettings))

  const hasUpdates = useMemo(() => {
    const saved = toFormFields(savedSettings)
    return (Object.keys(draftSettings) as (keyof EmailSettingsFormFields)[]).some((key) => draftSettings[key] !== saved[key])
  }, [draftSettings, savedSettings])

  const isBusy = isPending || isSendingTest

  const handleFieldChange = <K extends keyof EmailSettingsFormFields>(key: K, value: EmailSettingsFormFields[K]) => {
    setDraftSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setDraftSettings(toFormFields(savedSettings))
  }

  const handleSendTest = async () => {
    if (isBusy || !draftSettings.host) return

    setIsSendingTest(true)
    try {
      const result = await sendTestEmail()
      if (result.success) {
        showToast(t('ToastDeviceTestEmailSuccess'), { type: 'success' })
      } else {
        showToast(result.error || t('ToastDeviceTestEmailFailed'), { type: 'error' })
      }
    } catch (error) {
      console.error('Failed to send test email', error)
      showToast(t('ToastDeviceTestEmailFailed'), { type: 'error' })
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBusy || !hasUpdates) return

    const payload: EmailSettingsFormFields = {
      ...draftSettings,
      port: draftSettings.port ? Number(draftSettings.port) : 465
    }

    startTransition(async () => {
      try {
        const response = await updateEmailSettings(payload)
        if (response?.settings) {
          setSavedSettings(response.settings)
          setDraftSettings(toFormFields(response.settings))
          showToast(t('ToastEmailSettingsUpdateSuccess'), { type: 'success' })
        }
      } catch (error) {
        console.error('Failed to update email settings', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }

  return (
    <SettingsContent title={t('HeaderEmailSettings')} moreInfoUrl="https://www.audiobookshelf.org/guides/send_to_ereader" className="pb-0 md:pb-0">
      <form onSubmit={handleSubmit} className="relative">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-3">
            <TextInput
              label={t('LabelHost')}
              value={draftSettings.host ?? ''}
              disabled={isBusy}
              onChange={(value) => handleFieldChange('host', value || null)}
            />
          </div>
          <div className="md:col-span-1">
            <TextInput
              label={t('LabelPort')}
              type="number"
              value={draftSettings.port ?? ''}
              disabled={isBusy}
              onChange={(value) => handleFieldChange('port', value === '' ? 465 : Number(value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-2">
          <SettingsToggleSwitch
            label={t('LabelEmailSettingsSecure')}
            value={draftSettings.secure}
            disabled={isBusy}
            onChange={(value) => handleFieldChange('secure', value)}
            tooltip={t('LabelEmailSettingsSecureHelp')}
          />
          <SettingsToggleSwitch
            label={t('LabelEmailSettingsRejectUnauthorized')}
            value={draftSettings.rejectUnauthorized}
            disabled={isBusy}
            onChange={(value) => handleFieldChange('rejectUnauthorized', value)}
            tooltip={t('LabelEmailSettingsRejectUnauthorizedHelp')}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label={t('LabelUsername')}
            value={draftSettings.user ?? ''}
            disabled={isBusy}
            onChange={(value) => handleFieldChange('user', value || null)}
          />
          <TextInput
            label={t('LabelPassword')}
            type="password"
            value={draftSettings.pass ?? ''}
            disabled={isBusy}
            autocomplete="current-password"
            onChange={(value) => handleFieldChange('pass', value || null)}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label={t('LabelEmailSettingsFromAddress')}
            value={draftSettings.fromAddress ?? ''}
            disabled={isBusy}
            onChange={(value) => handleFieldChange('fromAddress', value || null)}
          />
          <TextInput
            label={t('LabelEmailSettingsTestAddress')}
            value={draftSettings.testAddress ?? ''}
            disabled={isBusy}
            onChange={(value) => handleFieldChange('testAddress', value || null)}
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          {hasUpdates ? (
            <Btn type="button" disabled={isBusy} onClick={handleReset}>
              {t('ButtonReset')}
            </Btn>
          ) : (
            <Btn type="button" loading={isSendingTest} disabled={isBusy || !draftSettings.host} onClick={handleSendTest}>
              {t('ButtonTest')}
            </Btn>
          )}
          <Btn type="submit" loading={isPending} disabled={!hasUpdates || isBusy}>
            {t('ButtonSave')}
          </Btn>
        </div>
      </form>
    </SettingsContent>
  )
}
