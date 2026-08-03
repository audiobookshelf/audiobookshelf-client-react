'use client'

import { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import { useUser } from '@/contexts/UserContext'
import { useFilterData } from '@/hooks/useFilterData'
import { getCoverAspectRatio } from '@/lib/coverUtils'
import { getLibrarySortFilterUpdates } from '@/lib/libraryMediaTypeSortFilter'
import { BookshelfView, Library, LibraryFilterData } from '@/types/api'
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

export type UpdateSettingFn = (key: LibrarySettingKey, value: LibrarySettings[LibrarySettingKey]) => void

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
  itemCount: number | null
  /** Sets toolbar item count and clears `itemCountSupplement` (set supplement again in the same effect if needed). */
  setItemCount: (count: number | null) => void
  /** Optional suffix for the toolbar count line, e.g. " (7d 22h 48m)" on collection pages */
  itemCountSupplement: string | null
  setItemCountSupplement: (value: string | null) => void
  /** When set (e.g. series detail page), toolbar shows this title */
  detailToolbarTitle: string | null
  setDetailToolbarTitle: (title: string | null) => void
  contextMenuItems: ContextMenuDropdownItem[]
  setContextMenuItems: (items: ContextMenuDropdownItem[]) => void
  onContextMenuAction: ((action: string) => void) | undefined
  setContextMenuActionHandler: (handler: (action: string) => void) => void
  homeBookshelfView: BookshelfView
  bookshelfView: BookshelfView
  updateSetting: UpdateSettingFn
  toolbarExtras: React.ReactNode
  setToolbarExtras: (node: React.ReactNode) => void
  boundModal: React.ReactNode | null
  setBoundModal: (node: React.ReactNode | null) => void
  // Filter data
  filterData: LibraryFilterData | null
  filterDataLoading: boolean
  setNumIssues: (count: number) => void
  refetchFilterDataSilently: () => void
  isSettingsLoaded: boolean
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined)

export function LibraryProvider({ children, library }: { children: React.ReactNode; library: Library }) {
  const [itemCount, setItemCountState] = useState<number | null>(null)
  const [itemCountSupplement, setItemCountSupplementState] = useState<string | null>(null)
  const [detailToolbarTitle, setDetailToolbarTitle] = useState<string | null>(null)

  const setItemCount = useCallback((count: number | null) => {
    setItemCountState(count)
    setItemCountSupplementState(null)
  }, [])

  const setItemCountSupplement = useCallback((value: string | null) => {
    setItemCountSupplementState(value)
  }, [])
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuDropdownItem[]>([])
  const [onContextMenuAction, setOnContextMenuActionState] = useState<((action: string) => void) | undefined>(undefined)
  const [settings, setSettings] = useState<LibrarySettings>(DEFAULT_SETTINGS)
  const [toolbarExtras, setToolbarExtras] = useState<React.ReactNode>(null)
  const [boundModal, setBoundModal] = useState<React.ReactNode | null>(null)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  const { serverSettings } = useUser()
  const homeBookshelfView = serverSettings?.homeBookshelfView || 0
  const bookshelfView = serverSettings?.bookshelfView || 0

  // Filter data hook
  const { filterData, isLoading: filterDataLoading, setNumIssues, refetchFilterDataSilently } = useFilterData(library.id)

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

      const merged: LibrarySettings = {
        ...DEFAULT_SETTINGS,
        ...globalParsed,
        ...perLibraryParsed
      }
      const sortFilterUpdates = getLibrarySortFilterUpdates(merged, library.mediaType)
      const finalSettings = { ...merged, ...sortFilterUpdates }

      setSettings(finalSettings)

      if (Object.keys(sortFilterUpdates).length > 0 && library.id) {
        const perLibraryStored = localStorage.getItem(`librarySettings_${library.id}`)
        const perLibraryParsedForSave = perLibraryStored ? JSON.parse(perLibraryStored) : {}
        localStorage.setItem(`librarySettings_${library.id}`, JSON.stringify({ ...perLibraryParsedForSave, ...sortFilterUpdates }))
      }
    } catch (e) {
      console.error('Failed to load user settings', e)
    } finally {
      setIsSettingsLoaded(true)
    }
  }, [library.id, library.mediaType])

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
      itemCountSupplement,
      setItemCountSupplement,
      detailToolbarTitle,
      setDetailToolbarTitle,
      contextMenuItems,
      setContextMenuItems,
      onContextMenuAction,
      setContextMenuActionHandler,
      homeBookshelfView,
      bookshelfView,
      ...settings,
      updateSetting,
      toolbarExtras,
      setToolbarExtras,
      boundModal,
      setBoundModal,
      filterData,
      filterDataLoading,
      setNumIssues,
      refetchFilterDataSilently,
      isSettingsLoaded
    }),
    [
      library,
      itemCount,
      itemCountSupplement,
      detailToolbarTitle,
      contextMenuItems,
      onContextMenuAction,
      setContextMenuActionHandler,
      homeBookshelfView,
      bookshelfView,
      settings,
      updateSetting,
      toolbarExtras,
      boundModal,
      filterData,
      filterDataLoading,
      setNumIssues,
      refetchFilterDataSilently,
      isSettingsLoaded,
      setItemCount,
      setItemCountSupplement
    ]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextType {
  const context = useContext(LibraryContext)
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider')
  }
  return context
}

export function useLibraryOptional(): Partial<LibraryContextType> {
  return useContext(LibraryContext) ?? {}
}

/** Numeric height/width ratio for covers from library setting. Square (1) or standard (1.6) */
export function useBookCoverAspectRatio(): number {
  const context = useContext(LibraryContext)
  return getCoverAspectRatio((context?.library.settings?.coverAspectRatio ?? 1) as 0 | 1)
}
