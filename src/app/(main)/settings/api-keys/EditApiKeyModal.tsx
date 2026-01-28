'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import TextInput from '@/components/ui/TextInput'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiKey, User } from '@/types/api'
import { useEffect, useMemo, useState } from 'react'

interface ApiKeyFormData {
  name: string
  expiresIn: number | undefined
  isActive: boolean
  userId: string
}

const getInitialFormData = (apiKey: ApiKey | null): ApiKeyFormData => {
  if (apiKey) {
    return {
      name: apiKey.name,
      expiresIn: undefined,
      isActive: apiKey.isActive,
      userId: apiKey.userId
    }
  }

  return {
    name: '',
    expiresIn: undefined,
    isActive: true,
    userId: ''
  }
}

interface EditApiKeyModalProps {
  isOpen: boolean
  apiKey: ApiKey | null
  users: User[]
  onClose: () => void
  onSubmit: (formData: ApiKeyFormData) => void
}

export default function EditApiKeyModal({ isOpen, apiKey, users, onClose, onSubmit }: EditApiKeyModalProps) {
  const t = useTypeSafeTranslations()
  const [formData, setFormData] = useState<ApiKeyFormData>(getInitialFormData(apiKey))
  const [expiresInSeconds, setExpiresInSeconds] = useState<string | undefined>(undefined)

  const isEditing = !!apiKey

  // Check if the API key is expired
  const isExpired = useMemo(() => {
    if (!apiKey?.expiresAt) return false
    return new Date(apiKey.expiresAt) < new Date()
  }, [apiKey])

  // Reset form when modal opens or apiKey changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(apiKey))
      setExpiresInSeconds(undefined)
    }
  }, [isOpen, apiKey])

  // Check if form has required fields
  const isValid = formData.name.trim() !== '' && formData.userId !== ''

  // Check if form data has changed from the original API key
  const hasChanges = useMemo(() => {
    if (!apiKey) return true
    return formData.isActive !== apiKey.isActive || formData.userId !== apiKey.userId
  }, [apiKey, formData.isActive, formData.userId])

  const handleSubmit = () => {
    if (!isValid) return

    if (!hasChanges) {
      onClose()
      return
    }

    if (expiresInSeconds) {
      formData.expiresIn = parseInt(expiresInSeconds)
    }
    onSubmit(formData)
  }

  // Convert users to dropdown items with username:type format
  const userItems: DropdownItem[] = useMemo(() => {
    return users.map((user) => ({
      text: user.username,
      subtext: user.type,
      value: user.id
    }))
  }, [users])

  const outerContentTitle = (
    <div className="absolute top-0 start-0 p-4">
      <h2 className="text-xl text-foreground">{isEditing ? t('HeaderUpdateApiKey') : t('HeaderNewApiKey')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle} className="w-[700px]">
      <div className="px-4 sm:px-8 py-8 max-h-[90vh] overflow-y-auto">
        {/* Name and Expires In Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Name */}
          <TextInput
            label={t('LabelName')}
            value={formData.name}
            placeholder={t('LabelName')}
            readOnly={isEditing}
            onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
          />

          {/* Expires In (seconds) - Hidden when editing */}
          {!isEditing && (
            <TextInput
              label={t('LabelExpiresInSeconds')}
              value={expiresInSeconds}
              placeholder={t('LabelExpiresInSeconds')}
              type="number"
              min="0"
              onChange={(value) => setExpiresInSeconds(value)}
            />
          )}
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center gap-4 mt-4">
          <ToggleSwitch
            value={formData.isActive}
            label={t('LabelEnable')}
            disabled={isExpired}
            onChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
          />
          {isExpired && <span className="text-error text-sm">{t('LabelExpired')}</span>}
        </div>

        {/* Act on behalf of user Section */}
        <div className="border-t border-border mt-4 pt-4">
          <h3 className="text-lg font-semibold mb-2">{t('LabelApiKeyUser')}</h3>
          <p className="text-foreground-muted text-sm mb-4">{t('LabelApiKeyUserDescription')}</p>

          <Dropdown
            value={formData.userId}
            items={userItems}
            disabled={isExpired}
            highlightSelected
            displayText={formData.userId ? undefined : t('LabelSelectUser')}
            onChange={(value) => setFormData((prev) => ({ ...prev, userId: String(value) }))}
          />
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border mt-4 pt-4 flex items-center justify-end">
          <Btn color="bg-success" disabled={!isValid} onClick={handleSubmit}>
            {t('ButtonSubmit')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

export type { ApiKeyFormData }
