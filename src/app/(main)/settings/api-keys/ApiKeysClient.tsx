'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiKey } from '@/types/api'
import SettingsContent from '../SettingsContent'

interface ApiKeysClientProps {
  apiKeys: ApiKey[]
}

export default function ApiKeysClient({ apiKeys }: ApiKeysClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent
      title={t('HeaderApiKeys')}
      moreInfoUrl="https://www.audiobookshelf.org/guides/api-keys"
      addButton={{
        label: t('ButtonAddApiKey'),
        onClick: () => {
          console.log('Add API Key')
        }
      }}
    >
      <div className="flex flex-col gap-2 py-4">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id}>{apiKey.name}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
