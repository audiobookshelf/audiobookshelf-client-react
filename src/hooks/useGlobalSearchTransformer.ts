import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { SearchLibraryResponse } from '@/types/api'
import { useMemo } from 'react'

export type SearchResultType = 'book' | 'podcast' | 'episode' | 'author' | 'series' | 'tag' | 'genre' | 'narrator' | 'collection' | 'playlist' | 'header'

export interface FlatResultItem {
  type: SearchResultType
  id: string
  title: string
  subtitle?: string
  link?: string
  imageSrc?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originalItem?: any
  isPlaceholder?: boolean // For "Thinking", "No Results"
  placeholderText?: string
  author?: string
}

interface UseGlobalSearchTransformerProps {
  searchResults: SearchLibraryResponse | null
  searchQuery: string
  isSearching: boolean
  isTyping: boolean
  searchError: string | null
  selectedLibraryId: string
}

export function useGlobalSearchTransformer({
  searchResults,
  searchQuery,
  isSearching,
  isTyping,
  searchError,
  selectedLibraryId
}: UseGlobalSearchTransformerProps) {
  const t = useTypeSafeTranslations()

  const flatResults = useMemo(() => {
    // If not searching and no results (and no query), empty
    if (!searchQuery && !searchResults) return []

    const results: FlatResultItem[] = []

    const addGroup = <T>(items: T[] | undefined, headerId: string, headerTitle: string, mapItem: (item: T) => FlatResultItem | null) => {
      if (items?.length) {
        results.push({ type: 'header', id: headerId, title: headerTitle })
        items.slice(0, 3).forEach((item) => {
          const mapped = mapItem(item)
          if (mapped) results.push(mapped)
        })
      }
    }

    // Only show "Thinking" or "Error" as list items if we have no results to show
    // otherwise the spinner in the input handles the "Thinking" state feedback
    const hasResults =
      searchResults &&
      (searchResults.book?.length ||
        searchResults.podcast?.length ||
        searchResults.episodes?.length ||
        searchResults.authors?.length ||
        searchResults.series?.length ||
        searchResults.tags?.length ||
        searchResults.genres?.length ||
        searchResults.narrators?.length ||
        searchResults.collections?.length ||
        searchResults.playlists?.length)

    if ((isSearching || isTyping) && !hasResults) {
      results.push({ type: 'header', id: 'thinking', title: '', isPlaceholder: true, placeholderText: t('MessageThinking') })
    }

    if (searchError) {
      results.push({ type: 'header', id: 'error', title: '', isPlaceholder: true, placeholderText: searchError })
    }

    if (!searchResults) return results

    const isEmpty = !hasResults

    if (isEmpty && searchQuery && !isSearching && !isTyping && !searchError) {
      results.push({ type: 'header', id: 'no-results', title: '', isPlaceholder: true, placeholderText: t('MessageNoResults') })
      return results
    }

    // Continue if we have results (even if searching)

    // Books
    addGroup(searchResults.book, 'header-books', t('LabelBooks'), (item) => ({
      type: 'book',
      id: item.libraryItem.id,
      title: item.libraryItem.media.metadata.title || 'Unknown Title',
      subtitle: item.libraryItem.media.metadata.subtitle,
      author: item.libraryItem.media.metadata.authorName,
      link: `/library/${item.libraryItem.libraryId}/item/${item.libraryItem.id}`,
      imageSrc: getLibraryItemCoverSrc(item.libraryItem, getPlaceholderCoverUrl()),
      originalItem: item.libraryItem
    }))

    // Podcasts
    addGroup(searchResults.podcast, 'header-podcasts', t('LabelPodcasts'), (item) => ({
      type: 'podcast',
      id: item.libraryItem.id,
      title: item.libraryItem.media.metadata.title || 'Unknown Podcast',
      subtitle: item.libraryItem.media.metadata.author,
      link: `/library/${item.libraryItem.libraryId}/item/${item.libraryItem.id}`,
      imageSrc: getLibraryItemCoverSrc(item.libraryItem, getPlaceholderCoverUrl()),
      originalItem: item.libraryItem
    }))

    // Episodes
    addGroup(searchResults.episodes, 'header-episodes', t('LabelEpisodes'), (item) => {
      const libItem = item.libraryItem
      const episode = libItem.recentEpisode
      if (!episode) return null
      return {
        type: 'episode',
        id: episode.id,
        title: episode.title, // Episode Title
        subtitle: libItem.media.metadata.title, // Podcast Title as subtitle
        link: `/library/${libItem.libraryId}/item/${libItem.id}`,
        imageSrc: getLibraryItemCoverSrc(libItem, getPlaceholderCoverUrl()),
        originalItem: episode
      }
    })

    // Authors
    addGroup(searchResults.authors, 'header-authors', t('LabelAuthors'), (author) => ({
      type: 'author',
      id: author.id,
      title: author.name,
      subtitle: author.numBooks ? `${author.numBooks} books` : undefined,
      link: `/library/${author.libraryId}/authors/${author.id}`,
      originalItem: author
    }))

    // Series
    addGroup(searchResults.series, 'header-series', t('LabelSeries'), (item) => {
      // Use series cover or fallback to first book cover
      let imageSrc = ''
      if (item.series.coverPath) {
        imageSrc = `/api/series/${item.series.id}/cover?ts=${item.series.updatedAt || 0}`
      } else if (item.books.length > 0) {
        imageSrc = getLibraryItemCoverSrc(item.books[0], getPlaceholderCoverUrl())
      }

      return {
        type: 'series',
        id: item.series.id,
        title: item.series.name,
        subtitle: item.books?.length ? `${item.books.length} books` : undefined,
        link: `/library/${selectedLibraryId}/series/${item.series.id}`,
        imageSrc,
        originalItem: { ...item.series, books: item.books }
      }
    })

    // Tags
    addGroup(searchResults.tags, 'header-tags', t('LabelTags'), (tag) => ({
      type: 'tag',
      id: `tag-${tag.name}`,
      title: tag.name,
      subtitle: `${tag.numItems} items`,
      link: `/library/${selectedLibraryId}/bookshelf?filter=tags.${encodeURIComponent(tag.name)}`
    }))

    // Genres
    addGroup(searchResults.genres, 'header-genres', t('LabelGenres'), (genre) => ({
      type: 'genre',
      id: `genre-${genre.name}`,
      title: genre.name,
      subtitle: `${genre.numItems} items`,
      link: `/library/${selectedLibraryId}/bookshelf?filter=genres.${encodeURIComponent(genre.name)}`
    }))

    // Narrators
    addGroup(searchResults.narrators, 'header-narrators', t('LabelNarrators'), (narrator) => ({
      type: 'narrator',
      id: `narrator-${narrator.name}`,
      title: narrator.name,
      subtitle: `${narrator.numBooks} books`,
      link: `/library/${selectedLibraryId}/bookshelf?filter=narrators.${encodeURIComponent(narrator.name)}`
    }))

    // Collections
    addGroup(searchResults.collections, 'header-collections', t('LabelCollections'), (collection) => ({
      type: 'collection',
      id: `collection-${collection.id}`,
      title: collection.name,
      subtitle: collection.books?.length ? `${collection.books.length} books` : undefined,
      link: `/library/${selectedLibraryId}/collection/${collection.id}`,
      originalItem: collection
    }))

    // Playlists
    addGroup(searchResults.playlists, 'header-playlists', t('LabelPlaylists'), (playlist) => ({
      type: 'playlist',
      id: `playlist-${playlist.id}`,
      title: playlist.name,
      subtitle: playlist.items?.length ? `${playlist.items.length} items` : undefined,
      link: `/library/${selectedLibraryId}/playlist/${playlist.id}`,
      originalItem: playlist
    }))

    return results
  }, [searchResults, selectedLibraryId, searchQuery, isSearching, t, isTyping, searchError])

  return flatResults
}
