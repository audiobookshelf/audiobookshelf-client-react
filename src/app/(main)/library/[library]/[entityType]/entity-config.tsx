import LibraryFilterSelect from '@/app/(main)/library/[library]/LibraryFilterSelect'
import LibrarySortSelect from '@/app/(main)/library/[library]/LibrarySortSelect'
import AuthorCard from '@/components/widgets/media-card/AuthorCard'
import AuthorCardSkeleton from '@/components/widgets/media-card/AuthorCardSkeleton'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollapsedSeriesCard from '@/components/widgets/media-card/CollapsedSeriesCard'
import CollectionCard from '@/components/widgets/media-card/CollectionCard'
import CollectionCardSkeleton from '@/components/widgets/media-card/CollectionCardSkeleton'
import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import PlaylistCard from '@/components/widgets/media-card/PlaylistCard'
import PlaylistCardSkeleton from '@/components/widgets/media-card/PlaylistCardSkeleton'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import SeriesCard from '@/components/widgets/media-card/SeriesCard'
import SeriesCardSkeleton from '@/components/widgets/media-card/SeriesCardSkeleton'
import type { CollectionMarkFinishedControls } from '@/components/widgets/media-card/MediaCard'
import { UpdateSettingFn } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { Author, BookshelfEntity, BookshelfView, Collection, EntityType, Library, LibraryItem, MediaProgress, Playlist, Series, User } from '@/types/api'
import { TranslationKey } from '@/types/translations'
import React, { type MouseEvent, type ReactNode } from 'react'

/** Selection is unused on the bookshelf; stable identity so memo(MediaCard) can skip unchanged cards. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function bookshelfCardNoopSelect(_event: MouseEvent) {}

export interface SkeletonComponentProps {
  bookshelfView: BookshelfView
  seriesSortBy?: string
  showSubtitles?: boolean
  orderBy?: string
}

export interface CardComponentProps {
  entity: BookshelfEntity
  bookshelfView: BookshelfView
  width: number
  libraryId?: string
  isPodcastLibrary?: boolean
  showSubtitles?: boolean
  orderBy?: string
  seriesSortBy?: string
  mediaItemProgressMap: Map<string, MediaProgress>
  shelfEntities?: (BookshelfEntity | null)[]
  entityIndex?: number
  /** Passed through to book/podcast media cards (collection mark finished). */
  collectionMarkFinished?: CollectionMarkFinishedControls
}

export interface EntityConfig {
  getToolbarExtras: (user: User, library: Library) => ReactNode

  getContextMenuItems: (
    user: User,
    library: Library,
    settings: { showSubtitles: boolean; collapseSeries: boolean }
  ) => { textKey: TranslationKey; action: string }[]

  handleContextMenuAction: (action: string, helpers: { updateSetting: UpdateSettingFn }) => void

  getEmptyMessageKey: (filterBy: string, isPodcastLibrary: boolean) => TranslationKey | ''

  SkeletonComponent: React.FC<SkeletonComponentProps>

  CardComponent: React.FC<CardComponentProps>
}

