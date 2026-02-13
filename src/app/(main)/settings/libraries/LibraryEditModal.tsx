'use client'

import TabbedModal from '@/components/modals/TabbedModal'
import Btn from '@/components/ui/Btn'
import { DropdownItem } from '@/components/ui/Dropdown'
import { useMetadata } from '@/contexts/MetadataContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'
import LibraryDetailsTab from './LibraryDetailsTab'
import LibraryScannerTab from './LibraryScannerTab'
import LibraryScheduleTab from './LibraryScheduleTab'
import LibrarySettingsTab from './LibrarySettingsTab'

export interface LibraryFormData {
  name: string
  mediaType: 'book' | 'podcast'
  icon: string
  provider: string
  folders: { fullPath: string }[]
}

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
  const [showFolderChooser, setShowFolderChooser] = useState(false)
  const [selectedTab, setSelectedTab] = useState('details')

  const tabs = [
    { id: 'details', label: t('HeaderDetails') },
    { id: 'settings', label: t('HeaderSettings') },
    { id: 'scanner', label: t('HeaderSettingsScanner') },
    { id: 'schedule', label: t('HeaderSchedule') }
  ]

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
      setShowFolderChooser(false)
      setSelectedTab('details')
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

  // Handle folder selection from FolderChooser
  const handleFolderSelected = useCallback(
    (folderPath: string) => {
      const trimmed = folderPath.trim()
      if (trimmed && !formData.folders.some((f) => f.fullPath.trim() === trimmed)) {
        setFormData((prev) => ({
          ...prev,
          folders: [...prev.folders, { fullPath: trimmed }]
        }))
      }
      setShowFolderChooser(false)
    },
    [formData.folders]
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
    <TabbedModal
      isOpen={isOpen}
      onClose={onClose}
      outerContent={outerContentTitle}
      tabs={tabs}
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
      className="w-[700px]"
      contentClassName="relative px-4 sm:px-8 py-6 max-h-[70vh] min-h-[400px] overflow-y-auto"
      footer={
        <div className="flex items-center justify-end">
          <Btn disabled={!isValid} loading={processing} onClick={handleSubmit}>
            {isEditing ? t('ButtonSave') : t('ButtonCreate')}
          </Btn>
        </div>
      }
    >
      {selectedTab === 'details' && (
        <LibraryDetailsTab
          formData={formData}
          isEditing={isEditing}
          providerItems={providerItems}
          newFolderPath={newFolderPath}
          showFolderChooser={showFolderChooser}
          onFormDataChange={setFormData}
          onMediaTypeChange={handleMediaTypeChange}
          onNewFolderPathChange={setNewFolderPath}
          onCommitNewFolder={commitNewFolder}
          onNewFolderKeyDown={handleNewFolderKeyDown}
          onRemoveFolder={handleRemoveFolder}
          onFolderSelected={handleFolderSelected}
          onShowFolderChooser={() => setShowFolderChooser(true)}
          onHideFolderChooser={() => setShowFolderChooser(false)}
        />
      )}
      {selectedTab === 'settings' && <LibrarySettingsTab />}
      {selectedTab === 'scanner' && <LibraryScannerTab />}
      {selectedTab === 'schedule' && <LibraryScheduleTab />}
    </TabbedModal>
  )
}
