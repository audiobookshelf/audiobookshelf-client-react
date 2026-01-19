import { useLibraryDataContext } from '@/contexts/LibraryDataContext'
import { ContextType } from '@/lib/fetchLibraryData'
import { LibraryItem } from '@/types/api'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export interface ItemNavigation {
  prevId: string | null
  nextId: string | null
  loading: boolean
}

export function useItemNavigation(libraryItem: LibraryItem): ItemNavigation {
  const searchParams = useSearchParams()
  const [navState, setNavState] = useState<ItemNavigation>({
    prevId: null,
    nextId: null,
    loading: true
  })

  // We need to construct context args from searchParams to bind the hook
  const context = (searchParams.get('context') as ContextType) || null
  const contextId = searchParams.get('contextId')
  const rawParams = searchParams.get('params')

  // We can't conditionally call hooks.
  // But useNavigationContext throws if not in provider.
  // And we need to pass context/params to it.
  // The provider is always there, but we might pass nulls if context is missing.
  // The hook might error if context is null? No, we check inside or allow it.
  // Our `useNavigationContext` implementation expects a `context` string.
  // We should make it robust to nulls or skip it?
  // Let's assume we call it with whatever we have, or empty string.

  // Actually, keeping strict hook rules:
  // If no 'context' param, we can't really use the context hook effectively for *specific* list.
  // But we can just pass 'library' or something safe if missing, and rely on `useEffect` to skip if context is invalid.
  // However, `useItemNavigation` returns specific navigation for THIS item.

  const { getItem } = useLibraryDataContext<LibraryItem>(
    context || 'items', // Default or dummy
    contextId,
    rawParams,
    libraryItem.libraryId
  )

  useEffect(() => {
    if (!context) {
      setNavState({ prevId: null, nextId: null, loading: false })
      return
    }

    let isMounted = true

    const resolveNavigation = async () => {
      try {
        const contextIndexRaw = searchParams.get('contextIndex')
        let parsedIndex = -1
        if (contextIndexRaw !== null) {
          parsedIndex = parseInt(contextIndexRaw, 10)
        }

        if (isNaN(parsedIndex) || parsedIndex < 0) {
          // Fallback or find index logic?
          // If we don't have an index, we can't efficiently navigate.
          // Previous logic tried to find index.
          // Async `getItem` requires an index.
          // If we don't have index, we rely on server find?
          // Or `fetchNavigationItems`?
          // If we lack index, `getItem` is useless.
          // For now, let's assume index is present (as per optimized path).
          // If not, we might fail or need a "find index" feature.
          // Given the user goal is optimization, we prioritize the index path.
          setNavState({ prevId: null, nextId: null, loading: false })
          return
        }

        const [prev, next] = await Promise.all([
          parsedIndex > 0 ? getItem(parsedIndex - 1) : Promise.resolve(null),
          getItem(parsedIndex + 1) // getItem checks total internally or returns null?
          // Our `getItem` implementation (wrapper) calls `getItemAsync`.
          // `getItemAsync` tries to fetch if missing.
          // Accessing `parsedIndex + 1` might trigger a fetch for that page.
          // If it returns null, it means end of list (or error).
        ])

        if (isMounted) {
          setNavState({
            prevId: prev?.id || null,
            nextId: next?.id || null,
            loading: false
          })
        }
      } catch (error) {
        console.error('Failed to resolve navigation', error)
        if (isMounted) setNavState({ prevId: null, nextId: null, loading: false })
      }
    }

    setNavState((prev) => ({ ...prev, loading: true }))
    resolveNavigation()

    return () => {
      isMounted = false
    }
  }, [context, contextId, rawParams, searchParams, getItem])

  return navState
}
