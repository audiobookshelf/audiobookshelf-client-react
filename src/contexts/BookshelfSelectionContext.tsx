'use client'

import {
  getSelectionKey,
  getSelectionKind,
  toSelectedMediaItem,
  type SelectedMediaItem,
  type SelectionKeySource,
  type SelectionKind
} from '@/lib/selectedMediaItem'
import { applyShiftClickSelection } from '@/lib/shiftClickSelection'
import type { LibraryItem, PodcastEpisode } from '@/types/api'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export interface SelectItemOptions {
  shiftKey?: boolean
  index: number
  orderedKeys: readonly string[]
  orderedSources: readonly SelectionKeySource[]
  selectionKey: string
  libraryItem: LibraryItem
  episode?: PodcastEpisode
  isKeySelectable?: (key: string) => boolean
}

interface BookshelfSelectionContextValue {
  selectedItems: SelectedMediaItem[]
  selectedKeys: Set<string>
  selectionKind: SelectionKind | null
  activeScopeId: string | null
  isSelectionMode: boolean
  isSelected: (selectionKey: string) => boolean
  isScopeActive: (scopeId: string) => boolean
  selectItem: (scopeId: string, options: SelectItemOptions) => void
  ensureSelectionAnchor: (selectionKey: string) => void
  clearSelection: () => void
}

const BookshelfSelectionContext = createContext<BookshelfSelectionContextValue | null>(null)

function itemsFromKeys(keys: Set<string>, orderedSources: readonly SelectionKeySource[], existing: SelectedMediaItem[]): SelectedMediaItem[] {
  const byKey = new Map(existing.map((item) => [item.selectionKey, item]))
  for (const source of orderedSources) {
    const key = getSelectionKey({ libraryItemId: source.libraryItem.id, episodeId: source.episode?.id })
    if (keys.has(key)) {
      byKey.set(key, toSelectedMediaItem(source.libraryItem, source.episode))
    }
  }
  return Array.from(keys)
    .map((key) => byKey.get(key))
    .filter((item): item is SelectedMediaItem => item != null)
}

export function BookshelfSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedItems, setSelectedItems] = useState<SelectedMediaItem[]>([])
  const [selectionKind, setSelectionKind] = useState<SelectionKind | null>(null)
  const [activeScopeId, setActiveScopeId] = useState<string | null>(null)
  const selectedItemsRef = useRef<SelectedMediaItem[]>([])
  const selectionKindRef = useRef<SelectionKind | null>(null)
  const activeScopeIdRef = useRef<string | null>(null)
  const anchorKeyRef = useRef<string | null>(null)

  selectedItemsRef.current = selectedItems
  selectionKindRef.current = selectionKind
  activeScopeIdRef.current = activeScopeId

  const selectedKeys = useMemo(() => new Set(selectedItems.map((item) => item.selectionKey)), [selectedItems])
  const isSelectionMode = selectedItems.length > 0

  const isSelected = useCallback((selectionKey: string) => selectedKeys.has(selectionKey), [selectedKeys])

  const isScopeActive = useCallback((scopeId: string) => activeScopeId === scopeId, [activeScopeId])

  const clearSelection = useCallback(() => {
    selectedItemsRef.current = []
    selectionKindRef.current = null
    setSelectedItems([])
    setSelectionKind(null)
    setActiveScopeId(null)
    activeScopeIdRef.current = null
    anchorKeyRef.current = null
  }, [])

  const ensureSelectionAnchor = useCallback((selectionKey: string) => {
    if (anchorKeyRef.current === null) {
      anchorKeyRef.current = selectionKey
    }
  }, [])

  const selectItem = useCallback((scopeId: string, options: SelectItemOptions) => {
    if (activeScopeIdRef.current !== null && activeScopeIdRef.current !== scopeId) {
      return
    }

    const { shiftKey = false, index, orderedKeys, orderedSources, selectionKey, libraryItem, episode, isKeySelectable } = options

    if (anchorKeyRef.current && !orderedKeys.includes(anchorKeyRef.current)) {
      anchorKeyRef.current = null
    }

    const prev = selectedItemsRef.current
    const prevKeys = new Set(prev.map((entry) => entry.selectionKey))
    const selectClicked = !prevKeys.has(selectionKey)

    const { nextSelected, anchorKey } = applyShiftClickSelection({
      prevSelected: prevKeys,
      clickedKey: selectionKey,
      clickedIndex: index,
      shiftKey,
      anchorKey: anchorKeyRef.current,
      orderedKeys,
      selectClicked,
      isKeySelectable
    })

    anchorKeyRef.current = anchorKey
    const next = itemsFromKeys(nextSelected, orderedSources, prev)

    let nextKind = selectionKindRef.current
    if (next.length === 0) {
      nextKind = null
      activeScopeIdRef.current = null
      setActiveScopeId(null)
    } else {
      activeScopeIdRef.current = scopeId
      setActiveScopeId(scopeId)
      if (prev.length === 0) {
        nextKind = getSelectionKind(libraryItem, episode)
      }
    }

    selectedItemsRef.current = next
    selectionKindRef.current = nextKind
    setSelectedItems(next)
    setSelectionKind(nextKind)
  }, [])

  const value = useMemo(
    () => ({
      selectedItems,
      selectedKeys,
      selectionKind,
      activeScopeId,
      isSelectionMode,
      isSelected,
      isScopeActive,
      selectItem,
      ensureSelectionAnchor,
      clearSelection
    }),
    [selectedItems, selectedKeys, selectionKind, activeScopeId, isSelectionMode, isSelected, isScopeActive, selectItem, ensureSelectionAnchor, clearSelection]
  )

  return <BookshelfSelectionContext.Provider value={value}>{children}</BookshelfSelectionContext.Provider>
}

export function useBookshelfSelection() {
  const context = useContext(BookshelfSelectionContext)
  if (!context) {
    throw new Error('useBookshelfSelection must be used within BookshelfSelectionProvider')
  }
  return context
}

/** Safe optional hook for components that may render outside library layout. */
export function useBookshelfSelectionOptional() {
  return useContext(BookshelfSelectionContext)
}
