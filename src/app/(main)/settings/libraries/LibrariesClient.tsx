'use client'

import { useLibraries } from '@/contexts/LibrariesContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'
import SettingsContent from '../SettingsContent'
import { SETTINGS_MORE_INFO_URLS } from '../settingsNavItems'
import { createLibrary, editLibrary, saveLibraryOrder } from './actions'
import LibrariesList from './LibrariesList'
import LibraryEditModal, { LibraryFormData } from './LibraryEditModal'

interface LibraryClientProps {
  libraries: Library[]
}

export default function LibrariesClient({ libraries }: LibraryClientProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { setLibraries } = useLibraries()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setLibraries(libraries)
  }, [libraries, setLibraries])

  const handleAddLibrary = useCallback(() => {
    setEditingLibrary(null)
    setIsModalOpen(true)
  }, [])

  const handleEditLibrary = useCallback((library: Library) => {
    setEditingLibrary(library)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingLibrary(null)
  }, [])

  const handleSubmit = useCallback(
    async (formData: LibraryFormData) => {
      setIsProcessing(true)
      try {
        const validFolders = formData.folders.filter((f) => f.fullPath.trim() !== '')

        const payload = {
          name: formData.name,
          mediaType: formData.mediaType,
          icon: formData.icon,
          provider: formData.provider,
          folders: validFolders,
          settings: formData.settings
        } as Library

        if (editingLibrary) {
          await editLibrary(editingLibrary.id, payload)
        } else {
          await createLibrary(payload)
        }

        handleCloseModal()
      } catch (error) {
        console.error('Failed to save library:', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      } finally {
        setIsProcessing(false)
      }
    },
    [editingLibrary, handleCloseModal, showToast, t]
  )

  return (
    <>
      <SettingsContent
        title={t('HeaderLibraries')}
        addButton={{
          label: t('ButtonAddLibrary'),
          onClick: handleAddLibrary
        }}
        moreInfoUrl={SETTINGS_MORE_INFO_URLS.libraries}
      >
        <LibrariesList libraries={libraries} saveLibraryOrderAction={saveLibraryOrder} onEditLibrary={handleEditLibrary} onAddLibrary={handleAddLibrary} />
      </SettingsContent>

      <LibraryEditModal isOpen={isModalOpen} library={editingLibrary} processing={isProcessing} onClose={handleCloseModal} onSubmit={handleSubmit} />
    </>
  )
}
