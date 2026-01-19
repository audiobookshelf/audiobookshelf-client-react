'use client'

import BookShelfRow from '@/components/widgets/BookShelfRow'
import ItemSlider from '@/components/widgets/ItemSlider'
import { AuthorCard } from '@/components/widgets/media-card/AuthorCard'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useLibraryDataContext } from '@/contexts/LibraryDataContext'
import { Author, BookshelfView, LibraryItem, MediaProgress, PersonalizedShelf, Series, UserLoginResponse } from '@/types/api'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface LibraryClientProps {
  currentUser: UserLoginResponse
}

export default function LibraryClient({ currentUser }: LibraryClientProps) {
  const user = currentUser.user
  const { sizeMultiplier } = useCardSize()
  const { library, setContextMenuItems, setContextMenuActionHandler, bookshelfView } = useLibrary()
  const searchParams = useSearchParams()
  const focusShelf = searchParams.get('focusShelf')
  const focusIndex = parseInt(searchParams.get('focusIndex') || '', 10)

  const { isLoading, getItemsArray: getShelves } = useLibraryDataContext<PersonalizedShelf>('personalized', null, null, library?.id)

  const shelves = getShelves()

  // Scroll to focused shelf or item
  useEffect(() => {
    if (isLoading || !focusShelf) return

    // Try to focus specific item first
    if (!isNaN(focusIndex)) {
      const itemEl = document.getElementById(`shelf-item-${focusShelf}-${focusIndex}`)
      if (itemEl) {
        itemEl.scrollIntoView({ block: 'center', inline: 'center' })
        itemEl.focus({ preventScroll: true })
        return
      }
    }

    // Fallback to shelf
    const el = document.getElementById(`shelf-${focusShelf}`)
    if (el) {
      el.scrollIntoView({ block: 'center' })
    }
  }, [focusShelf, focusIndex, isLoading])

  // Toolbar Context menu
  useEffect(() => {
    const items = []

    if (user.permissions.update) {
      items.push({
        text: 'Scan Library',
        action: 'scan'
      })
      items.push({
        text: 'Edit Library',
        action: 'edit'
      })
    }

    setContextMenuItems(items)

    setContextMenuActionHandler((action) => {
      if (action === 'scan') {
        // TODO: Implement scan
      } else if (action === 'edit') {
        // TODO: Implement edit
      }
    })

    return () => {
      setContextMenuItems([])
      setContextMenuActionHandler(() => {})
    }
  }, [user.permissions.update, setContextMenuItems, setContextMenuActionHandler])

  if (!library) return null
  if (isLoading && shelves.length === 0) return <div className="p-8">Loading shelves...</div> // Simple loading state

  return (
    <div style={{ fontSize: sizeMultiplier + 'rem' }}>
      {shelves.map((shelf) => {
        return (
          <LibraryShelfRow
            key={shelf.id}
            shelf={shelf}
            currentUser={currentUser}
            libraryId={library.id}
            bookshelfView={bookshelfView}
            coverAspectRatio={library.settings?.coverAspectRatio}
          />
        )
      })}
    </div>
  )
}

function LibraryShelfRow({
  shelf,
  currentUser,
  libraryId,
  bookshelfView,
  coverAspectRatio
}: {
  shelf: PersonalizedShelf
  currentUser: UserLoginResponse
  libraryId: string
  bookshelfView: BookshelfView
  coverAspectRatio?: number
}) {
  const entities = shelf.entities || []
  const Wrapper = bookshelfView === BookshelfView.STANDARD ? BookShelfRow : ItemSlider

  return (
    <div key={shelf.id} id={`shelf-${shelf.id}`}>
      <Wrapper title={shelf.label}>
        {entities.map((entity, index) => {
          if (shelf.type === 'book' || shelf.type === 'podcast') {
            const EntityMediaCard = shelf.type === 'book' ? BookMediaCard : PodcastMediaCard
            const libraryItem = entity as LibraryItem
            // We need media progress...
            // It's in currentUser.user.mediaProgress.
            const mediaProgress = currentUser.user.mediaProgress.find((mp) => mp.libraryItemId === libraryItem.id)

            return (
              <div key={entity.id + '-' + shelf.id} className="shrink-0 mx-2e rounded-sm">
                <EntityMediaCard
                  id={`shelf-item-${shelf.id}-${index}`}
                  libraryItem={libraryItem}
                  bookshelfView={bookshelfView}
                  dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                  timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
                  userPermissions={currentUser.user.permissions}
                  ereaderDevices={currentUser.ereaderDevices}
                  showSubtitles={true}
                  bookCoverAspectRatio={coverAspectRatio ?? 1}
                  mediaProgress={mediaProgress}
                  navigationContext={{
                    name: 'personalized',
                    id: shelf.id,
                    index
                  }}
                />
              </div>
            )
          } else if (shelf.type === 'series') {
            const series = entity as Series
            const libraryItems = series.books || []
            const bookProgressMap = new Map<string, MediaProgress>()
            libraryItems.forEach((libraryItem) => {
              const mediaProgress = currentUser.user.mediaProgress.find((mp) => mp.libraryItemId === libraryItem.id)
              if (mediaProgress) {
                bookProgressMap.set(libraryItem.id, mediaProgress)
              }
            })
            return (
              <div key={entity.id + '-' + shelf.id} className="shrink-0 mx-2e rounded-sm">
                <SeriesCard
                  id={`shelf-item-${shelf.id}-${index}`}
                  series={series}
                  libraryId={libraryId}
                  bookshelfView={bookshelfView}
                  dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                  bookCoverAspectRatio={coverAspectRatio ?? 1}
                  bookProgressMap={bookProgressMap}
                />
              </div>
            )
          } else if (shelf.type === 'episode') {
            const libraryItem = entity as LibraryItem
            const episode = libraryItem.recentEpisode
            if (!episode) return null
            const mediaProgress = currentUser.user.mediaProgress.find((mp) => mp.mediaItemId === episode.id)
            return (
              <div key={episode.id + '-' + shelf.id} className="shrink-0 mx-2e rounded-sm">
                <PodcastEpisodeCard
                  id={`shelf-item-${shelf.id}-${index}`}
                  libraryItem={libraryItem}
                  bookshelfView={bookshelfView}
                  dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                  timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
                  userPermissions={currentUser.user.permissions}
                  ereaderDevices={currentUser.ereaderDevices}
                  showSubtitles={true}
                  bookCoverAspectRatio={coverAspectRatio ?? 1}
                  mediaProgress={mediaProgress}
                  navigationContext={{
                    name: 'personalized',
                    id: shelf.id,
                    index
                  }}
                />
              </div>
            )
          } else if (shelf.type === 'authors') {
            const author = entity as Author
            return (
              <div key={author.id + '-' + shelf.id} className="shrink-0 mx-2e rounded-sm">
                <AuthorCard id={`shelf-item-${shelf.id}-${index}`} author={author} userCanUpdate={currentUser.user.permissions.update} />
              </div>
            )
          }
          return null
        })}
      </Wrapper>
    </div>
  )
}
