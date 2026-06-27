'use client'

import { searchLibraryAction } from '@/app/actions/searchActions'
import BookShelfRow from '@/components/widgets/BookShelfRow'
import ItemSlider from '@/components/widgets/ItemSlider'
import { AuthorCard } from '@/components/widgets/media-card/AuthorCard'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import MetadataFilterCard from '@/components/widgets/media-card/MetadataFilterCard'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryItemUpdated } from '@/hooks/useLibraryItemUpdated'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { applyLibraryItemUpdateToShelves } from '@/lib/libraryItemUpdatedUtils'
import { searchResultsToShelves } from '@/lib/searchResultsToShelves'
import { Author, BookshelfView, LibraryItem, MediaProgress, PersonalizedShelf, SearchLibraryResponse, Series } from '@/types/api'
import type { GenreShelfEntity, NarratorShelfEntity, SearchShelf, TagShelfEntity } from '@/types/search'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface SearchClientProps {
  initialQuery: string
  initialResults: SearchLibraryResponse | null
}

export default function SearchClient({ initialQuery, initialResults }: SearchClientProps) {
  const t = useTypeSafeTranslations()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q')?.trim() ?? ''
  const { sizeMultiplier } = useCardSize()
  const { user, serverSettings, ereaderDevices, getMediaItemProgress } = useUser()
  const { library, homeBookshelfView } = useLibrary()

  const [query, setQuery] = useState(initialQuery)
  const [shelves, setShelves] = useState<SearchShelf[]>(() => searchResultsToShelves(initialResults, t))

  useEffect(() => {
    setQuery(initialQuery)
    setShelves(searchResultsToShelves(initialResults, t))
  }, [initialQuery, initialResults, t])

  useEffect(() => {
    if (!urlQuery || urlQuery === initialQuery) return

    let cancelled = false

    searchLibraryAction(library.id, urlQuery)
      .then((results) => {
        if (!cancelled) {
          setQuery(urlQuery)
          setShelves(searchResultsToShelves(results, t))
        }
      })
      .catch((error) => {
        console.error('Failed to search library', error)
        if (!cancelled) {
          setQuery(urlQuery)
          setShelves([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [urlQuery, initialQuery, library.id, t])

  const handleItemUpdated = useCallback((updatedItem: LibraryItem) => {
    setShelves((prev) => applyLibraryItemUpdateToShelves(prev as PersonalizedShelf[], updatedItem) as SearchShelf[])
  }, [])

  useLibraryItemUpdated(library.id, handleItemUpdated)

  const hasResults = shelves.length > 0

  return (
    <div className="pb-20" style={{ fontSize: sizeMultiplier + 'rem' }}>
      {hasResults ? (
        shelves.map((shelf) => {
          const Wrapper = homeBookshelfView === BookshelfView.STANDARD ? BookShelfRow : ItemSlider

          return (
            <Wrapper key={shelf.id} title={shelf.label}>
              {shelf.entities.map((entity, entityIndex) => {
                if (shelf.type === 'book' || shelf.type === 'podcast') {
                  const EntityMediaCard = shelf.type === 'book' ? BookMediaCard : PodcastMediaCard
                  const libraryItem = entity as LibraryItem
                  const mediaProgress = libraryItem.media?.id ? getMediaItemProgress(libraryItem.media.id) : undefined
                  const shelfLibraryItems = shelf.entities as LibraryItem[]

                  return (
                    <div key={libraryItem.id + '-' + shelf.id} className="mx-2e shrink-0">
                      <EntityMediaCard
                        libraryItem={libraryItem}
                        bookshelfView={homeBookshelfView}
                        dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                        timeFormat={serverSettings?.timeFormat ?? 'HH:mm'}
                        userPermissions={user.permissions}
                        ereaderDevices={ereaderDevices}
                        showSubtitles={true}
                        mediaProgress={mediaProgress}
                        shelfEntities={shelfLibraryItems}
                        entityIndex={entityIndex}
                      />
                    </div>
                  )
                }

                if (shelf.type === 'series') {
                  const series = entity as Series
                  const libraryItems = series.books || []
                  const mediaItemProgressMap = new Map<string, MediaProgress>()
                  libraryItems.forEach((libraryItem) => {
                    const mediaProgress = libraryItem.media?.id ? getMediaItemProgress(libraryItem.media.id) : undefined
                    if (mediaProgress) {
                      const key = mediaProgress.mediaItemId ?? libraryItem.media?.id
                      if (key) mediaItemProgressMap.set(key, mediaProgress)
                    }
                  })

                  return (
                    <div key={series.id + '-' + shelf.id} className="mx-2e shrink-0">
                      <SeriesCard
                        series={series}
                        libraryId={library.id}
                        bookshelfView={homeBookshelfView}
                        dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                        mediaItemProgressMap={mediaItemProgressMap}
                      />
                    </div>
                  )
                }

                if (shelf.type === 'episode') {
                  const libraryItem = entity as LibraryItem
                  const episode = libraryItem.recentEpisode
                  if (!episode) return null

                  const mediaProgress = getMediaItemProgress(episode.id)
                  const shelfLibraryItems = shelf.entities as LibraryItem[]
                  return (
                    <div key={episode.id + '-' + shelf.id} className="mx-2e shrink-0">
                      <PodcastEpisodeCard
                        libraryItem={libraryItem}
                        bookshelfView={homeBookshelfView}
                        dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                        timeFormat={serverSettings?.timeFormat ?? 'HH:mm'}
                        userPermissions={user.permissions}
                        ereaderDevices={ereaderDevices}
                        showSubtitles={true}
                        mediaProgress={mediaProgress}
                        shelfEntities={shelfLibraryItems}
                        entityIndex={entityIndex}
                      />
                    </div>
                  )
                }

                if (shelf.type === 'authors') {
                  const author = entity as Author
                  return (
                    <div key={author.id + '-' + shelf.id} className="mx-2e shrink-0">
                      <AuthorCard author={author} />
                    </div>
                  )
                }

                if (shelf.type === 'tags') {
                  const tag = entity as TagShelfEntity
                  return (
                    <div key={tag.name + '-' + shelf.id} className="mx-2e shrink-0">
                      <MetadataFilterCard name={tag.name} count={tag.numItems} filterKey="tags" icon="label" />
                    </div>
                  )
                }

                if (shelf.type === 'genres') {
                  const genre = entity as GenreShelfEntity
                  return (
                    <div key={genre.name + '-' + shelf.id} className="mx-2e shrink-0">
                      <MetadataFilterCard name={genre.name} count={genre.numItems} filterKey="genres" icon="category" />
                    </div>
                  )
                }

                if (shelf.type === 'narrators') {
                  const narrator = entity as NarratorShelfEntity
                  return (
                    <div key={narrator.name + '-' + shelf.id} className="mx-2e shrink-0">
                      <MetadataFilterCard name={narrator.name} count={narrator.numBooks} filterKey="narrators" icon="record_voice_over" />
                    </div>
                  )
                }

                return null
              })}
            </Wrapper>
          )
        })
      ) : (
        <div className="w-full py-16">
          <p className="text-center text-xl">{t('MessageNoSearchResultsFor', { 0: query })}</p>
        </div>
      )}
    </div>
  )
}
