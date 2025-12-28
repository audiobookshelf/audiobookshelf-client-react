'use client'

import { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useFilterData } from '@/hooks/useFilterData'
import { BookshelfView, Library, LibraryFilterData, LibraryItem } from '@/types/api'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Per-library settings (stored separately for each library)
interface PerLibrarySettings {
  orderBy: string
  orderDesc: boolean
  filterBy: string
  seriesSortBy: string
  seriesSortDesc: boolean
  seriesFilterBy: string
  authorSortBy: string
  authorSortDesc: boolean
}

// Global settings (shared across all libraries)
interface GlobalSettings {
  collapseSeries: boolean
  collapseBookSeries: boolean
  showSubtitles: boolean
}

export interface LibrarySettings extends PerLibrarySettings, GlobalSettings {}

export type LibrarySettingKey = keyof LibrarySettings

const DEFAULT_PER_LIBRARY_SETTINGS: PerLibrarySettings = {
  orderBy: 'media.metadata.title',
  orderDesc: false,
  filterBy: 'all',
  seriesSortBy: 'name',
  seriesSortDesc: false,
  seriesFilterBy: 'all',
  authorSortBy: 'name',
  authorSortDesc: false
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  collapseSeries: false,
  collapseBookSeries: false,
  showSubtitles: false
}

const DEFAULT_SETTINGS: LibrarySettings = {
  ...DEFAULT_PER_LIBRARY_SETTINGS,
  ...DEFAULT_GLOBAL_SETTINGS
}

// Keys that are per-library (stored with library ID prefix)
const PER_LIBRARY_KEYS: (keyof PerLibrarySettings)[] = [
  'orderBy',
  'orderDesc',
  'filterBy',
  'seriesSortBy',
  'seriesSortDesc',
  'seriesFilterBy',
  'authorSortBy',
  'authorSortDesc'
]

interface LibraryContextType extends LibrarySettings {
  library: Library
  itemCount: number
  setItemCount: (count: number) => void
  contextMenuItems: ContextMenuDropdownItem[]
  setContextMenuItems: (items: ContextMenuDropdownItem[]) => void
  onContextMenuAction: ((action: string) => void) | undefined
  setContextMenuActionHandler: (handler: (action: string) => void) => void
  bookshelfView: BookshelfView
  updateSetting: (key: LibrarySettingKey, value: LibrarySettings[LibrarySettingKey]) => void
  toolbarExtras: React.ReactNode
  setToolbarExtras: (node: React.ReactNode) => void
  // Filter data
  filterData: LibraryFilterData | null
  filterDataLoading: boolean
  isSettingsLoaded: boolean
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined)

export function LibraryProvider({ children, bookshelfView, library }: { children: React.ReactNode; bookshelfView: BookshelfView; library: Library }) {
  const [itemCount, setItemCount] = useState(0)
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuDropdownItem[]>([])
  const [onContextMenuAction, setOnContextMenuActionState] = useState<((action: string) => void) | undefined>(undefined)
  const [settings, setSettings] = useState<LibrarySettings>(DEFAULT_SETTINGS)
  const [toolbarExtras, setToolbarExtras] = useState<React.ReactNode>(null)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  // Filter data hook
  const { filterData, isLoading: filterDataLoading, updateFilterDataWithItem, removeSeriesFromFilterData } = useFilterData(library.id)

  // Socket listeners for real-time filter data updates
  const handleItemAdded = useCallback(
    (item: LibraryItem) => {
      updateFilterDataWithItem(item)
    },
    [updateFilterDataWithItem]
  )

  const handleItemUpdated = useCallback(
    (item: LibraryItem) => {
      updateFilterDataWithItem(item)
    },
    [updateFilterDataWithItem]
  )

  const handleItemsAdded = useCallback(
    (items: LibraryItem[]) => {
      items.forEach(updateFilterDataWithItem)
    },
    [updateFilterDataWithItem]
  )

  const handleItemsUpdated = useCallback(
    (items: LibraryItem[]) => {
      items.forEach(updateFilterDataWithItem)
    },
    [updateFilterDataWithItem]
  )

  const handleSeriesRemoved = useCallback(
    (data: { id: string; libraryId: string }) => {
      if (data.libraryId === library.id) {
        removeSeriesFromFilterData(data.id)
      }
    },
    [library.id, removeSeriesFromFilterData]
  )

  // Register socket listeners
  useSocketEvent<LibraryItem>('item_added', handleItemAdded)
  useSocketEvent<LibraryItem>('item_updated', handleItemUpdated)
  useSocketEvent<LibraryItem[]>('items_added', handleItemsAdded)
  useSocketEvent<LibraryItem[]>('items_updated', handleItemsUpdated)
  useSocketEvent<{ id: string; libraryId: string }>('series_removed', handleSeriesRemoved)

  // Load settings from localStorage when library changes
  useEffect(() => {
    try {
      // Load global settings
      const globalStored = localStorage.getItem('userSettings')
      const globalParsed = globalStored ? JSON.parse(globalStored) : {}

      // Load per-library settings
      let perLibraryParsed: Partial<PerLibrarySettings> = {}
      if (library.id) {
        const perLibraryStored = localStorage.getItem(`librarySettings_${library.id}`)
        if (perLibraryStored) {
          perLibraryParsed = JSON.parse(perLibraryStored)
        }
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...globalParsed,
        ...perLibraryParsed
      })
    } catch (e) {
      console.error('Failed to load user settings', e)
    } finally {
      setIsSettingsLoaded(true)
    }
  }, [library.id])

  const updateSetting = useCallback(
    (key: LibrarySettingKey, value: LibrarySettings[LibrarySettingKey]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value }
        try {
          if (PER_LIBRARY_KEYS.includes(key as keyof PerLibrarySettings) && library.id) {
            // Save per-library setting
            const perLibraryStored = localStorage.getItem(`librarySettings_${library.id}`)
            const perLibraryParsed = perLibraryStored ? JSON.parse(perLibraryStored) : {}
            localStorage.setItem(`librarySettings_${library.id}`, JSON.stringify({ ...perLibraryParsed, [key]: value }))
          } else {
            // Save global setting
            const globalStored = localStorage.getItem('userSettings')
            const globalParsed = globalStored ? JSON.parse(globalStored) : {}
            localStorage.setItem('userSettings', JSON.stringify({ ...globalParsed, [key]: value }))
          }
        } catch (e) {
          console.error('Failed to save user settings', e)
        }
        return newSettings
      })
    },
    [library.id]
  )

  const setContextMenuActionHandler = useCallback((handler: (action: string) => void) => {
    setOnContextMenuActionState(() => handler)
  }, [])

  const value = useMemo(
    () => ({
      library,
      itemCount,
      setItemCount,
      contextMenuItems,
      setContextMenuItems,
      onContextMenuAction,
      setContextMenuActionHandler,
      bookshelfView,
      ...settings,
      updateSetting,
      toolbarExtras,
      setToolbarExtras,
      filterData,
      filterDataLoading,
      isSettingsLoaded
    }),
    [
      library,
      itemCount,
      contextMenuItems,
      onContextMenuAction,
      setContextMenuActionHandler,
      bookshelfView,
      settings,
      updateSetting,
      toolbarExtras,
      filterData,
      filterDataLoading,
      isSettingsLoaded
    ]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider')
  }
  return context
}
