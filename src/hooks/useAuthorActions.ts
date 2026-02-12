import {
  deleteAuthorAction,
  quickMatchAuthorAction,
  removeAuthorImageAction,
  submitAuthorImageAction,
  updateAuthorAction
} from '@/app/(main)/library/[library]/[entityType]/actions'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getProviderRegion } from '@/lib/providerUtils'
import { Author, AuthorQuickMatchPayload } from '@/types/api'
import { useCallback, useState } from 'react'

interface UseAuthorActionsProps {
  selectedAuthor: Author | null
  setSelectedAuthor: (author: Author | null) => void
  setIsModalOpen: (open: boolean) => void
}

export function useAuthorActions({ selectedAuthor, setSelectedAuthor, setIsModalOpen }: UseAuthorActionsProps) {
  const { library } = useLibrary()
  const libraryProvider = library.provider || 'audible'
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()

  const [quickMatchingAuthorIds, setQuickMatchingAuthorIds] = useState<Set<string>>(new Set())

  // Quick match author
  const handleQuickMatch = useCallback(
    async (author: Author, editedAuthor?: Partial<Author>): Promise<Author | null> => {
      setQuickMatchingAuthorIds((prev) => new Set([...prev, author.id]))
      try {
        // Build quick match payload
        const payload: AuthorQuickMatchPayload = {
          region: getProviderRegion(libraryProvider || 'audible')
        }
        if (editedAuthor?.asin) {
          payload.asin = editedAuthor.asin
        } else if (editedAuthor?.name) {
          payload.q = editedAuthor.name
        } else {
          payload.q = author.name
        }

        const resp = await quickMatchAuthorAction(author.id, payload)
        if (resp) {
          // Update selectedAuthor if it matches the quick matched author
          if (selectedAuthor?.id === author.id) {
            setSelectedAuthor(resp.author)
          }
          if (resp.updated) {
            if (resp.author.imagePath) {
              showToast(t('ToastAuthorUpdateSuccess'), { type: 'success' })
            } else {
              showToast(t('ToastAuthorUpdateSuccessNoImageFound'), { type: 'warning' })
            }
          } else {
            showToast(t('ToastNoUpdatesNecessary'))
          }
          return resp.author
        } else {
          showToast(t('ToastAuthorNotFound', { 0: author.name }), { type: 'warning' })
          return null
        }
      } finally {
        setQuickMatchingAuthorIds((prev) => {
          const next = new Set(prev)
          next.delete(author.id)
          return next
        })
      }
    },
    [libraryProvider, selectedAuthor?.id, setSelectedAuthor, showToast, t]
  )

  // Save/update author
  const handleSave = useCallback(
    async (editedAuthor: Partial<Author>) => {
      if (!selectedAuthor?.id) return

      const resp = await updateAuthorAction(selectedAuthor.id, editedAuthor)
      if (resp) {
        setIsModalOpen(false)
        setSelectedAuthor(resp.author)
        if (resp.updated) {
          showToast(t('ToastAuthorUpdateSuccess'), { type: 'success' })
        } else if (resp.merged) {
          showToast(t('ToastAuthorUpdateMerged'), { type: 'success' })
        } else {
          showToast(t('ToastNoUpdatesNecessary'))
        }
      } else {
        showToast(t('ToastAuthorNotFound', { 0: selectedAuthor?.name }), { type: 'warning' })
      }
    },
    [selectedAuthor, setIsModalOpen, setSelectedAuthor, showToast, t]
  )

  // Delete author
  const handleDelete = useCallback(async () => {
    if (!selectedAuthor?.id) return

    try {
      await deleteAuthorAction(selectedAuthor.id)
      showToast(t('ToastAuthorRemoveSuccess'), { type: 'success' })
    } catch (error) {
      console.error('Failed to remove author', error)
      showToast(t('ToastRemoveFailed'), { type: 'error' })
    }
    setIsModalOpen(false)
    setSelectedAuthor(null)
  }, [selectedAuthor, setIsModalOpen, setSelectedAuthor, showToast, t])

  // Submit author image
  const handleSubmitImage = useCallback(
    async (url: string) => {
      if (!selectedAuthor?.id) return

      try {
        const updatedAuthorResp = await submitAuthorImageAction(selectedAuthor.id, url)
        if (updatedAuthorResp.author) {
          setSelectedAuthor(updatedAuthorResp.author)
        }
        showToast(t('ToastAuthorUpdateSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to submit author image', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      }
    },
    [selectedAuthor, setSelectedAuthor, showToast, t]
  )

  // Remove author image
  const handleRemoveImage = useCallback(async () => {
    if (!selectedAuthor?.id) return

    try {
      const updatedAuthorResp = await removeAuthorImageAction(selectedAuthor.id)
      if (updatedAuthorResp.author) {
        setSelectedAuthor(updatedAuthorResp.author)
      }
      showToast(t('ToastAuthorImageRemoveSuccess'), { type: 'success' })
    } catch (error) {
      console.error('Failed to remove author image', error)
      showToast(t('ToastRemoveFailed'), { type: 'error' })
    }
  }, [selectedAuthor, setSelectedAuthor, showToast, t])

  return {
    quickMatchingAuthorIds,
    handleQuickMatch,
    handleSave,
    handleDelete,
    handleSubmitImage,
    handleRemoveImage
  }
}
