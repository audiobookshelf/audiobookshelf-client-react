import AuthorCardSkeleton from '@/components/widgets/media-card/AuthorCardSkeleton'
import CollectionCardSkeleton from '@/components/widgets/media-card/CollectionCardSkeleton'
import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import PlaylistCardSkeleton from '@/components/widgets/media-card/PlaylistCardSkeleton'
import SeriesCardSkeleton from '@/components/widgets/media-card/SeriesCardSkeleton'
import { BookshelfView, EntityType } from '@/types/api'

interface EntityCardSkeletonProps {
  entityType: EntityType
  coverAspectRatio: number
  seriesSortBy: string
  showSubtitles: boolean
  orderBy: string
}

export default function EntityCardSkeleton({ entityType, coverAspectRatio, seriesSortBy, showSubtitles, orderBy }: EntityCardSkeletonProps) {
  switch (entityType) {
    case 'series':
      return <SeriesCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} orderBy={seriesSortBy} />
    case 'collections':
      return <CollectionCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} />
    case 'playlists':
      return <PlaylistCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} />
    case 'authors':
      return <AuthorCardSkeleton />
    default:
      return <MediaCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} showSubtitles={showSubtitles} orderBy={orderBy} />
  }
}
