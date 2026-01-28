'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiKey, User, UserLoginResponse } from '@/types/api'
import { useCallback, useState } from 'react'
import SettingsContent from '../SettingsContent'
import { createApiKey, updateApiKey } from './actions'
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
    async (formData: ApiKeyFormData) => {
      const payload = {
        name: formData.name,
        expiresIn: formData.expiresIn,
        isActive: formData.isActive,
        userId: formData.userId
      }

      if (editingApiKey) {
        await updateApiKey(editingApiKey.id, payload)
      } else {
        await createApiKey(payload)
        // TODO: Show the new API key
      }

      handleCloseModal()
    },
    [editingApiKey, handleCloseModal]
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