export const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  items: {
    getToolbarExtras: (user, library) => (
      <>
        <LibraryFilterSelect user={user} entityType="items" />
        <LibrarySortSelect entityType="items" libraryMediaType={library.mediaType} />
      </>
    ),
    getContextMenuItems: (user, library, settings) => {
      const menuItems: { textKey: TranslationKey; action: string }[] = [
        {
          textKey: settings.showSubtitles ? 'LabelHideSubtitles' : 'LabelShowSubtitles',
          action: settings.showSubtitles ? 'hide-subtitles' : 'show-subtitles'
        }
      ]
      if (library.mediaType === 'book') {
        menuItems.push({
          textKey: settings.collapseSeries ? 'LabelExpandSeries' : 'LabelCollapseSeries',
          action: settings.collapseSeries ? 'expand-series' : 'collapse-series'
        })
      }
      return menuItems
    },
    handleContextMenuAction: (action, { updateSetting }) => {
      if (action === 'show-subtitles') {
        updateSetting('showSubtitles', true)
      } else if (action === 'hide-subtitles') {
        updateSetting('showSubtitles', false)
      } else if (action === 'expand-series') {
        updateSetting('collapseSeries', false)
      } else if (action === 'collapse-series') {
        updateSetting('collapseSeries', true)
      }
    },
    getEmptyMessageKey: (filterBy, isPodcastLibrary) => {
      if (filterBy === 'all') {
        // Handled specially by LibraryEmptyState in BookshelfClient
        return ''
      }
      return isPodcastLibrary ? 'MessageNoPodcastsFound' : 'MessageNoBooksFound'
    },
    SkeletonComponent: ({ bookshelfView, showSubtitles, orderBy }) => (
      <MediaCardSkeleton bookshelfView={bookshelfView} showSubtitles={showSubtitles} orderBy={orderBy} />
    ),
    CardComponent: ({
      entity,
      bookshelfView,
      width,
      isPodcastLibrary,
      showSubtitles,
      orderBy,
      seriesSortBy,
      mediaItemProgressMap,
      shelfEntities,
      entityIndex,
      collectionMarkFinished
    }) => {
      void seriesSortBy
      const { user, serverSettings, ereaderDevices } = useUser()
      const item = entity as LibraryItem
      const isCollapsedSeries = !!item.collapsedSeries
      const entityProgress = isPodcastLibrary ? null : item.media?.id ? mediaItemProgressMap.get(item.media.id) : undefined
      const EntityMediaCard = isPodcastLibrary ? PodcastMediaCard : BookMediaCard

      if (isCollapsedSeries) {
        return (
          <div style={{ width: `${width}px`, flexShrink: 0 }}>
            <CollapsedSeriesCard
              libraryItem={item}
              bookshelfView={bookshelfView}
              mediaProgress={entityProgress}
              isSelectionMode={false}
              selected={false}
              onSelect={bookshelfCardNoopSelect}
              dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
              timeFormat={serverSettings?.timeFormat ?? 'HH:mm'}
              showSubtitles={showSubtitles ?? false}
              orderBy={orderBy ?? ''}
            />
          </div>
        )
      }

      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
          <EntityMediaCard
            libraryItem={item}
            bookshelfView={bookshelfView}
            mediaProgress={entityProgress}
            isSelectionMode={false}
            selected={false}
            onSelect={bookshelfCardNoopSelect}
            dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
            timeFormat={serverSettings?.timeFormat ?? 'HH:mm'}
            userPermissions={user.permissions}
            ereaderDevices={ereaderDevices}
            showSubtitles={showSubtitles ?? false}
            orderBy={orderBy ?? ''}
            shelfEntities={shelfEntities}
            entityIndex={entityIndex}
            collectionMarkFinished={collectionMarkFinished}
          />
        </div>
      )
    }
  },
  series: {
    getToolbarExtras: (user) => (
      <>
        <LibraryFilterSelect user={user} entityType="series" />
        <LibrarySortSelect entityType="series" />
      </>
    ),
    getContextMenuItems: () => [],
    handleContextMenuAction: () => {},
    getEmptyMessageKey: (filterBy) => (filterBy === 'all' ? 'MessageBookshelfNoSeries' : 'MessageNoSeriesFound'),
    SkeletonComponent: ({ bookshelfView, seriesSortBy }) => <SeriesCardSkeleton bookshelfView={bookshelfView} orderBy={seriesSortBy} />,
    CardComponent: ({ entity, bookshelfView, width, libraryId, seriesSortBy, mediaItemProgressMap }) => {
      const { serverSettings } = useUser()
      const series = entity as Series
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
          <SeriesCard
            series={series}
            libraryId={libraryId ?? ''}
            bookshelfView={bookshelfView}
            dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
            orderBy={seriesSortBy}
            mediaItemProgressMap={mediaItemProgressMap}
          />
        </div>
      )
    }
  },
  authors: {
    getToolbarExtras: (user, library) => (
      <>
        <LibraryFilterSelect user={user} entityType="authors" />
        <LibrarySortSelect entityType="authors" libraryMediaType={library.mediaType} />
      </>
    ),
    getContextMenuItems: (user) => {
      if (user.permissions?.update) {
        return [{ textKey: 'ButtonMatchAllAuthors', action: 'match-all-authors' }]
      }
      return []
    },
    handleContextMenuAction: (action) => {
      if (action === 'match-all-authors') {
        // TODO: Implement match all authors
        console.log('Match all authors - to be implemented')
      }
    },
    getEmptyMessageKey: () => 'MessageNoAuthorsFound',
    SkeletonComponent: () => <AuthorCardSkeleton />,
    CardComponent: ({ entity, width }) => {
      const author = entity as Author
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
          <AuthorCard author={author} />
        </div>
      )
    }
  },
  collections: {
    getToolbarExtras: () => null,
    getContextMenuItems: () => [],
    handleContextMenuAction: () => {},
    getEmptyMessageKey: (filterBy) => (filterBy === 'all' ? 'MessageBookshelfNoCollections' : 'MessageNoCollectionsFound'),
    SkeletonComponent: ({ bookshelfView }) => <CollectionCardSkeleton bookshelfView={bookshelfView} />,
    CardComponent: ({ entity, bookshelfView, width }) => {
      const collection = entity as Collection
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
          <CollectionCard collection={collection} bookshelfView={bookshelfView} />
        </div>
      )
    }
  },
  playlists: {
    getToolbarExtras: () => null,
    getContextMenuItems: () => [],
    handleContextMenuAction: () => {},
    getEmptyMessageKey: () => 'MessageNoUserPlaylists',
    SkeletonComponent: ({ bookshelfView }) => <PlaylistCardSkeleton bookshelfView={bookshelfView} />,
    CardComponent: ({ entity, bookshelfView, width }) => {
      const playlist = entity as Playlist
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
          <PlaylistCard playlist={playlist} bookshelfView={bookshelfView} />
        </div>
      )
    }
  }
}
