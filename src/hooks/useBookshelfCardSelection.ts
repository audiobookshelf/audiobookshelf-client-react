'use client'

import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { getSelectionKey, orderedLibraryItemSelectionKeys, orderedSelectionKeysFromSources, type SelectionKeySource } from '@/lib/selectedMediaItem'
import { isPlaylistItem, type ShelfNavigationEntity } from '@/lib/shelfNavigationEntity'
import type { LibraryItem, PodcastEpisode } from '@/types/api'
import { useCallback, useMemo, type MouseEvent } from 'react'

export interface UseBookshelfCardSelectionOptions {
  scopeId: string
  enabled?: boolean
  isSelectable?: boolean
  /** When true, shelf entities use episode keys (homepage episode shelves). */
  selectEpisodes?: boolean
  /** Explicit ordered keys; overrides selectEpisodes / library-item default when set. */
  orderedSelectionKeys?: readonly string[]
}

function shelfEntitiesToLibraryItems(entities: readonly (ShelfNavigationEntity | null)[] | undefined): LibraryItem[] {
  if (!entities) return []
  const items: LibraryItem[] = []
  for (const entity of entities) {
    if (!entity) continue
    if (isPlaylistItem(entity)) {
      items.push(entity.libraryItem)
      continue
    }
    if ('mediaType' in entity) {
      items.push(entity as LibraryItem)
    }
  }
  return items
}

function shelfEntitiesToSelectionSources(entities: readonly (ShelfNavigationEntity | null)[] | undefined, selectEpisodes: boolean): SelectionKeySource[] {
  if (!entities) return []
  const sources: SelectionKeySource[] = []
  for (const entity of entities) {
    if (!entity) continue
    if (isPlaylistItem(entity)) {
      if (entity.episode) {
        sources.push({ libraryItem: entity.libraryItem, episode: entity.episode })
      } else {
        sources.push({ libraryItem: entity.libraryItem })
      }
      continue
    }
    if ('mediaType' in entity) {
      const libraryItem = entity as LibraryItem
      if (selectEpisodes && libraryItem.recentEpisode) {
        sources.push({ libraryItem, episode: libraryItem.recentEpisode })
      } else if (!selectEpisodes) {
        sources.push({ libraryItem })
      }
      continue
    }
  }
  return sources
}

export function useBookshelfCardSelection(
  libraryItem: LibraryItem,
  entityIndex: number | undefined,
  shelfEntities: readonly (ShelfNavigationEntity | null)[] | undefined,
  episode: PodcastEpisode | undefined,
  options: UseBookshelfCardSelectionOptions
) {
  const { scopeId, enabled = true, isSelectable = true, selectEpisodes = false, orderedSelectionKeys } = options
  const { isSelectionMode, isSelected, isScopeActive, selectItem } = useBookshelfSelection()

  const selectionSources = useMemo(() => shelfEntitiesToSelectionSources(shelfEntities, selectEpisodes), [shelfEntities, selectEpisodes])

  const orderedKeys = useMemo(() => {
    if (orderedSelectionKeys) return orderedSelectionKeys
    if (selectionSources.length > 0) {
      return orderedSelectionKeysFromSources(selectionSources)
    }
    const items = shelfEntitiesToLibraryItems(shelfEntities)
    return orderedLibraryItemSelectionKeys(items, false)
  }, [orderedSelectionKeys, selectionSources, shelfEntities])

  const selectionKey = useMemo(() => getSelectionKey({ libraryItemId: libraryItem.id, episodeId: episode?.id }), [libraryItem.id, episode?.id])

  const scopeActive = isScopeActive(scopeId)
  const effectiveSelectionMode = isSelectionMode && scopeActive
  const selected = isSelected(selectionKey)

  const onSelect = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !isSelectable) return

      const index = entityIndex ?? orderedKeys.findIndex((key) => key === selectionKey)
      if (index < 0) return

      selectItem(scopeId, {
        shiftKey: event.shiftKey,
        index,
        orderedKeys,
        orderedSources: selectionSources,
        selectionKey,
        libraryItem,
        episode
      })
    },
    [enabled, isSelectable, entityIndex, orderedKeys, selectionSources, selectionKey, selectItem, scopeId, libraryItem, episode]
  )

  if (!enabled || !isSelectable) {
    return {
      isSelectionMode: false,
      selected: false,
      onSelect: undefined,
      selectionKey
    }
  }

  return {
    isSelectionMode: effectiveSelectionMode,
    selected,
    onSelect,
    selectionKey
  }
}
