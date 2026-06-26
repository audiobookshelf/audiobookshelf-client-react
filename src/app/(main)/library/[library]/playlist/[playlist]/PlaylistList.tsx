'use client'

import { updatePlaylistAction } from '@/app/actions/playlistActions'
import type { SortableListDragHandleProps } from '@/components/widgets/SortableList'
import CompilationItemListRow from '@/components/widgets/compilation/CompilationItemListRow'
import CompilationSortableList from '@/components/widgets/compilation/CompilationSortableList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getPlaylistItemKey, playlistItemsToPayload } from '@/lib/playlistItems'
import type { Playlist, PlaylistItem } from '@/types/api'
import { useCallback, useMemo, useTransition } from 'react'

type SortablePlaylistItem = PlaylistItem & { id: string }

interface PlaylistListProps {
  playlist: Playlist
  orderedItems: PlaylistItem[]
  setOrderedItems: (next: PlaylistItem[]) => void
  showReorder: boolean
}

export default function PlaylistList({ playlist, orderedItems, setOrderedItems, showReorder }: PlaylistListProps) {
  const t = useTypeSafeTranslations()
  const { userCanUpdate } = useUser()
  const { showToast } = useGlobalToast()
  const [, startTransition] = useTransition()

  const showDragHandle = userCanUpdate && showReorder

  const sortableItems = useMemo((): SortablePlaylistItem[] => orderedItems.map((item) => ({ ...item, id: getPlaylistItemKey(item) })), [orderedItems])

  const handleSortEnd = useCallback(
    (sortedItems: SortablePlaylistItem[]) => {
      const prev = orderedItems
      const next = sortedItems.map((item) => ({
        libraryItemId: item.libraryItemId,
        libraryItem: item.libraryItem,
        episodeId: item.episodeId,
        episode: item.episode
      }))
      setOrderedItems(next)
      startTransition(async () => {
        try {
          await updatePlaylistAction(playlist.id, { items: playlistItemsToPayload(next) })
        } catch (error) {
          console.error('Failed to update playlist order', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
          setOrderedItems(prev)
        }
      })
    },
    [orderedItems, playlist.id, setOrderedItems, showToast, t]
  )

  const renderItem = useCallback(
    (item: SortablePlaylistItem, index: number, dragHandle: SortableListDragHandleProps) => (
      <CompilationItemListRow
        libraryItem={item.libraryItem}
        episode={item.episode}
        context={{ kind: 'playlist', playlistId: playlist.id }}
        entityIndex={index}
        shelfEntities={orderedItems}
        showDragHandle={showDragHandle}
        sortableDragHandleProps={dragHandle}
      />
    ),
    [orderedItems, playlist.id, showDragHandle]
  )

  return (
    <CompilationSortableList
      items={sortableItems}
      onSortEnd={handleSortEnd}
      renderItem={renderItem}
      showReorder={showReorder}
      emptyMessage={t('MessageNoItemsFound')}
    />
  )
}
