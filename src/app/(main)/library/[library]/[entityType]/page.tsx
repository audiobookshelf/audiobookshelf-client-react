import { staticPageMetadata } from '@/lib/pageMetadata'
import { EntityType } from '@/types/api'
import type { TranslationKey } from '@/types/translations'
import type { Metadata } from 'next'
import BookshelfClient from './BookshelfClient'

const ENTITY_PAGE_TITLE_KEYS: Record<EntityType, TranslationKey> = {
  items: 'TitleAudiobookshelfLibraryItems',
  series: 'TitleAudiobookshelfSeries',
  collections: 'TitleAudiobookshelfCollections',
  playlists: 'TitleAudiobookshelfPlaylists',
  authors: 'TitleAudiobookshelfAuthors'
}

function isEntityType(value: string): value is EntityType {
  return value in ENTITY_PAGE_TITLE_KEYS
}

export async function generateMetadata({ params }: { params: Promise<{ library: string; entityType: string }> }): Promise<Metadata> {
  const { entityType } = await params
  const titleKey = isEntityType(entityType) ? ENTITY_PAGE_TITLE_KEYS[entityType] : 'TitleAudiobookshelf'

  return staticPageMetadata(titleKey)
}

export default async function EntityPage({ params }: { params: Promise<{ library: string; entityType: string }> }) {
  const { entityType: entityTypeString } = await params
  const entityType = entityTypeString as EntityType

  return (
    <div className="h-full w-full">
      <BookshelfClient key={entityType} entityType={entityType} />
    </div>
  )
}
