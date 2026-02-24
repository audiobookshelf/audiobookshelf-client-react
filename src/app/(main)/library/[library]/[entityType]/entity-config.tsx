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
import { UpdateSettingFn } from '@/contexts/LibraryContext'
import {
  Author,
  BookshelfEntity,
  BookshelfView,
  Collection,
  EntityType,
  Library,
  LibraryItem,
  MediaProgress,
  Playlist,
  Series,
  User,
  UserLoginResponse
} from '@/types/api'
import { TranslationKey } from '@/types/translations'
import React, { ReactNode } from 'react'

export interface SkeletonComponentProps {
  coverAspectRatio: 0 | 1
  seriesSortBy?: string
  showSubtitles?: boolean
  orderBy?: string
}

export interface CardComponentProps {
  entity: BookshelfEntity
  width: number
  libraryId?: string
  isPodcastLibrary?: boolean
  coverAspectRatio: 0 | 1
  showSubtitles?: boolean
  currentUser: UserLoginResponse
  orderBy?: string
  seriesSortBy?: string
  bookProgressMap: Map<string, MediaProgress>
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
    SkeletonComponent: ({ coverAspectRatio, showSubtitles, orderBy }) => (
      <MediaCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} showSubtitles={showSubtitles} orderBy={orderBy} />
    ),
    CardComponent: ({ entity, width, isPodcastLibrary, coverAspectRatio, showSubtitles, currentUser, orderBy, bookProgressMap }) => {
      const item = entity as LibraryItem
      const isCollapsedSeries = !!item.collapsedSeries
      const entityProgress = isPodcastLibrary ? null : bookProgressMap.get(item.id)
      const EntityMediaCard = isPodcastLibrary ? PodcastMediaCard : BookMediaCard

      if (isCollapsedSeries) {
        return (
          <div style={{ width: `${width}px`, flexShrink: 0 }}>
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
            showSubtitles={showSubtitles ?? false}
            orderBy={orderBy ?? ''}
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
    SkeletonComponent: ({ coverAspectRatio, seriesSortBy }) => (
      <SeriesCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} orderBy={seriesSortBy} />
    ),
    CardComponent: ({ entity, width, libraryId, coverAspectRatio, currentUser, seriesSortBy, bookProgressMap }) => {
      const series = entity as Series
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
          <SeriesCard
            series={series}
            libraryId={libraryId ?? ''}
            bookshelfView={BookshelfView.DETAIL}
            bookCoverAspectRatio={coverAspectRatio}
            dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
            orderBy={seriesSortBy}
            bookProgressMap={bookProgressMap}
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
    CardComponent: ({ entity, width, currentUser }) => {
      const author = entity as Author
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
          <AuthorCard author={author} user={currentUser.user} />
        </div>
      )
    }
  },
  collections: {
    getToolbarExtras: () => null,
    getContextMenuItems: () => [],
    handleContextMenuAction: () => {},
    getEmptyMessageKey: (filterBy) => (filterBy === 'all' ? 'MessageBookshelfNoCollections' : 'MessageNoCollectionsFound'),
    SkeletonComponent: ({ coverAspectRatio }) => <CollectionCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} />,
    CardComponent: ({ entity, width, coverAspectRatio, currentUser }) => {
      const collection = entity as Collection
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
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
  },
  playlists: {
    getToolbarExtras: () => null,
    getContextMenuItems: () => [],
    handleContextMenuAction: () => {},
    getEmptyMessageKey: () => 'MessageNoUserPlaylists',
    SkeletonComponent: ({ coverAspectRatio }) => <PlaylistCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} />,
    CardComponent: ({ entity, width, coverAspectRatio, currentUser }) => {
      const playlist = entity as Playlist
      return (
        <div style={{ width: `${width}px`, flexShrink: 0 }}>
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
  }
}
