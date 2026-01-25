'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import TextInput from '@/components/ui/TextInput'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { User, UserPermissions } from '@/types/api'
import { useEffect, useState } from 'react'

interface UserFormData {
  username: string
  email: string
  password: string
  type: 'admin' | 'user' | 'guest'
  isActive: boolean
  permissions: UserPermissions
  librariesAccessible: string[]
  itemTagsSelected: string[]
}

const defaultPermissions: UserPermissions = {
  download: true,
  update: false,
  delete: false,
  upload: false,
  createEreader: false,
  accessAllLibraries: true,
  accessAllTags: true,
  accessExplicitContent: false,
  selectedTagsNotAccessible: false
}

const getInitialFormData = (user: User | null): UserFormData => {
  if (user) {
    return {
      username: user.username,
      email: user.email || '',
      password: '',
      type: user.type === 'root' ? 'admin' : user.type,
      isActive: user.isActive,
      permissions: { ...user.permissions },
      librariesAccessible: user.librariesAccessible,
      itemTagsSelected: user.itemTagsSelected
    }
  }

  return {
    username: '',
    email: '',
    password: '',
    type: 'user',
    isActive: true,
    permissions: { ...defaultPermissions },
    librariesAccessible: [],
    itemTagsSelected: []
  }
}

interface UserAccountModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onSubmit: (formData: UserFormData) => void
  onUnlinkOpenId?: () => void
}

export default function UserAccountModal({ isOpen, user, onClose, onSubmit, onUnlinkOpenId }: UserAccountModalProps) {
  const t = useTypeSafeTranslations()
  const [formData, setFormData] = useState<UserFormData>(getInitialFormData(user))
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)

  const isEditing = !!user
  const isRootUser = user?.type === 'root'

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(user))
      setShowUnlinkConfirm(false)
    }
  }, [isOpen, user])

  const handleSubmit = () => {
    onSubmit(formData)
  }

  const handleUnlinkOpenIdClick = () => {
    setShowUnlinkConfirm(true)
  }

  const handleConfirmUnlinkOpenId = () => {
    setShowUnlinkConfirm(false)
    onUnlinkOpenId?.()
  }

  const updatePermission = (key: keyof UserPermissions, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }))
  }

  const accountTypeItems = [
    { text: t('LabelAccountTypeAdmin'), value: 'admin' },
    { text: t('LabelAccountTypeUser'), value: 'user' },
    { text: t('LabelAccountTypeGuest'), value: 'guest' }
  ]

  const permissionsList: { key: keyof UserPermissions; label: string }[] = [
    { key: 'download', label: t('LabelPermissionsDownload') },
    { key: 'update', label: t('LabelPermissionsUpdate') },
    { key: 'delete', label: t('LabelPermissionsDelete') },
    { key: 'upload', label: t('LabelPermissionsUpload') },
    { key: 'createEreader', label: t('LabelPermissionsCreateEreader') },
    { key: 'accessExplicitContent', label: t('LabelPermissionsAccessExplicitContent') },
    { key: 'accessAllLibraries', label: t('LabelPermissionsAccessAllLibraries') },
    { key: 'accessAllTags', label: t('LabelPermissionsAccessAllTags') }
  ]

  const outerContentTitle = (
    <div className="absolute top-0 start-0 p-4">
      <h2 className="text-xl text-foreground">{isEditing ? t('HeaderUpdateAccount') : t('HeaderNewAccount')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle}>
      <div className="px-4 sm:px-8 py-8 max-h-[90vh] overflow-y-auto">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Username */}
          <TextInput
            label={t('LabelUsername')}
            value={formData.username}
            placeholder={t('LabelUsername')}
            onChange={(value) => setFormData((prev) => ({ ...prev, username: value }))}
          />

          {/* Change Password */}
          {!isRootUser && (
            <TextInput
              label={t('LabelChangePassword')}
              type="password"
              value={formData.password}
              placeholder={t('LabelChangePassword')}
              onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
            />
          )}

          {/* Email */}
          <TextInput
            label={t('LabelEmail')}
            type="email"
            value={formData.email}
            placeholder={t('LabelEmail')}
            onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
          />

          {/* Account Type & Enable */}
          {!isRootUser && (
            <div className="flex items-end gap-4">
              <Dropdown
                label={t('LabelAccountType')}
                value={formData.type}
                items={accountTypeItems}
                highlightSelected
                onChange={(value) => setFormData((prev) => ({ ...prev, type: value as 'admin' | 'user' | 'guest' }))}
                className="flex-1"
              />

              <ToggleSwitch value={formData.isActive} label={t('LabelEnable')} onChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))} />
            </div>
          )}
        </div>

        {/* Permissions Section */}
        {!isRootUser && (
          <>
            <div className="border-t border-border mt-6 pt-6">
              <h3 className="text-lg font-semibold mb-4">{t('HeaderPermissions')}</h3>
              <div>
                {permissionsList.map(({ key, label }) => (
                  <ToggleSwitch
                    key={key}
                    value={formData.permissions[key]}
                    label={label}
                    className="h-fit"
                    onChange={(value) => updatePermission(key, value)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="border-t border-border mt-6 pt-6 flex items-center justify-end gap-4">
          {/* Unlink OpenID button */}
          {isEditing && user?.hasOpenIDLink && (
            <Btn onClick={handleUnlinkOpenIdClick} className="mr-auto">
              {t('ButtonUnlinkOpenId')}
            </Btn>
          )}

          <Btn color="bg-success" onClick={handleSubmit}>
            {t('ButtonSubmit')}
          </Btn>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showUnlinkConfirm}
        message={t('MessageConfirmUnlinkOpenId')}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleConfirmUnlinkOpenId}
      />
    </Modal>
  )
}

export type { UserFormData }
