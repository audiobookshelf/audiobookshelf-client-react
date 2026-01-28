'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiKey, User, UserLoginResponse } from '@/types/api'
import { useCallback, useState } from 'react'
import SettingsContent from '../SettingsContent'
import ApiKeysTable from './ApiKeysTable'
import EditApiKeyModal, { ApiKeyFormData } from './EditApiKeyModal'

interface ApiKeysClientProps {
  apiKeys: ApiKey[]
  currentUser: UserLoginResponse
  users: User[]
}

export default function ApiKeysClient({ apiKeys, currentUser, users }: ApiKeysClientProps) {
  const t = useTypeSafeTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null)

  const handleAddClick = useCallback(() => {
    setEditingApiKey(null)
    setIsModalOpen(true)
  }, [])

  const handleEditClick = useCallback((apiKey: ApiKey) => {
    setEditingApiKey(apiKey)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingApiKey(null)
  }, [])

  const handleSubmit = useCallback(
    (formData: ApiKeyFormData) => {
      // TODO: Wire up server actions
      console.log('Submit', formData)
      handleCloseModal()
    },
    [handleCloseModal]
  )

  return (
    <SettingsContent
      title={t('HeaderApiKeys')}
      moreInfoUrl="https://www.audiobookshelf.org/guides/api-keys"
      addButton={{
        label: t('ButtonAddApiKey'),
        onClick: handleAddClick
      }}
    >
      <ApiKeysTable apiKeys={apiKeys} currentUser={currentUser} onEditClick={handleEditClick} />

      <EditApiKeyModal isOpen={isModalOpen} apiKey={editingApiKey} users={users} onClose={handleCloseModal} onSubmit={handleSubmit} />
    </SettingsContent>
  )
}
