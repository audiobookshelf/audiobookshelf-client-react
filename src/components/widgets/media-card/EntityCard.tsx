import AuthorCard from '@/components/widgets/media-card/AuthorCard'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollapsedSeriesCard from '@/components/widgets/media-card/CollapsedSeriesCard'
import CollectionCard from '@/components/widgets/media-card/CollectionCard'
import PlaylistCard from '@/components/widgets/media-card/PlaylistCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import SeriesCard from '@/components/widgets/media-card/SeriesCard'
import { Author, BookshelfEntity, BookshelfView, Collection, EntityType, LibraryItem, MediaProgress, Playlist, Series, UserLoginResponse } from '@/types/api'
import React from 'react'

interface EntityCardProps {
  entity: BookshelfEntity
  entityType: EntityType
  libraryId: string
  isPodcastLibrary: boolean
  cardWidth: number
  coverAspectRatio: number
  currentUser: UserLoginResponse
  seriesSortBy: string
  orderBy: string
  bookProgressMap: Map<string, MediaProgress>
  showSubtitles: boolean
  query: string
  index: number
  id?: string
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  entityType,
  libraryId,
  isPodcastLibrary,
  cardWidth,
  coverAspectRatio,
  currentUser,
  seriesSortBy,
  orderBy,
  bookProgressMap,
  showSubtitles,
  query,
  index,
  id
}) => {
  const userMediaProgress = currentUser.user.mediaProgress

  switch (entityType) {
    case 'series': {
      const series = entity as Series
      return (
        <div style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
          <SeriesCard
            id={id}
            series={series}
            libraryId={libraryId}
            bookshelfView={BookshelfView.DETAIL}
            bookCoverAspectRatio={coverAspectRatio}
            dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
            orderBy={seriesSortBy}
            bookProgressMap={bookProgressMap}
          />
        </div>
      )
    }
    case 'collections': {
      const collection = entity as Collection
      return (
        <div style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
          <CollectionCard
            id={id}
            collection={collection}
            bookshelfView={BookshelfView.DETAIL}
            bookCoverAspectRatio={coverAspectRatio}
            userCanUpdate={currentUser.user.permissions?.update}
            userCanDelete={currentUser.user.permissions?.delete}
            userIsAdmin={currentUser.user.type === 'admin' || currentUser.user.type === 'root'}
          />
        </div>
      )
    }
    case 'playlists': {
      const playlist = entity as Playlist
      return (
        <div style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
          <PlaylistCard
            id={id}
            playlist={playlist}
            bookshelfView={BookshelfView.DETAIL}
            bookCoverAspectRatio={coverAspectRatio}
            userCanUpdate={currentUser.user.permissions?.update}
            userCanDelete={currentUser.user.permissions?.delete}
          />
        </div>
      )
    }
    case 'authors': {
      const author = entity as Author
      return (
        <div style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
          <AuthorCard id={id} author={author} userCanUpdate={currentUser.user.permissions?.update} />
        </div>
      )
    }
    default: {
      // Library items (books/podcasts)
      const item = entity as LibraryItem
      const isCollapsedSeries = !!(item as LibraryItem & { collapsedSeries?: unknown }).collapsedSeries
      const entityProgress = isPodcastLibrary ? null : userMediaProgress.find((progress) => progress.libraryItemId === item.id)
      const EntityMediaCard = isPodcastLibrary ? PodcastMediaCard : BookMediaCard

      if (isCollapsedSeries) {
        return (
          <div style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
            <CollapsedSeriesCard
              id={id}
              libraryItem={item}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={coverAspectRatio}
              mediaProgress={entityProgress}
              isSelectionMode={false}
              selected={false}
              onSelect={() => {}}
              dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
              timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
              showSubtitles={showSubtitles}
              orderBy={orderBy}
            />
          </div>
        )
      }

      return (
        <div style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
          <EntityMediaCard
            id={id}
            libraryItem={item}
            bookshelfView={BookshelfView.DETAIL}
            bookCoverAspectRatio={coverAspectRatio}
            mediaProgress={entityProgress}
            isSelectionMode={false}
            selected={false}
            onSelect={() => {}}
            dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
            timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
            userPermissions={currentUser.user.permissions}
            ereaderDevices={currentUser.ereaderDevices}
            showSubtitles={showSubtitles}
            orderBy={orderBy}
            navigationContext={{
              name: 'items',
              params: query,
              index
            }}
          />
        </div>
      )
    }
  }
}
