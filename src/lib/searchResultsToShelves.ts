import type { SearchLibraryResponse } from '@/types/api'
import type { SearchShelf } from '@/types/search'
import type { TypeSafeTranslations } from '@/types/translations'

export function searchResultsHasResults(results: SearchLibraryResponse | null): boolean {
  if (!results) return false

  return !!(
    results.book?.length ||
    results.podcast?.length ||
    results.episodes?.length ||
    results.authors?.length ||
    results.series?.length ||
    results.tags?.length ||
    results.genres?.length ||
    results.narrators?.length
  )
}

export function searchResultsToShelves(results: SearchLibraryResponse | null, t: TypeSafeTranslations): SearchShelf[] {
  if (!results) return []

  const shelves: SearchShelf[] = []

  if (results.book?.length) {
    shelves.push({
      id: 'books',
      label: t('LabelBooks'),
      type: 'book',
      entities: results.book.map((res) => res.libraryItem),
      total: results.book.length
    })
  }

  if (results.podcast?.length) {
    shelves.push({
      id: 'podcasts',
      label: t('LabelPodcasts'),
      type: 'podcast',
      entities: results.podcast.map((res) => res.libraryItem),
      total: results.podcast.length
    })
  }

  if (results.episodes?.length) {
    shelves.push({
      id: 'episodes',
      label: t('LabelEpisodes'),
      type: 'episode',
      entities: results.episodes.map((res) => res.libraryItem),
      total: results.episodes.length
    })
  }

  if (results.series?.length) {
    shelves.push({
      id: 'series',
      label: t('LabelSeries'),
      type: 'series',
      entities: results.series.map((seriesObj) => ({
        ...seriesObj.series,
        books: seriesObj.books
      })),
      total: results.series.length
    })
  }

  if (results.authors?.length) {
    shelves.push({
      id: 'authors',
      label: t('LabelAuthors'),
      type: 'authors',
      entities: results.authors,
      total: results.authors.length
    })
  }

  if (results.tags?.length) {
    shelves.push({
      id: 'tags',
      label: t('LabelTags'),
      type: 'tags',
      entities: results.tags.map((tagObj) => ({
        name: tagObj.name,
        type: 'tags' as const,
        numItems: tagObj.numItems
      })),
      total: results.tags.length
    })
  }

  if (results.genres?.length) {
    shelves.push({
      id: 'genres',
      label: t('LabelGenres'),
      type: 'genres',
      entities: results.genres.map((genreObj) => ({
        name: genreObj.name,
        type: 'genres' as const,
        numItems: genreObj.numItems
      })),
      total: results.genres.length
    })
  }

  if (results.narrators?.length) {
    shelves.push({
      id: 'narrators',
      label: t('LabelNarrators'),
      type: 'narrators',
      entities: results.narrators.map((n) => ({
        name: n.name,
        numBooks: n.numBooks,
        type: 'narrator' as const
      })),
      total: results.narrators.length
    })
  }

  return shelves
}
