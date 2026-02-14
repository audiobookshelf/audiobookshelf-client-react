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

export function useAuthorActions() {
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
    [libraryProvider, showToast, t]
  )

  // Save/update author
  const handleSave = useCallback(
    async (authorId: string, authorName: string, editedAuthor: Partial<Author>): Promise<boolean> => {
      if (!authorId) return false

      const resp = await updateAuthorAction(authorId, editedAuthor)
      if (resp) {
        if (resp.updated) {
          showToast(t('ToastAuthorUpdateSuccess'), { type: 'success' })
        } else if (resp.merged) {
          showToast(t('ToastAuthorUpdateMerged'), { type: 'success' })
        } else {
          showToast(t('ToastNoUpdatesNecessary'))
        }
        return true
      } else {
        showToast(t('ToastAuthorNotFound', { 0: authorName }), { type: 'warning' })
        return false
      }
    },
    [showToast, t]
  )

  // Delete author
  const handleDelete = useCallback(
    async (authorId: string): Promise<boolean> => {
      if (!authorId) return false

      try {
        await deleteAuthorAction(authorId)
        showToast(t('ToastAuthorRemoveSuccess'), { type: 'success' })
        return true
      } catch (error) {
        console.error('Failed to remove author', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
        return false
      }
    },
    [showToast, t]
  )

  // Submit author image
  const handleSubmitImage = useCallback(
    async (authorId: string, url: string) => {
      if (!authorId) return

      try {
        await submitAuthorImageAction(authorId, url)
        showToast(t('ToastAuthorUpdateSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to submit author image', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      }
    },
    [showToast, t]
  )

  // Remove author image
  const handleRemoveImage = useCallback(
    async (authorId: string) => {
      if (!authorId) return

      try {
        await removeAuthorImageAction(authorId)
        showToast(t('ToastAuthorImageRemoveSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to remove author image', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      }
    },
    [showToast, t]
  )

  return {
    quickMatchingAuthorIds,
    handleQuickMatch,
    handleSave,
    handleDelete,
    handleSubmitImage,
    handleRemoveImage
  }
}
