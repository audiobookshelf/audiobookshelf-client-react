'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import MediaIconPicker from '@/components/ui/MediaIconPicker'
import TextInput from '@/components/ui/TextInput'
import { useMetadata } from '@/contexts/MetadataContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface LibraryFormData {
  name: string
  mediaType: 'book' | 'podcast'
  icon: string
  provider: string
  folders: { fullPath: string }[]
}

const mediaTypeItems: DropdownItem[] = [
  { text: 'Books', value: 'book' },
  { text: 'Podcasts', value: 'podcast' }
]

const getInitialFormData = (library: Library | null): LibraryFormData => {
  if (library) {
    return {
      name: library.name,
      mediaType: library.mediaType,
      icon: library.icon || 'database',
      provider: library.provider || '',
      folders: library.folders?.map((f) => ({ fullPath: f.fullPath })) || []
    }
  }

  return {
    name: '',
    mediaType: 'book',
    icon: 'database',
    provider: '',
    folders: []
  }
}

interface LibraryEditModalProps {
  isOpen: boolean
  library: Library | null
  processing?: boolean
  onClose: () => void
  onSubmit: (formData: LibraryFormData) => void
}

export default function LibraryEditModal({ isOpen, library, processing = false, onClose, onSubmit }: LibraryEditModalProps) {
  const t = useTypeSafeTranslations()
  const { bookProviders, podcastProviders, ensureProvidersLoaded } = useMetadata()
  const [formData, setFormData] = useState<LibraryFormData>(getInitialFormData(library))
  const [newFolderPath, setNewFolderPath] = useState('')

  const isEditing = !!library

  // Load metadata providers when modal opens
  useEffect(() => {
    if (isOpen) {
      ensureProvidersLoaded()
    }
  }, [isOpen, ensureProvidersLoaded])

  // Reset form when modal opens or library changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(library))
      setNewFolderPath('')
    }
  }, [isOpen, library])

  // Get the appropriate providers based on media type
  const providers = useMemo(() => {
    return formData.mediaType === 'book' ? bookProviders : podcastProviders
  }, [formData.mediaType, bookProviders, podcastProviders])

  // Convert providers to dropdown items
  const providerItems: DropdownItem[] = useMemo(() => {
    return providers.map((p) => ({
      text: p.text,
      value: p.value
    }))
  }, [providers])

  // Auto-select first provider when media type changes or providers load
  useEffect(() => {
    if (providers.length > 0 && !isEditing) {
      // If the current provider is not in the list, select the first one
      const currentProviderValid = providers.some((p) => p.value === formData.provider)
      if (!currentProviderValid) {
        setFormData((prev) => ({ ...prev, provider: providers[0].value }))
      }
    }
  }, [providers, formData.provider, isEditing])

  // Handle media type change - also reset provider
  const handleMediaTypeChange = useCallback(
    (value: string | number) => {
      const mediaType = value as 'book' | 'podcast'
      const newProviders = mediaType === 'book' ? bookProviders : podcastProviders
      setFormData((prev) => ({
        ...prev,
        mediaType,
        provider: newProviders.length > 0 ? newProviders[0].value : ''
      }))
    },
    [bookProviders, podcastProviders]
  )

  // Remove a folder entry
  const handleRemoveFolder = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      folders: prev.folders.filter((_, i) => i !== index)
    }))
  }, [])

  // Commit the new folder path to the folders list
  const commitNewFolder = useCallback(() => {
    const trimmed = newFolderPath.trim()
    if (trimmed) {
      const existingFolder = formData.folders.find((f) => f.fullPath.trim() === trimmed)
      if (!existingFolder) {
        setFormData((prev) => ({
          ...prev,
          folders: [...prev.folders, { fullPath: trimmed }]
        }))
        setNewFolderPath('')
      }
    }
  }, [newFolderPath, formData.folders])

  // Handle Enter key in new folder input
  const handleNewFolderKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitNewFolder()
      }
    },
    [commitNewFolder]
  )

  // Check if form is valid
  const isValid = useMemo(() => {
    const hasName = formData.name.trim() !== ''
    const hasFolders = formData.folders.some((f) => f.fullPath.trim() !== '') || newFolderPath.trim() !== ''
    return hasName && hasFolders
  }, [formData.name, formData.folders, newFolderPath])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!isValid || processing) return

    // Include any pending new folder path that hasn't been committed yet (and is not already in the list)
    const trimmedNew = newFolderPath.trim()
    if (trimmedNew && !formData.folders.some((f) => f.fullPath.trim() === trimmedNew)) {
      onSubmit({
        ...formData,
        folders: [...formData.folders, { fullPath: trimmedNew }]
      })
    } else {
      onSubmit(formData)
    }
  }, [isValid, processing, formData, newFolderPath, onSubmit])

  const outerContentTitle = (
    <div className="absolute top-0 start-0 p-4">
      <h2 className="text-xl text-foreground">{isEditing ? t('HeaderUpdateLibrary') : t('HeaderNewLibrary')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle} className="w-[700px]">
      <div className="px-4 sm:px-8 py-8 max-h-[90vh] overflow-y-auto">
        {/* Top Row: Media Type, Library Name, Icon, Metadata Provider */}
        <div className="flex flex-wrap items-start gap-2">
          {/* Media Type */}
          <Dropdown
            label={t('LabelMediaType')}
            value={formData.mediaType}
            items={mediaTypeItems}
            disabled={isEditing}
            highlightSelected
            onChange={handleMediaTypeChange}
            className="w-full sm:w-36 shrink-0"
          />

          {/* Library Name */}
          <TextInput
            label={t('LabelLibraryName')}
            value={formData.name}
            placeholder={t('LabelLibraryName')}
            onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            className="w-full sm:flex-1"
          />

          {/* Icon */}
          <MediaIconPicker value={formData.icon} label={t('LabelIcon')} onChange={(value) => setFormData((prev) => ({ ...prev, icon: value }))} />

          {/* Metadata Provider */}
          <Dropdown
            label={t('LabelMetadataProvider')}
            value={formData.provider}
            items={providerItems}
            highlightSelected
            onChange={(value) => setFormData((prev) => ({ ...prev, provider: String(value) }))}
            className="flex-1 sm:w-44 sm:shrink-0"
          />
        </div>

        {/* Folders Section */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground-muted mb-2">{t('LabelFolders')}</h3>

          <div className="space-y-2">
            {/* Committed folder paths */}
            {formData.folders.map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="material-symbols fill text-yellow-200 text-xl">folder</span>
                <TextInput value={folder.fullPath} readOnly className="flex-1 text-sm" />
                <div className="w-5">
                  <button
                    type="button"
                    className="material-symbols text-foreground-muted hover:text-error text-xl cursor-pointer"
                    onClick={() => handleRemoveFolder(index)}
                    aria-label={t('ButtonRemove')}
                  >
                    close
                  </button>
                </div>
              </div>
            ))}

            {/* Always-visible new folder input */}
            <div className="flex items-center gap-2">
              <span className="material-symbols fill text-yellow-200/50 text-xl">create_new_folder</span>
              <TextInput
                value={newFolderPath}
                placeholder={t('PlaceholderNewFolderPath')}
                onChange={setNewFolderPath}
                onBlur={commitNewFolder}
                onKeyDown={handleNewFolderKeyDown}
                className="flex-1 text-sm"
              />
              {formData.folders.length > 0 && <div className="w-5"></div>}
            </div>
          </div>

          {/* Browse for Folder button */}
          <Btn
            color="bg-primary"
            disabled
            className="w-full mt-3"
            onClick={() => {
              // TODO: Implement folder browser
            }}
          >
            {t('ButtonBrowseForFolder')}
          </Btn>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end mt-6">
          <Btn color="bg-success" disabled={!isValid} loading={processing} onClick={handleSubmit}>
            {isEditing ? t('ButtonSave') : t('ButtonCreate')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
