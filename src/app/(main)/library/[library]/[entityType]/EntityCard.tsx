import AuthorCard from '@/components/widgets/media-card/AuthorCard'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollapsedSeriesCard from '@/components/widgets/media-card/CollapsedSeriesCard'
import CollectionCard from '@/components/widgets/media-card/CollectionCard'
import PlaylistCard from '@/components/widgets/media-card/PlaylistCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import SeriesCard from '@/components/widgets/media-card/SeriesCard'
import { Author, BookshelfEntity, BookshelfView, Collection, EntityType, LibraryItem, MediaProgress, Playlist, Series, UserLoginResponse } from '@/types/api'

interface EntityCardProps {
  entity: BookshelfEntity
  entityType: EntityType
  width: number
  libraryId: string
  isPodcastLibrary: boolean
  coverAspectRatio: number
  showSubtitles: boolean
  currentUser: UserLoginResponse
  orderBy?: string
  seriesSortBy?: string
  bookProgressMap: Map<string, MediaProgress>
}

export default function EntityCard({
  entity,
  entityType,
  width,
  libraryId,
  isPodcastLibrary,
  coverAspectRatio,
  showSubtitles,
  currentUser,
  orderBy,
  seriesSortBy,
  bookProgressMap
}: EntityCardProps) {
  switch (entityType) {
    case 'series': {
      const series = entity as Series
      return (
        <div key={`card-wrapper-${series.id}`} style={{ width: `${width}px`, flexShrink: 0 }}>
          <SeriesCard
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
        <div key={`card-wrapper-${collection.id}`} style={{ width: `${width}px`, flexShrink: 0 }}>
          <CollectionCard
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
        <div key={`card-wrapper-${playlist.id}`} style={{ width: `${width}px`, flexShrink: 0 }}>
          <PlaylistCard
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
        <div key={`card-wrapper-${author.id}`} style={{ width: `${width}px`, flexShrink: 0 }}>
          <AuthorCard author={author} user={currentUser.user} />
        </div>
      )
    }
    default: {
      // Library items (books/podcasts)
      const item = entity as LibraryItem
      const isCollapsedSeries = !!item.collapsedSeries
      // Use bookProgressMap for efficiency instead of array.find
      const entityProgress = isPodcastLibrary ? null : bookProgressMap.get(item.id)
      const EntityMediaCard = isPodcastLibrary ? PodcastMediaCard : BookMediaCard

      if (isCollapsedSeries) {
        return (
          <div key={`card-wrapper-${item.id}`} style={{ width: `${width}px`, flexShrink: 0 }}>
            <CollapsedSeriesCard
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
        <div key={`card-wrapper-${item.id}`} style={{ width: `${width}px`, flexShrink: 0 }}>
          <EntityMediaCard
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
          />
        </div>
      )
    }
  }
}
