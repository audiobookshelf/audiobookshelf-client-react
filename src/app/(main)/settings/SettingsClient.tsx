'use client'

import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ServerSettings } from '@/types/api'
import { useState, useTransition } from 'react'

interface SettingsClientProps {
  serverSettings: ServerSettings
  updateServerSettings: (serverSettings: ServerSettings) => Promise<any>
}

export default function SettingsClient(props: SettingsClientProps) {
  const { serverSettings: initialServerSettings, updateServerSettings } = props
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()
  const [serverSettings, setServerSettings] = useState(initialServerSettings)

  const handleToggleChange = (key: keyof ServerSettings, value: boolean) => {
    const updatedSettings = { ...serverSettings, [key]: value } as ServerSettings

    // Optimistically update the UI
    setServerSettings(updatedSettings)

    // Send the update to the server
    startTransition(async () => {
      try {
        const response = await updateServerSettings(updatedSettings)
        if (response?.data?.serverSettings) {
          // Update with the actual server response
          setServerSettings(response.data.serverSettings)
        }
      } catch (error) {
        // Revert on error
        setServerSettings(serverSettings)
        console.error('Failed to update server settings:', error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t('HeaderSettingsGeneral')}</h2>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            label={t('LabelSettingsStoreCoversWithItem')}
            value={serverSettings?.storeCoverWithItem}
            onChange={(value) => handleToggleChange('storeCoverWithItem', value)}
            disabled={isPending}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t('HeaderSettingsScanner')}</h2>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            label={t('LabelSettingsParseSubtitles')}
            value={serverSettings?.scannerParseSubtitle}
            onChange={(value) => handleToggleChange('scannerParseSubtitle', value)}
            disabled={isPending}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t('HeaderSettingsWebClient')}</h2>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            label={t('LabelSettingsChromecastSupport')}
            value={serverSettings?.chromecastEnabled}
            onChange={(value) => handleToggleChange('chromecastEnabled', value)}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  )
}
