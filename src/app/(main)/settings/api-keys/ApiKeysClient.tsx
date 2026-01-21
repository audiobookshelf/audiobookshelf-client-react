'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiKey, UserLoginResponse } from '@/types/api'
import SettingsContent from '../SettingsContent'
import ApiKeysTable from './ApiKeysTable'

interface ApiKeysClientProps {
  apiKeys: ApiKey[]
  currentUser: UserLoginResponse
}

export default function ApiKeysClient({ apiKeys, currentUser }: ApiKeysClientProps) {
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
      <ApiKeysTable apiKeys={apiKeys} currentUser={currentUser} />
    </SettingsContent>
  )
}
