import { quickMatchAuthorAction } from '@/app/(main)/library/[library]/[entityType]/actions'
import { fetchAuthorsAction } from '@/app/actions/libraryActions'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { buildAuthorQuickMatchPayload } from '@/hooks/useAuthorActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback, useRef } from 'react'

export function useMatchAllAuthors() {
  const { library, authorSortBy, authorSortDesc, setAuthorQuickMatching, isMatchingAllAuthors, setIsMatchingAllAuthors } = useLibrary()
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()
  // Synchronous guard: context state updates are async, so rapid menu clicks could otherwise start twice.
  const isRunningRef = useRef(false)

  const matchAllAuthors = useCallback(async () => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    setIsMatchingAllAuthors(true)

    try {
      const query = `sort=${encodeURIComponent(authorSortBy)}&desc=${authorSortDesc ? '1' : '0'}`
      const { authors = [] } = await fetchAuthorsAction(library.id, query)

      for (const author of authors) {
        const payload = buildAuthorQuickMatchPayload(author, library.provider)

        setAuthorQuickMatching(author.id, true)
        try {
          const resp = await quickMatchAuthorAction(author.id, payload).catch((error) => {
            console.error('Failed to quick match author', error)
            return null
          })
          if (!resp) {
            showToast(t('ToastAuthorNotFound', { 0: author.name }), { type: 'warning' })
          }
        } finally {
          setAuthorQuickMatching(author.id, false)
        }
      }
    } catch (error) {
      console.error('Failed to match all authors', error)
      showToast(t('ToastMatchAllAuthorsFailed'), { type: 'error' })
    } finally {
      isRunningRef.current = false
      setIsMatchingAllAuthors(false)
    }
  }, [authorSortBy, authorSortDesc, library.id, library.provider, setAuthorQuickMatching, setIsMatchingAllAuthors, showToast, t])

  return { matchAllAuthors, isMatchingAllAuthors }
}
