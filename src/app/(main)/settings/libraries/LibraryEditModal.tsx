'use client'

import TabbedModal from '@/components/modals/TabbedModal'
import Btn from '@/components/ui/Btn'
import { DropdownItem } from '@/components/ui/Dropdown'
import { useMetadata } from '@/contexts/MetadataContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library, LibrarySettings } from '@/types/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import LibraryDetailsTab from './LibraryDetailsTab'
import LibraryScannerTab from './LibraryScannerTab'
import LibraryScheduleTab from './LibraryScheduleTab'
import LibrarySettingsTab from './LibrarySettingsTab'

export interface LibraryFormData {
  name: string
  mediaType: 'book' | 'podcast'
  icon: string
  provider: string
  folders: { id?: string; fullPath: string }[]
  settings: LibrarySettings
}

const defaultLibrarySettings: LibrarySettings = {
  coverAspectRatio: 1,
  disableWatcher: false,
  skipMatchingMediaWithAsin: false,
  skipMatchingMediaWithIsbn: false,
  audiobooksOnly: false,
  hideSingleBookSeries: false,
  onlyShowLaterBooksInContinueSeries: false,
  epubsAllowScriptedContent: false,
  markAsFinishedTimeRemaining: 30,
  markAsFinishedPercentComplete: null
}

const getInitialFormData = (library: Library | null): LibraryFormData => {
  if (library) {
    return {
      name: library.name,
      mediaType: library.mediaType,
      icon: library.icon || 'database',
      provider: library.provider || '',
      folders: library.folders?.map((f) => ({ id: f.id, fullPath: f.fullPath })) || [],
      settings: { ...defaultLibrarySettings, ...library.settings }
    }
  }

  return {
    name: '',
    mediaType: 'book',
    icon: 'database',
    provider: '',
    folders: [],
    settings: { ...defaultLibrarySettings }
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
  const initialFormDataRef = useRef<string>('')

  const isEditing = !!library

  const tabs = useMemo(() => {
    return [
      { id: 'details', label: t('HeaderDetails') },
      { id: 'settings', label: t('HeaderSettings') },
      ...(formData.mediaType === 'book' ? [{ id: 'scanner', label: t('HeaderSettingsScanner') }] : []),
      { id: 'schedule', label: t('HeaderSchedule') }
    ]
  }, [formData.mediaType, t])

  // Load metadata providers when modal opens
  useEffect(() => {
    if (isOpen) {
      ensureProvidersLoaded()
    }
  }, [isOpen, ensureProvidersLoaded])

  // Reset form when modal opens or library changes
  useEffect(() => {
    if (isOpen) {
      const initial = getInitialFormData(library)
      initialFormDataRef.current = JSON.stringify(initial)
      setFormData(initial)
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

  const handleMediaTypeChange = (value: string | number) => {
    const mediaType = value as 'book' | 'podcast'
    const newProviders = mediaType === 'book' ? bookProviders : podcastProviders
    setFormData((prev) => ({
      ...prev,
      mediaType,
      provider: newProviders.length > 0 ? newProviders[0].value : ''
    }))
  }

  const handleRemoveFolder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      folders: prev.folders.filter((_, i) => i !== index)
    }))
  }

  const commitNewFolder = () => {
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
  }

  const handleNewFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitNewFolder()
    }
  }

  const handleFolderSelected = (folderPath: string) => {
    const trimmed = folderPath.trim()
    if (trimmed && !formData.folders.some((f) => f.fullPath.trim() === trimmed)) {
      setFormData((prev) => ({
        ...prev,
        folders: [...prev.folders, { fullPath: trimmed }]
      }))
    }
    setShowFolderChooser(false)
  }

  // Check if form is valid
  const isValid = useMemo(() => {
    const hasName = formData.name.trim() !== ''
    const hasFolders = formData.folders.some((f) => f.fullPath.trim() !== '') || newFolderPath.trim() !== ''
    return hasName && hasFolders
  }, [formData.name, formData.folders, newFolderPath])

  const hasChanges = useMemo(() => {
    if (!isEditing) return true
    const trimmedNew = newFolderPath.trim()
    if (trimmedNew && !formData.folders.some((f) => f.fullPath.trim() === trimmedNew)) return true
    return JSON.stringify(formData) !== initialFormDataRef.current
  }, [formData, isEditing, newFolderPath])

  const handleSubmit = () => {
    if (!isValid || !hasChanges || processing) return

    const trimmedNew = newFolderPath.trim()
    if (trimmedNew && !formData.folders.some((f) => f.fullPath.trim() === trimmedNew)) {
      onSubmit({
        ...formData,
        folders: [...formData.folders, { fullPath: trimmedNew }]
      })
    } else {
      onSubmit(formData)
    }
  }

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
      contentClassName="relative px-4 sm:px-6 py-6 max-h-[70vh] min-h-[440px] overflow-y-auto"
      footer={
        <div className="flex items-center justify-end">
          <Btn disabled={!isValid || !hasChanges} loading={processing} onClick={handleSubmit}>
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
      {selectedTab === 'settings' && (
        <LibrarySettingsTab
          settings={formData.settings}
          mediaType={formData.mediaType}
          onSettingsChange={(updater) => setFormData((prev) => ({ ...prev, settings: updater(prev.settings) }))}
        />
      )}
      {selectedTab === 'scanner' && (
        <LibraryScannerTab
          settings={formData.settings}
          onSettingsChange={(updater) => setFormData((prev) => ({ ...prev, settings: updater(prev.settings) }))}
        />
      )}
      {selectedTab === 'schedule' && (
        <LibraryScheduleTab
          settings={formData.settings}
          onSettingsChange={(updater) => setFormData((prev) => ({ ...prev, settings: updater(prev.settings) }))}
        />
      )}
    </TabbedModal>
  )
}
