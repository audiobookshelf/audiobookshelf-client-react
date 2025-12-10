'use client'

import { MediaProvider } from '@/contexts/MediaContext'
import { BookLibraryItem, Collection, LibraryItem, Playlist, PodcastLibraryItem, Series } from '@/types/api'
import { BookMediaCardExamples } from './media-card/BookMediaCardExamples'
import { CollectionCardExamples } from './media-card/CollectionCardExamples'
import { PlaylistCardExamples } from './media-card/PlaylistCardExamples'
import { PodcastMediaCardExamples } from './media-card/PodcastMediaCardExamples'
import { SeriesCardExamples } from './media-card/SeriesCardExamples'

export interface MediaCardExamplesProps {
  selectedBook?: BookLibraryItem | null
  selectedPodcast?: PodcastLibraryItem | null
  /** Selected series from search results */
  selectedSeries?: { series: Series; books: LibraryItem[] } | null
  /** Selected collection from search results */
  selectedCollection?: Collection | null
  /** Selected playlist from search results */
  selectedPlaylist?: Playlist | null
  /** All books from search results for creating varied playlist examples */
  allBooks?: BookLibraryItem[]
}

export function MediaCardExamples({
  selectedBook,
  selectedPodcast,
  selectedSeries,
  selectedCollection,
  selectedPlaylist,
  allBooks = []
}: MediaCardExamplesProps) {
  // Get libraryId from real series data or fall back to selectedBook
  const seriesLibraryId = selectedSeries?.books?.[0]?.libraryId ?? selectedBook?.libraryId ?? ''

  // Series data - only from real selection
  const seriesData: Series | null = selectedSeries ? ({ ...selectedSeries.series, books: selectedSeries.books } as Series) : null

  return (
    <MediaProvider>
      {/* Book/Podcast Media Cards - only when book or podcast is selected */}
      {(selectedBook || selectedPodcast) && (
        <>
          {selectedBook && <BookMediaCardExamples selectedBook={selectedBook} />}
          {selectedPodcast && <PodcastMediaCardExamples selectedPodcast={selectedPodcast} />}
        </>
      )}

      {/* Series Cards - only when series is selected */}
      {seriesData && <SeriesCardExamples seriesData={seriesData} libraryId={seriesLibraryId} />}

      {/* Collection Cards - only when collection is selected */}
      {selectedCollection && <CollectionCardExamples collectionData={selectedCollection} />}

      {/* Playlist Cards - only when playlist is selected */}
      {selectedPlaylist && <PlaylistCardExamples playlistData={selectedPlaylist} allBooks={allBooks} />}
    </MediaProvider>
  )
}
