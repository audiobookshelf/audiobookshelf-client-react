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
        'border-border bg-bg-elevated flex flex-col gap-2 border-b px-1 py-2 transition-opacity md:flex-row md:flex-wrap md:items-center',
        isSelectionMode ? 'pointer-events-none opacity-50' : ''
      )}
    >
      <TextInput value={search} onChange={onSearchChange} type="search" placeholder={t('PlaceholderSearchEpisode')} className="w-full md:w-auto md:grow" />

      <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 md:contents">
        <EpisodesFilterSelect value={filterKey} onChange={onFilterChange} className="w-32 min-w-0 md:w-32" />
        <EpisodesSortSelect sortBy={sortKey} sortDesc={sortDesc} onChange={onSortChange} className="w-30 min-w-0 md:w-38" />

        <div className="ms-auto shrink-0 md:contents">
          <ContextMenuDropdown size="small" items={contextMenuItems} onAction={({ action }) => onContextMenuAction(action)} autoWidth />
        </div>
      </div>
    </div>
  )
}
