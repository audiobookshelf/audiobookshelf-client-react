import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import TextInput from '@/components/ui/TextInput'
import EpisodesFilterSelect from '@/components/widgets/EpisodesFilterSelect'
import EpisodesSortSelect from '@/components/widgets/EpisodesSortSelect'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'

interface EpisodeTableToolbarProps {
  isSelectionMode: boolean
  search: string
  onSearchChange: (value: string) => void
  filterKey: string
  onFilterChange: (value: string) => void
  sortKey: string
  sortDesc: boolean
  onSortChange: (key: string, desc: boolean) => void
  contextMenuItems: { text: string; action: string }[]
  onContextMenuAction: (action: string) => void
}

export default function EpisodeTableToolbar({
  isSelectionMode,
  search,
  onSearchChange,
  filterKey,
  onFilterChange,
  sortKey,
  sortDesc,
  onSortChange,
  contextMenuItems,
  onContextMenuAction
}: EpisodeTableToolbarProps) {
  const t = useTypeSafeTranslations()

  return (
    <div
      className={mergeClasses(
        'flex flex-wrap items-center gap-2 px-1 py-2 border-b border-border bg-bg-elevated transition-opacity',
        isSelectionMode ? 'opacity-50 pointer-events-none' : ''
      )}
    >
      <TextInput value={search} onChange={onSearchChange} type="search" placeholder={t('PlaceholderSearchEpisode')} className="w-full md:w-auto md:grow" />

      <EpisodesFilterSelect value={filterKey} onChange={onFilterChange} className="w-32" />
      <EpisodesSortSelect sortBy={sortKey} sortDesc={sortDesc} onChange={onSortChange} className="w-38" />

      <ContextMenuDropdown size="small" items={contextMenuItems} onAction={({ action }) => onContextMenuAction(action)} autoWidth className="ms-auto md:ms-0" />
    </div>
  )
}
