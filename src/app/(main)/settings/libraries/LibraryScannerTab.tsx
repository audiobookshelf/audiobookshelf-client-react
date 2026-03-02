'use client'

import Btn from '@/components/ui/Btn'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import SortableList from '@/components/widgets/SortableList'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LibrarySettings } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'
import SettingsMoreInfoIcon from '../SettingsMoreInfoIcon'

interface MetadataSource {
  id: string
  name: string
  include: boolean
}

const defaultMetadataSources: MetadataSource[] = [
  { id: 'folderStructure', name: 'Folder structure', include: true },
  { id: 'audioMetatags', name: 'Audio file meta tags OR ebook metadata', include: true },
  { id: 'nfoFile', name: 'NFO file', include: true },
  { id: 'txtFiles', name: 'desc.txt & reader.txt files', include: true },
  { id: 'opfFile', name: 'OPF file', include: true },
  { id: 'absMetadata', name: 'Audiobookshelf metadata file', include: true }
]

const defaultMetadataSourceMap = Object.fromEntries(defaultMetadataSources.map((s) => [s.id, s]))

/**
 * Build the visual source list from the persisted metadataPrecedence array.
 * metadataPrecedence stores IDs from lowest-to-highest priority.
 * Visual order is highest-to-lowest priority (reversed), with unused sources at the bottom.
 */
function buildSourceList(metadataPrecedence: string[]): MetadataSource[] {
  const activeSources = metadataPrecedence.filter((id) => defaultMetadataSourceMap[id]).map((id) => ({ ...defaultMetadataSourceMap[id], include: true }))

  const unusedSources = defaultMetadataSources.filter((s) => !metadataPrecedence.includes(s.id)).map((s) => ({ ...s, include: false }))

  const result = [...unusedSources, ...activeSources]
  result.reverse()
  return result
}

/** Convert visual order back to the persisted format (included items, lowest-to-highest). */
function deriveMetadataPrecedence(sources: MetadataSource[]): string[] {
  return sources
    .filter((s) => s.include)
    .map((s) => s.id)
    .reverse()
}

interface LibraryScannerTabProps {
  settings: LibrarySettings
  onSettingsChange: (updater: (prev: LibrarySettings) => LibrarySettings) => void
}

export default function LibraryScannerTab({ settings, onSettingsChange }: LibraryScannerTabProps) {
  const t = useTypeSafeTranslations()

  const [sources, setSources] = useState<MetadataSource[]>(() => buildSourceList(settings.metadataPrecedence || defaultMetadataSources.map((s) => s.id)))
  const [listKey, setListKey] = useState(0)

  const emitChange = useCallback(
    (newSources: MetadataSource[]) => {
      onSettingsChange((prev) => ({
        ...prev,
        metadataPrecedence: deriveMetadataPrecedence(newSources)
      }))
    },
    [onSettingsChange]
  )

  const handleSortEnd = useCallback(
    (sortedItems: MetadataSource[]) => {
      setSources(sortedItems)
      emitChange(sortedItems)
    },
    [emitChange]
  )

  const handleToggle = useCallback(
    (sourceId: string, include: boolean) => {
      const updated = sources.map((s) => (s.id === sourceId ? { ...s, include } : s))
      setSources(updated)
      emitChange(updated)
    },
    [sources, emitChange]
  )

  const handleReset = useCallback(() => {
    const resetSources = [...defaultMetadataSources].reverse()
    setSources(resetSources)
    setListKey((k) => k + 1)
    emitChange(resetSources)
  }, [emitChange])

  const defaultPrecedenceKey = defaultMetadataSources.map((s) => s.id).join(',')
  const isDefault = useMemo(() => deriveMetadataPrecedence(sources).join(',') === defaultPrecedenceKey, [sources, defaultPrecedenceKey])

  const firstActiveIndex = useMemo(() => sources.findIndex((s) => s.include), [sources])
  const lastActiveIndex = useMemo(() => sources.findLastIndex((s) => s.include), [sources])

  const getSourcePriority = useCallback(
    (sourceId: string) => {
      const activeSources = sources.filter((s) => s.include)
      return activeSources.findIndex((s) => s.id === sourceId) + 1
    },
    [sources]
  )

  const renderItem = useCallback(
    (source: MetadataSource, index: number) => (
      <div className={`w-full px-2 flex items-center border border-border ${!source.include ? 'opacity-50' : ''}`}>
        <span className="material-symbols drag-handle text-xl text-foreground-subdued hover:text-foreground mr-2 md:mr-4 cursor-grab">reorder</span>
        <div className="text-center py-1 w-8 min-w-8">{source.include ? getSourcePriority(source.id) : ''}</div>
        <div className="text-sm sm:text-base grow inline-flex justify-between items-center px-2 sm:px-4 py-3">
          {source.name}
          {source.include && (index === firstActiveIndex || index === lastActiveIndex) && (
            <span className="hidden sm:inline-block px-2 italic font-semibold text-xs text-foreground-subdued">
              {index === firstActiveIndex ? t('LabelHighestPriority') : t('LabelLowestPriority')}
            </span>
          )}
        </div>
        <ToggleSwitch value={source.include} offColor="error" onChange={(value) => handleToggle(source.id, value)} />
      </div>
    ),
    [firstActiveIndex, lastActiveIndex, getSourcePriority, handleToggle, t]
  )

  return (
    <div className="w-full h-full px-1 md:px-4 py-1 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base md:text-lg text-foreground">{t('HeaderMetadataOrderOfPrecedence')}</h2>
        {!isDefault && (
          <Btn size="small" onClick={handleReset}>
            {t('ButtonResetToDefault')}
          </Btn>
        )}
      </div>

      <div className="flex items-center justify-between md:justify-start mb-4">
        <p className="text-sm text-foreground-muted pr-2">{t('LabelMetadataOrderOfPrecedenceDescription')}</p>
        <SettingsMoreInfoIcon moreInfoUrl="https://www.audiobookshelf.org/guides/book-scanner" />
      </div>

      <SortableList key={listKey} items={sources} onSortEnd={handleSortEnd} renderItem={renderItem} />
    </div>
  )
}
