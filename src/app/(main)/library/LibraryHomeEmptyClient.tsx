'use client'

import Btn from '@/components/ui/Btn'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { createLibrary } from '../settings/libraries/actions'
import LibraryEditModal, { LibraryFormData } from '../settings/libraries/LibraryEditModal'

export default function LibraryHomeEmptyClient() {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { userIsAdminOrUp } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handleSubmit = useCallback(
    (formData: LibraryFormData) => {
      startTransition(async () => {
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

          const created = await createLibrary(payload)
          setIsModalOpen(false)
          router.push(`/library/${created.id}`)
        } catch (error) {
          console.error('Failed to create library:', error)
        }
      })
    },
    [router]
  )

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-10">
        {userIsAdminOrUp ? (
          <>
            <p className="mb-2 max-w-lg text-center text-xl">{t('MessageNoLibrariesYet')}</p>
            <Btn color="bg-success" onClick={handleOpenModal} disabled={isPending}>
              {t('ButtonAddYourFirstLibrary')}
            </Btn>
          </>
        ) : (
          <p className="mb-2 max-w-lg text-center text-xl">{t('MessageNoLibrariesAvailable')}</p>
        )}
      </div>

      {userIsAdminOrUp && <LibraryEditModal isOpen={isModalOpen} library={null} processing={isPending} onClose={handleCloseModal} onSubmit={handleSubmit} />}
    </>
  )
}
