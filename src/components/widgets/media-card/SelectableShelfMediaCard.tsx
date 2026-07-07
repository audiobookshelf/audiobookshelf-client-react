'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { useBookshelfCardSelection } from '@/hooks/useBookshelfCardSelection'
import type { ShelfNavigationEntity } from '@/lib/shelfNavigationEntity'
import type { EReaderDevice, LibraryItem, MediaProgress, UserPermissions } from '@/types/api'
import { BookshelfView } from '@/types/api'

export type SelectableShelfMediaCardType = 'book' | 'podcast' | 'episode'

interface SelectableShelfMediaCardProps {
  scopeId: string
  libraryItem: LibraryItem
  cardType: SelectableShelfMediaCardType
  bookshelfView: BookshelfView
  dateFormat: string
  timeFormat: string
  userPermissions: UserPermissions
  ereaderDevices: EReaderDevice[]
  showSubtitles: boolean
  mediaProgress?: MediaProgress
  shelfEntities: (ShelfNavigationEntity | null)[]
  entityIndex: number
  continueListeningShelf?: boolean
  continueSeriesShelf?: boolean
  selectionEnabled?: boolean
}

export default function SelectableShelfMediaCard({
  scopeId,
  libraryItem,
  cardType,
  bookshelfView,
  dateFormat,
  timeFormat,
  userPermissions,
  ereaderDevices,
  showSubtitles,
  mediaProgress,
  shelfEntities,
  entityIndex,
  continueListeningShelf,
  continueSeriesShelf,
  selectionEnabled = true
}: SelectableShelfMediaCardProps) {
  const episode = cardType === 'episode' ? libraryItem.recentEpisode : undefined
  const { isSelectionMode, selected, onSelect, selectionKey } = useBookshelfCardSelection(
    libraryItem,
    entityIndex,
    shelfEntities,
    episode,
    {
      scopeId,
      enabled: selectionEnabled,
      selectEpisodes: cardType === 'episode'
    }
  )

  const sharedProps = {
    libraryItem,
    bookshelfView,
    dateFormat,
    timeFormat,
    userPermissions,
    ereaderDevices,
    showSubtitles,
    mediaProgress,
    shelfEntities,
    entityIndex,
    continueListeningShelf,
    isSelectionMode,
    selected,
    onSelect,
    selectionAnchorKey: selectionKey
  }

  if (cardType === 'episode') {
    return <PodcastEpisodeCard {...sharedProps} />
  }

  if (cardType === 'podcast') {
    return <PodcastMediaCard {...sharedProps} />
  }

  return <BookMediaCard {...sharedProps} continueSeriesShelf={continueSeriesShelf} />
}
