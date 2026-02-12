'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import { MultiSelect, MultiSelectItem } from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library, User, UserPermissions } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'
import { fetchLibraries, fetchTags } from './actions'

type AccountType = 'admin' | 'user' | 'guest'

interface UserFormData {
  username: string
  email: string
  password: string
  type: AccountType
  isActive: boolean
  permissions: UserPermissions
  librariesAccessible: string[]
  itemTagsSelected: string[]
}

const getDefaultPermissions = (type: AccountType): UserPermissions => {
  const permissions: UserPermissions = {
    download: type !== 'guest',
    update: type === 'admin',
    delete: type === 'admin',
    upload: type === 'admin',
    accessExplicitContent: type === 'admin',
    accessAllLibraries: true,
    accessAllTags: true,
    selectedTagsNotAccessible: false,
    createEreader: type === 'admin'
  }
  return permissions
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
    permissions: { ...getDefaultPermissions('user') },
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

  // Available libraries and tags for multi-selects
  const [availableLibraries, setAvailableLibraries] = useState<Library[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [librariesLoaded, setLibrariesLoaded] = useState(false)
  const [tagsLoaded, setTagsLoaded] = useState(false)

  const isEditing = !!user
  const isRootUser = user?.type === 'root'

  // Load libraries when needed
  const loadLibraries = useCallback(async () => {
    if (librariesLoaded) return
    setLibrariesLoaded(true)
    try {
      const libraries = await fetchLibraries()
      setAvailableLibraries(libraries)
    } catch (error) {
      console.error('Failed to fetch libraries:', error)
      setLibrariesLoaded(false) // Allow retry on error
    }
  }, [librariesLoaded])

  // Load tags when needed
  const loadTags = useCallback(async () => {
    if (tagsLoaded) return
    setTagsLoaded(true)
    try {
      const tags = await fetchTags()
      setAvailableTags(tags)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      setTagsLoaded(false) // Allow retry on error
    }
  }, [tagsLoaded])

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(user))
      setShowUnlinkConfirm(false)
    }
  }, [isOpen, user])

  // Load libraries/tags when modal opens if user doesn't have access to all
  useEffect(() => {
    if (isOpen && user) {
      if (!user.permissions.accessAllLibraries) {
        loadLibraries()
      }
      if (!user.permissions.accessAllTags) {
        loadTags()
      }
    }
  }, [isOpen, user, loadLibraries, loadTags])

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

  const handleAccountTypeChange = (value: AccountType) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
      permissions: { ...getDefaultPermissions(value) }
    }))
  }

  const updatePermission = (key: keyof UserPermissions, value: boolean) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        permissions: {
          ...prev.permissions,
          [key]: value
        }
      }

      // When enabling "access all", clear the corresponding selection array
      if (key === 'accessAllLibraries' && value) {
        newFormData.librariesAccessible = []
      }
      if (key === 'accessAllTags' && value) {
        newFormData.itemTagsSelected = []
        newFormData.permissions.selectedTagsNotAccessible = false
      }

      return newFormData
    })

    // When disabling "access all", load the data if not already loaded
    if (key === 'accessAllLibraries' && !value) {
      loadLibraries()
    }
    if (key === 'accessAllTags' && !value) {
      loadTags()
    }
  }

  // Convert libraries to multi-select items
  const libraryItems: MultiSelectItem<string>[] = availableLibraries.map((lib) => ({
    value: lib.id,
    content: lib.name
  }))

  const selectedLibraryItems: MultiSelectItem<string>[] = formData.librariesAccessible
    .map((libId) => {
      const lib = availableLibraries.find((l) => l.id === libId)
      return lib ? { value: lib.id, content: lib.name } : null
    })
    .filter((item): item is MultiSelectItem<string> => item !== null)

  // Convert tags to multi-select items
  const tagItems: MultiSelectItem<string>[] = availableTags.map((tag) => ({
    value: tag,
    content: tag
  }))

  const selectedTagItems: MultiSelectItem<string>[] = formData.itemTagsSelected.map((tag) => ({
    value: tag,
    content: tag
  }))

  const accountTypeItems = [
    { text: t('LabelAccountTypeAdmin'), value: 'admin' },
    { text: t('LabelAccountTypeUser'), value: 'user' },
    { text: t('LabelAccountTypeGuest'), value: 'guest' }
  ]

  // Basic permissions (without access all libraries/tags)
  const basicPermissionsList: { key: keyof UserPermissions; label: string }[] = [
    { key: 'download', label: t('LabelPermissionsDownload') },
    { key: 'update', label: t('LabelPermissionsUpdate') },
    { key: 'delete', label: t('LabelPermissionsDelete') },
    { key: 'upload', label: t('LabelPermissionsUpload') },
    { key: 'createEreader', label: t('LabelPermissionsCreateEreader') },
    { key: 'accessExplicitContent', label: t('LabelPermissionsAccessExplicitContent') }
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
              label={isEditing ? t('LabelChangePassword') : t('LabelPassword')}
              type="password"
              value={formData.password}
              placeholder={isEditing ? t('LabelChangePassword') : t('LabelPassword')}
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
                onChange={(value) => handleAccountTypeChange(value as AccountType)}
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
                {basicPermissionsList.map(({ key, label }) => (
                  <ToggleSwitch
                    key={key}
                    value={formData.permissions[key]}
                    label={label}
                    className="h-fit"
                    onChange={(value) => updatePermission(key, value)}
                  />
                ))}

                {/* Can Access All Libraries */}
                <ToggleSwitch
                  value={formData.permissions.accessAllLibraries}
                  label={t('LabelPermissionsAccessAllLibraries')}
                  className="h-fit"
                  onChange={(value) => updatePermission('accessAllLibraries', value)}
                />

                {/* Libraries Accessible to User (shown when accessAllLibraries is false) */}
                {!formData.permissions.accessAllLibraries && (
                  <div className="mt-3 mb-4 ml-4">
                    <MultiSelect
                      label={t('LabelLibrariesAccessibleToUser')}
                      items={libraryItems}
                      selectedItems={selectedLibraryItems}
                      allowNew={false}
                      showEdit={false}
                      onItemAdded={(item) => {
                        setFormData((prev) => ({
                          ...prev,
                          librariesAccessible: [...prev.librariesAccessible, item.value]
                        }))
                      }}
                      onItemRemoved={(item) => {
                        setFormData((prev) => ({
                          ...prev,
                          librariesAccessible: prev.librariesAccessible.filter((id) => id !== item.value)
                        }))
                      }}
                    />
                  </div>
                )}

                {/* Can Access All Tags */}
                <ToggleSwitch
                  value={formData.permissions.accessAllTags}
                  label={t('LabelPermissionsAccessAllTags')}
                  className="h-fit"
                  onChange={(value) => updatePermission('accessAllTags', value)}
                />

                {/* Tags Accessible to User (shown when accessAllTags is false) */}
                {!formData.permissions.accessAllTags && (
                  <div className="mt-3 mb-4 ml-4">
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <MultiSelect
                          label={formData.permissions.selectedTagsNotAccessible ? t('LabelTagsNotAccessibleToUser') : t('LabelTagsAccessibleToUser')}
                          items={tagItems}
                          selectedItems={selectedTagItems}
                          allowNew={false}
                          showEdit={false}
                          onItemAdded={(item) => {
                            setFormData((prev) => ({
                              ...prev,
                              itemTagsSelected: [...prev.itemTagsSelected, item.value]
                            }))
                          }}
                          onItemRemoved={(item) => {
                            setFormData((prev) => ({
                              ...prev,
                              itemTagsSelected: prev.itemTagsSelected.filter((tag) => tag !== item.value)
                            }))
                          }}
                        />
                      </div>
                      <ToggleSwitch
                        value={formData.permissions.selectedTagsNotAccessible}
                        label={t('LabelInvert')}
                        onChange={(value) => updatePermission('selectedTagsNotAccessible', value)}
                      />
                    </div>
                  </div>
                )}
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
