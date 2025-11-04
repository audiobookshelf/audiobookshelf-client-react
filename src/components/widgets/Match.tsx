'use client'

import { applyMatchAction, searchBooksAction, searchPodcastsAction } from '@/app/actions/matchActions'
import BookMatchCard from '@/components/cards/BookMatchCard'
import PreviewCover from '@/components/covers/PreviewCover'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import SlateEditor from '@/components/ui/SlateEditor'
import TextInput from '@/components/ui/TextInput'
import TwoStageMultiSelect from '@/components/ui/TwoStageMultiSelect'
import { useBookProviders, useMetadata, usePodcastProviders } from '@/contexts/MetadataContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import {
  AuthorMinified,
  BookLibraryItem,
  BookSearchResult,
  isBookMedia,
  isPodcastMedia,
  PodcastLibraryItem,
  PodcastSearchResult,
  SeriesMinified,
  UpdateLibraryItemMediaPayload
} from '@/types/api'
import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface MatchProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  availableAuthors?: MultiSelectItem<string>[]
  availableNarrators?: MultiSelectItem<string>[]
  availableGenres?: MultiSelectItem<string>[]
  availableTags?: MultiSelectItem<string>[]
  availableSeries?: MultiSelectItem<string>[]
  bookCoverAspectRatio: number
}

type MatchResult = BookSearchResult | PodcastSearchResult

interface MatchUsage {
  title: boolean
  subtitle: boolean
  cover: boolean
  author: boolean
  narrator: boolean
  description: boolean
  publisher: boolean
  publishedYear: boolean
  series: boolean
  genres: boolean
  tags: boolean
  language: boolean
  explicit: boolean
  asin: boolean
  isbn: boolean
  abridged: boolean
  itunesPageUrl: boolean
  itunesId: boolean
  feedUrl: boolean
  releaseDate: boolean
}

export default function Match({
  libraryItem,
  availableNarrators = [],
  availableGenres = [],
  availableTags = [],
  availableSeries = [],
  bookCoverAspectRatio
}: MatchProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { ensureProvidersLoaded, providersLoaded } = useMetadata()
  const bookProviders = useBookProviders()
  const podcastProviders = usePodcastProviders()

  const isPodcast = useMemo(() => libraryItem.mediaType === 'podcast', [libraryItem.mediaType])

  const providers = useMemo(() => {
    return isPodcast ? podcastProviders : bookProviders
  }, [isPodcast, bookProviders, podcastProviders])

  const [isPendingSearch, startSearchTransition] = useTransition()
  const [isPendingApply, startApplyTransition] = useTransition()

  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [provider, setProvider] = useState<string>(() => {
    // Initialize provider based on media type - will be overridden when providers load
    return 'google'
  })
  const [searchResults, setSearchResults] = useState<(BookSearchResult | PodcastSearchResult)[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)
  const [selectedMatchOrig, setSelectedMatchOrig] = useState<MatchResult | null>(null)
  const [selectedMatchUsage, setSelectedMatchUsage] = useState<MatchUsage>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('selectedMatchUsage')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          title: true,
          subtitle: true,
          cover: true,
          author: true,
          narrator: true,
          description: true,
          publisher: true,
          publishedYear: true,
          series: true,
          genres: true,
          tags: true,
          language: true,
          explicit: true,
          asin: true,
          isbn: true,
          abridged: true,
          itunesPageUrl: true,
          itunesId: true,
          feedUrl: true,
          releaseDate: true,
          ...parsed
        }
      }
    } catch (error) {
      console.error('Failed to load saved selectedMatchUsage', error)
    }
    return {
      title: true,
      subtitle: true,
      cover: true,
      author: true,
      narrator: true,
      description: true,
      publisher: true,
      publishedYear: true,
      series: true,
      genres: true,
      tags: true,
      language: true,
      explicit: true,
      asin: true,
      isbn: true,
      abridged: true,
      itunesPageUrl: true,
      itunesId: true,
      feedUrl: true,
      releaseDate: true
    }
  })

  const [selectAll, setSelectAll] = useState(true)

  const media = useMemo(() => libraryItem.media || {}, [libraryItem.media])
  const mediaMetadata = useMemo(() => media.metadata || {}, [media.metadata])

  const currentBookDuration = useMemo(() => {
    if (isPodcast) return 0
    if (isBookMedia(media)) {
      return media.duration || 0
    }
    return 0
  }, [isPodcast, media])

  const coverUrl = useMemo(() => {
    if (!media.coverPath) return null
    return getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true)
  }, [media.coverPath, libraryItem.id, libraryItem.updatedAt])

  const providerItems = useMemo(() => {
    return providers.map((p) => ({ text: p.text, value: p.value }))
  }, [providers])

  // Ensure provider value exists in providerItems
  const validProvider = useMemo(() => {
    if (providerItems.length === 0) return provider
    const isValid = providerItems.some((item) => item.value === provider)
    if (!isValid && providerItems.length > 0) {
      return providerItems[0].value as string
    }
    return provider
  }, [provider, providerItems])

  const searchTitleLabel = useMemo(() => {
    if (validProvider.startsWith('audible')) return t('LabelSearchTitleOrASIN')
    else if (validProvider === 'itunes') return t('LabelSearchTerm')
    return t('LabelSearchTitle')
  }, [validProvider, t])

  // Initialize component when library item changes
  useEffect(() => {
    ensureProvidersLoaded()

    if (libraryItem.id) {
      setSearchResults([])
      setHasSearched(false)
      setSelectedMatch(null)
      setSelectedMatchOrig(null)

      if (mediaMetadata.title) {
        setSearchTitle(mediaMetadata.title)
        if (!isPodcast && isBookMedia(media)) {
          const bookMetadata = media.metadata
          const authorName = bookMetadata.authors && bookMetadata.authors.length > 0 ? bookMetadata.authors.map((a) => a.name).join(', ') : ''
          setSearchAuthor(authorName)
        } else if (isPodcast && isPodcastMedia(media)) {
          setSearchAuthor(media.metadata.author || '')
        } else {
          setSearchAuthor('')
        }
      } else {
        setSearchTitle('')
        setSearchAuthor('')
      }
    }
  }, [libraryItem.id, mediaMetadata, isPodcast, ensureProvidersLoaded, media])

  // Set provider when providers are loaded or change
  useEffect(() => {
    if (!providersLoaded || providers.length === 0) return

    if (isPodcast) {
      setProvider('itunes')
    } else {
      try {
        const savedProvider = localStorage.getItem('book-provider')
        if (savedProvider && providers.some((p) => p.value === savedProvider)) {
          setProvider(savedProvider)
        } else {
          setProvider('google')
        }
      } catch {
        setProvider('google')
      }
    }
  }, [providersLoaded, providers, isPodcast])

  // Prefer using ASIN if set and using audible provider
  useEffect(() => {
    if (!isPodcast && validProvider.startsWith('audible') && 'asin' in mediaMetadata && mediaMetadata.asin) {
      setSearchTitle(mediaMetadata.asin)
      setSearchAuthor('')
    }
  }, [validProvider, isPodcast, mediaMetadata])

  // Auto-search if providers are loaded and we have a title (only on initial load)
  useEffect(() => {
    if (providersLoaded && searchTitle && !hasSearched && libraryItem.id) {
      // Use setTimeout to avoid calling during render
      const timer = setTimeout(() => {
        if (!searchTitle) {
          showToast(t('ToastTitleRequired'), { type: 'error' })
          return
        }

        if (!isPodcast) {
          try {
            localStorage.setItem('book-provider', validProvider)
          } catch (error) {
            console.error('PersistProvider', error)
          }
        }

        startSearchTransition(async () => {
          try {
            if (isPodcast) {
              const results = await searchPodcastsAction(searchTitle)
              // Filter out results without titles and map podcast results
              const mappedResults: PodcastSearchResult[] = results
                .filter((res): res is PodcastSearchResult => !!res.title)
                .map((res) => ({
                  ...res,
                  itunesPageUrl: res.pageUrl || undefined,
                  itunesId: res.id || undefined,
                  author: res.artistName || res.author || undefined,
                  explicit: res.explicit || false
                }))
              setSearchResults(mappedResults)
            } else {
              const results = await searchBooksAction(validProvider, searchTitle, searchAuthor || undefined, libraryItem.id)
              // Filter out results without titles
              const filteredResults = results.filter((res): res is BookSearchResult => !!res.title)
              setSearchResults(filteredResults)
            }
            setHasSearched(true)
          } catch (error) {
            console.error('Search failed', error)
            showToast(error instanceof Error ? error.message : t('ToastFailedToUpdate'), { type: 'error' })
            setSearchResults([])
            setHasSearched(true)
          }
        })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [providersLoaded, libraryItem.id, searchTitle, searchAuthor, validProvider, isPodcast, hasSearched, t, showToast])

  const handleSubmitSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()

      if (!searchTitle) {
        showToast(t('ToastTitleRequired'), { type: 'error' })
        return
      }

      if (!isPodcast) {
        try {
          localStorage.setItem('book-provider', validProvider)
        } catch (error) {
          console.error('PersistProvider', error)
        }
      }

      startSearchTransition(async () => {
        try {
          if (isPodcast) {
            const results = await searchPodcastsAction(searchTitle)
            // Filter out results without titles and map podcast results
            const mappedResults: PodcastSearchResult[] = results
              .filter((res): res is PodcastSearchResult => !!res.title)
              .map((res) => ({
                ...res,
                itunesPageUrl: res.pageUrl || undefined,
                itunesId: res.id || undefined,
                author: res.artistName || res.author || undefined,
                explicit: res.explicit || false
              }))
            setSearchResults(mappedResults)
          } else {
            const results = await searchBooksAction(validProvider, searchTitle, searchAuthor || undefined, libraryItem.id)
            // Filter out results without titles
            const filteredResults = results.filter((res): res is BookSearchResult => !!res.title)
            setSearchResults(filteredResults)
          }
          setHasSearched(true)
        } catch (error) {
          console.error('Search failed', error)
          showToast(error instanceof Error ? error.message : t('ToastFailedToUpdate'), { type: 'error' })
          setSearchResults([])
          setHasSearched(true)
        }
      })
    },
    [searchTitle, searchAuthor, validProvider, isPodcast, libraryItem.id, t, showToast]
  )

  const handleSelectMatch = useCallback((match: BookSearchResult | PodcastSearchResult) => {
    // Process match data
    const processedMatch: BookSearchResult | PodcastSearchResult = { ...match }

    // Process series (only for books)
    if ('series' in processedMatch && processedMatch.series) {
      if (Array.isArray(processedMatch.series) && processedMatch.series.length > 0) {
        // Keep series as-is for BookSearchResult
        // The series will be processed when building the update payload
      } else {
        delete processedMatch.series
      }
    }

    // Process genres
    if (processedMatch.genres && !Array.isArray(processedMatch.genres)) {
      processedMatch.genres = String(processedMatch.genres)
        .split(',')
        .map((g) => g.trim())
        .filter((g) => !!g)
    }

    // Process tags
    if (processedMatch.tags && !Array.isArray(processedMatch.tags)) {
      processedMatch.tags = String(processedMatch.tags)
        .split(',')
        .map((g) => g.trim())
        .filter((g) => !!g)
    }

    // Process narrator (only for books)
    if ('narrator' in processedMatch && processedMatch.narrator && !Array.isArray(processedMatch.narrator)) {
      processedMatch.narrator = String(processedMatch.narrator)
        .split(',')
        .map((g) => g.trim())
        .filter((g) => !!g)
    }

    setSelectedMatch(processedMatch)
    setSelectedMatchOrig(JSON.parse(JSON.stringify(processedMatch)))
  }, [])

  const handleClearSelectedMatch = useCallback(() => {
    setSelectedMatch(null)
    setSelectedMatchOrig(null)
  }, [])

  const handleSelectAllToggle = useCallback(
    (value: boolean) => {
      const newUsage: MatchUsage = { ...selectedMatchUsage }
      Object.keys(newUsage).forEach((key) => {
        const typedKey = key as keyof MatchUsage
        newUsage[typedKey] = value
      })
      setSelectedMatchUsage(newUsage)
      setSelectAll(value)
    },
    [selectedMatchUsage]
  )

  const handleFieldUsageChange = useCallback((field: keyof MatchUsage, value: boolean) => {
    setSelectedMatchUsage((prev) => {
      const updated = { ...prev, [field]: value }
      const allSelected = Object.values(updated).every((v) => v === true)
      setSelectAll(allSelected)
      return updated
    })
  }, [])

  const handleSetMatchFieldValue = useCallback(
    (field: string, value: string | string[] | number | boolean | SeriesMinified[] | AuthorMinified[] | undefined) => {
      if (!selectedMatch) return
      if (Array.isArray(value)) {
        setSelectedMatch({ ...selectedMatch, [field]: [...value] })
      } else {
        setSelectedMatch({ ...selectedMatch, [field]: value })
      }
    },
    [selectedMatch]
  )

  const buildMatchUpdatePayload = useCallback((): UpdateLibraryItemMediaPayload | null => {
    if (!selectedMatch) return null

    const updatePayload: UpdateLibraryItemMediaPayload = { metadata: {} }

    for (const key in selectedMatchUsage) {
      if (selectedMatchUsage[key as keyof MatchUsage]) {
        if (key === 'series' && 'series' in selectedMatch && selectedMatch.series && !isPodcast) {
          const seriesData = selectedMatch.series
          if (Array.isArray(seriesData)) {
            const seriesPayload: SeriesMinified[] = seriesData.map((seriesItem) => ({
              id: `new-${Math.floor(Math.random() * 10000)}`,
              name: seriesItem.series,
              sequence: seriesItem.sequence || ''
            }))
            if (updatePayload.metadata) {
              updatePayload.metadata.series = seriesPayload
            }
          }
        } else if (key === 'author' && 'author' in selectedMatch && selectedMatch.author && !isPodcast) {
          const authors = selectedMatch.author
          if (authors) {
            const authorNames = Array.isArray(authors) ? authors : authors.split(',').map((au: string) => au.trim())
            const authorPayload: AuthorMinified[] = authorNames
              .filter((au: string) => !!au)
              .map((authorName: string) => ({
                id: `new-${Math.floor(Math.random() * 10000)}`,
                name: authorName
              }))
            if (updatePayload.metadata) {
              updatePayload.metadata.authors = authorPayload
            }
          }
        } else if (key === 'narrator' && 'narrator' in selectedMatch && selectedMatch.narrator && !isPodcast) {
          if (updatePayload.metadata) {
            updatePayload.metadata.narrators = Array.isArray(selectedMatch.narrator)
              ? selectedMatch.narrator
              : String(selectedMatch.narrator)
                  .split(',')
                  .map((n: string) => n.trim())
                  .filter((n: string) => !!n)
          }
        } else if (key === 'genres' && 'genres' in selectedMatch && selectedMatch.genres) {
          if (updatePayload.metadata) {
            const genresValue = selectedMatch.genres
            if (genresValue) {
              updatePayload.metadata.genres = Array.isArray(genresValue)
                ? genresValue.filter((g): g is string => !!g)
                : [genresValue].filter((g): g is string => !!g)
            }
          }
        } else if (key === 'tags' && 'tags' in selectedMatch && selectedMatch.tags) {
          const tagsValue = selectedMatch.tags
          if (tagsValue) {
            updatePayload.tags = Array.isArray(tagsValue) ? tagsValue.filter((t): t is string => !!t) : [tagsValue].filter((t): t is string => !!t)
          }
        } else if (key === 'itunesId' && 'itunesId' in selectedMatch && selectedMatch.itunesId && isPodcast) {
          if (updatePayload.metadata) {
            updatePayload.metadata.itunesId = String(selectedMatch.itunesId)
          }
        } else if (key === 'cover' && 'cover' in selectedMatch && selectedMatch.cover) {
          updatePayload.url = selectedMatch.cover
        } else if (key in selectedMatch && selectedMatch[key as keyof typeof selectedMatch] !== undefined) {
          const value = selectedMatch[key as keyof typeof selectedMatch]
          if (
            key === 'title' ||
            key === 'subtitle' ||
            key === 'description' ||
            key === 'publisher' ||
            key === 'publishedYear' ||
            key === 'language' ||
            key === 'isbn' ||
            key === 'asin' ||
            key === 'explicit' ||
            key === 'abridged' ||
            key === 'feedUrl' ||
            key === 'itunesPageUrl' ||
            key === 'releaseDate'
          ) {
            if (updatePayload.metadata) {
              if (key === 'explicit' || key === 'abridged') {
                updatePayload.metadata[key] = value as boolean
              } else {
                updatePayload.metadata[key] = value as string | undefined
              }
            }
          }
        }
      }
    }

    return updatePayload
  }, [selectedMatch, selectedMatchUsage, isPodcast])

  const handleSubmitMatchUpdate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const updatePayload = buildMatchUpdatePayload()
      if (!updatePayload || Object.keys(updatePayload).length === 0) {
        return
      }

      // Persist in local storage
      try {
        localStorage.setItem('selectedMatchUsage', JSON.stringify(selectedMatchUsage))
      } catch (error) {
        console.error('Failed to save selectedMatchUsage', error)
      }

      startApplyTransition(async () => {
        try {
          const result = await applyMatchAction(libraryItem.id, updatePayload)
          if (result?.updated) {
            showToast(t('ToastItemDetailsUpdateSuccess'), { type: 'success' })
          } else {
            showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
          }
          handleClearSelectedMatch()
        } catch (error) {
          console.error('Failed to update', error)
          showToast(error instanceof Error ? error.message : t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [buildMatchUpdatePayload, libraryItem.id, selectedMatchUsage, t, showToast, handleClearSelectedMatch]
  )

  // Compute available options with selected match values
  const allGenres = useMemo(() => {
    const currentGenres = availableGenres.map((g) => g.value)
    const matchGenres = selectedMatch?.genres ? (Array.isArray(selectedMatch.genres) ? selectedMatch.genres : [selectedMatch.genres]) : []
    return [...new Set([...currentGenres, ...matchGenres])].map((g) => ({ value: g, content: g }))
  }, [availableGenres, selectedMatch?.genres])

  const allTags = useMemo(() => {
    const currentTags = availableTags.map((t) => t.value)
    const matchTags = selectedMatch?.tags ? (Array.isArray(selectedMatch.tags) ? selectedMatch.tags : [selectedMatch.tags]) : []
    return [...new Set([...currentTags, ...matchTags])].map((t) => ({ value: t, content: t }))
  }, [availableTags, selectedMatch?.tags])

  const allNarrators = useMemo(() => {
    return availableNarrators
  }, [availableNarrators])

  const seriesItems = useMemo(() => {
    if (!selectedMatch || !('series' in selectedMatch) || !selectedMatch.series) return []
    return selectedMatch.series.map((s: { series: string; sequence?: string; id?: string; name?: string }) => ({
      value: s.id || `new-${Math.floor(Math.random() * 10000)}`,
      content: { value: s.name || s.series, modifier: s.sequence || '' }
    }))
  }, [selectedMatch])

  const handleAddSeries = useCallback(
    (item: MultiSelectItem<{ value: string; modifier: string }>) => {
      if (!selectedMatch) return
      const newSeries: { id: string; name: string; series: string; sequence: string } = {
        id: item.value,
        name: item.content.value,
        series: item.content.value,
        sequence: item.content.modifier
      }
      setSelectedMatch({
        ...selectedMatch,
        series: 'series' in selectedMatch ? [...(selectedMatch.series || []), newSeries] : [newSeries]
      })
    },
    [selectedMatch]
  )

  const handleRemoveSeries = useCallback(
    (item: MultiSelectItem<{ value: string; modifier: string }>) => {
      if (!selectedMatch) return
      setSelectedMatch({
        ...selectedMatch,
        series:
          'series' in selectedMatch ? (selectedMatch.series || []).filter((s: { series: string; sequence?: string; id?: string }) => s.id !== item.value) : []
      })
    },
    [selectedMatch]
  )

  const handleEditSeries = useCallback(
    (item: MultiSelectItem<{ value: string; modifier: string }>, index: number) => {
      if (!selectedMatch) return
      const editedSeries: { id: string; name: string; series: string; sequence: string } = {
        id: item.value,
        name: item.content.value,
        series: item.content.value,
        sequence: item.content.modifier
      }
      const newSeriesList = 'series' in selectedMatch ? [...(selectedMatch.series || [])] : []
      newSeriesList[index] = editedSeries
      setSelectedMatch({ ...selectedMatch, series: newSeriesList })
    },
    [selectedMatch]
  )

  return (
    <div className="w-full h-full overflow-hidden px-2 md:px-4 py-4 md:py-6 relative">
      {!selectedMatchOrig ? (
        <>
          <form onSubmit={handleSubmitSearch}>
            <div className="flex flex-wrap md:flex-nowrap items-center justify-start -mx-1">
              {providersLoaded && providers.length > 0 && (
                <div className="w-40 px-1">
                  <Dropdown
                    value={validProvider}
                    items={providerItems}
                    disabled={isPendingSearch}
                    label={t('LabelProvider')}
                    size="small"
                    onChange={(val) => {
                      setProvider(String(val))
                      // Persist provider preference
                      if (!isPodcast) {
                        try {
                          localStorage.setItem('book-provider', String(val))
                        } catch (error) {
                          console.error('Failed to save provider preference', error)
                        }
                      }
                    }}
                  />
                </div>
              )}
              <div className="grow md:w-72 px-1">
                <TextInput
                  value={searchTitle}
                  onChange={setSearchTitle}
                  disabled={isPendingSearch}
                  label={searchTitleLabel}
                  placeholder={t('PlaceholderSearch')}
                />
              </div>
              {validProvider !== 'itunes' && !isPodcast && (
                <div className="w-60 md:w-72 px-1">
                  <TextInput value={searchAuthor} onChange={setSearchAuthor} disabled={isPendingSearch} label={t('LabelAuthor')} />
                </div>
              )}
              <Btn className="mt-5 ml-1" type="submit" disabled={isPendingSearch} loading={isPendingSearch}>
                {t('ButtonSearch')}
              </Btn>
            </div>
          </form>

          {isPendingSearch && (
            <div className="flex h-full items-center justify-center">
              <p>{t('MessageLoading')}</p>
            </div>
          )}

          {!isPendingSearch && !searchResults.length && hasSearched && (
            <div className="flex h-full items-center justify-center">
              <p>{t('MessageNoResults')}</p>
            </div>
          )}

          {!isPendingSearch && (
            <div className="w-full max-h-full overflow-y-auto overflow-x-hidden mt-4" style={{ height: 'calc(100% - 124px)' }}>
              {searchResults.map((result, index) => (
                <BookMatchCard key={index} book={result} isPodcast={isPodcast} currentBookDuration={currentBookDuration} onSelect={handleSelectMatch} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="absolute top-0 left-0 w-full bg-bg h-full px-2 py-6 md:p-8 max-h-full overflow-y-auto overflow-x-hidden">
          <div className="flex mb-4">
            <div className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer" onClick={handleClearSelectedMatch}>
              <span className="material-symbols text-3xl">arrow_back</span>
            </div>
            <p className="text-xl pl-3">{t('HeaderUpdateDetails')}</p>
          </div>

          <Checkbox value={selectAll} onChange={handleSelectAllToggle} label={t('LabelSelectAll')} checkboxBgClass="bg-bg" />

          <form onSubmit={handleSubmitMatchUpdate}>
            {selectedMatchOrig.cover && (
              <div className="flex flex-wrap md:flex-nowrap items-center justify-center">
                <div className="flex grow items-center py-2">
                  <Checkbox value={selectedMatchUsage.cover} onChange={(val) => handleFieldUsageChange('cover', val)} checkboxBgClass="bg-bg" />
                  <TextInput
                    value={selectedMatch?.cover || ''}
                    onChange={() => {}}
                    disabled={!selectedMatchUsage.cover}
                    readOnly
                    label={t('LabelCover')}
                    className="grow mx-4"
                  />
                </div>

                <div className="flex py-2">
                  <div>
                    <p className="text-center text-gray-200">{t('LabelNew')}</p>
                    <a href={selectedMatch?.cover || ''} target="_blank" rel="noopener noreferrer" className="bg-primary">
                      <PreviewCover src={selectedMatch?.cover || ''} width={100} bookCoverAspectRatio={bookCoverAspectRatio} />
                    </a>
                  </div>
                  {coverUrl && (
                    <div className="ml-0.5">
                      <p className="text-center text-gray-200">{t('LabelCurrent')}</p>
                      <a href={coverUrl} target="_blank" rel="noopener noreferrer" className="bg-primary">
                        <PreviewCover src={coverUrl} width={100} bookCoverAspectRatio={bookCoverAspectRatio} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig.title && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.title} onChange={(val) => handleFieldUsageChange('title', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch?.title || ''}
                    onChange={(val) => handleSetMatchFieldValue('title', val)}
                    disabled={!selectedMatchUsage.title}
                    label={t('LabelTitle')}
                  />
                  {'title' in mediaMetadata && mediaMetadata.title && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.title) {
                            handleSetMatchFieldValue('title', mediaMetadata.title)
                          }
                        }}
                      >
                        {mediaMetadata.title}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'subtitle' in selectedMatchOrig && selectedMatchOrig.subtitle && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.subtitle} onChange={(val) => handleFieldUsageChange('subtitle', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'subtitle' in selectedMatch ? selectedMatch.subtitle || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('subtitle', val)}
                    disabled={!selectedMatchUsage.subtitle}
                    label={t('LabelSubtitle')}
                  />
                  {'subtitle' in mediaMetadata && mediaMetadata.subtitle && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.subtitle) {
                            handleSetMatchFieldValue('subtitle', mediaMetadata.subtitle)
                          }
                        }}
                      >
                        {mediaMetadata.subtitle}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'author' in selectedMatchOrig && selectedMatchOrig.author && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.author} onChange={(val) => handleFieldUsageChange('author', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'author' in selectedMatch ? selectedMatch.author || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('author', val)}
                    disabled={!selectedMatchUsage.author}
                    label={t('LabelAuthor')}
                  />
                  {(isBookMedia(media) && media.metadata.authors.length > 0) || (isPodcast && isPodcastMedia(media) && media.metadata.author) ? (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          const authorValue =
                            isPodcast && isPodcastMedia(media)
                              ? media.metadata.author
                              : isBookMedia(media)
                                ? media.metadata.authors.map((a) => a.name).join(', ')
                                : ''
                          if (authorValue) {
                            handleSetMatchFieldValue('author', authorValue)
                          }
                        }}
                      >
                        {isPodcast && isPodcastMedia(media)
                          ? media.metadata.author
                          : isBookMedia(media)
                            ? media.metadata.authors.map((a) => a.name).join(', ')
                            : ''}
                      </a>
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'narrator' in selectedMatchOrig && selectedMatchOrig.narrator && !isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.narrator} onChange={(val) => handleFieldUsageChange('narrator', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <MultiSelect
                    selectedItems={
                      selectedMatch && 'narrator' in selectedMatch && selectedMatch.narrator
                        ? Array.isArray(selectedMatch.narrator)
                          ? selectedMatch.narrator.map((n: string) => ({ value: n, content: n }))
                          : [{ value: selectedMatch.narrator, content: selectedMatch.narrator }]
                        : []
                    }
                    onItemAdded={(item) => {
                      const narrators =
                        selectedMatch && 'narrator' in selectedMatch && selectedMatch.narrator
                          ? Array.isArray(selectedMatch.narrator)
                            ? selectedMatch.narrator
                            : [selectedMatch.narrator]
                          : []
                      handleSetMatchFieldValue('narrator', [...narrators, item.content])
                    }}
                    onItemRemoved={(item) => {
                      const narrators =
                        selectedMatch && 'narrator' in selectedMatch && selectedMatch.narrator
                          ? Array.isArray(selectedMatch.narrator)
                            ? selectedMatch.narrator
                            : [selectedMatch.narrator]
                          : []
                      handleSetMatchFieldValue(
                        'narrator',
                        narrators.filter((n: string) => n !== item.value)
                      )
                    }}
                    disabled={!selectedMatchUsage.narrator}
                    label={t('LabelNarrators')}
                    items={allNarrators}
                    allowNew
                  />
                  {'narrators' in mediaMetadata && mediaMetadata.narrators && mediaMetadata.narrators.length > 0 && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          handleSetMatchFieldValue('narrator', mediaMetadata.narrators)
                        }}
                      >
                        {mediaMetadata.narrators.join(', ')}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig.description && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.description} onChange={(val) => handleFieldUsageChange('description', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <SlateEditor
                    srcContent={selectedMatch?.description || ''}
                    onUpdate={(val) => handleSetMatchFieldValue('description', val)}
                    disabled={!selectedMatchUsage.description}
                    label={t('LabelDescription')}
                  />
                  {'description' in mediaMetadata && mediaMetadata.description && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.description) {
                            handleSetMatchFieldValue('description', mediaMetadata.description)
                          }
                        }}
                      >
                        {String(mediaMetadata.description).substring(0, 100)}
                        {String(mediaMetadata.description).length > 100 ? '...' : ''}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'publisher' in selectedMatchOrig && selectedMatchOrig.publisher && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.publisher} onChange={(val) => handleFieldUsageChange('publisher', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'publisher' in selectedMatch ? selectedMatch.publisher || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('publisher', val)}
                    disabled={!selectedMatchUsage.publisher}
                    label={t('LabelPublisher')}
                  />
                  {'publisher' in mediaMetadata && mediaMetadata.publisher && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.publisher) {
                            handleSetMatchFieldValue('publisher', mediaMetadata.publisher)
                          }
                        }}
                      >
                        {mediaMetadata.publisher}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'publishedYear' in selectedMatchOrig && selectedMatchOrig.publishedYear && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.publishedYear} onChange={(val) => handleFieldUsageChange('publishedYear', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'publishedYear' in selectedMatch ? selectedMatch.publishedYear || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('publishedYear', val)}
                    disabled={!selectedMatchUsage.publishedYear}
                    label={t('LabelPublishYear')}
                  />
                  {'publishedYear' in mediaMetadata && mediaMetadata.publishedYear && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.publisher) {
                            handleSetMatchFieldValue('publisher', mediaMetadata.publisher)
                          }
                        }}
                      >
                        {mediaMetadata.publisher}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'publishedYear' in selectedMatchOrig && selectedMatchOrig.publishedYear && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.publishedYear} onChange={(val) => handleFieldUsageChange('publishedYear', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'publishedYear' in selectedMatch ? selectedMatch.publishedYear || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('publishedYear', val)}
                    disabled={!selectedMatchUsage.publishedYear}
                    label={t('LabelPublishYear')}
                  />
                  {'publishedYear' in mediaMetadata && mediaMetadata.publishedYear && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.publishedYear) {
                            handleSetMatchFieldValue('publishedYear', mediaMetadata.publishedYear)
                          }
                        }}
                      >
                        {mediaMetadata.publishedYear}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'series' in selectedMatchOrig && selectedMatchOrig.series && !isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.series} onChange={(val) => handleFieldUsageChange('series', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TwoStageMultiSelect
                    selectedItems={seriesItems}
                    items={availableSeries.map((item) => ({ value: item.value, content: item.content as string }))}
                    onItemAdded={handleAddSeries}
                    onItemRemoved={handleRemoveSeries}
                    onItemEdited={handleEditSeries}
                    disabled={!selectedMatchUsage.series}
                    label={t('LabelSeries')}
                  />
                  {'series' in mediaMetadata && mediaMetadata.series && mediaMetadata.series.length > 0 && selectedMatch && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.series) {
                            handleSetMatchFieldValue('series', mediaMetadata.series)
                          }
                        }}
                      >
                        {mediaMetadata.series.map((s) => (s.sequence ? `${s.name} #${s.sequence}` : s.name)).join(', ')}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig.genres && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.genres} onChange={(val) => handleFieldUsageChange('genres', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <MultiSelect
                    selectedItems={
                      Array.isArray(selectedMatch?.genres)
                        ? selectedMatch.genres.map((g) => ({ value: g, content: g }))
                        : selectedMatch?.genres
                          ? [{ value: selectedMatch.genres, content: selectedMatch.genres }]
                          : []
                    }
                    onItemAdded={(item) => {
                      const genres = Array.isArray(selectedMatch?.genres) ? selectedMatch.genres : selectedMatch?.genres ? [selectedMatch.genres] : []
                      handleSetMatchFieldValue('genres', [...genres, item.content])
                    }}
                    onItemRemoved={(item) => {
                      const genres = Array.isArray(selectedMatch?.genres) ? selectedMatch.genres : selectedMatch?.genres ? [selectedMatch.genres] : []
                      handleSetMatchFieldValue(
                        'genres',
                        genres.filter((g) => g !== item.value)
                      )
                    }}
                    disabled={!selectedMatchUsage.genres}
                    label={t('LabelGenres')}
                    items={allGenres}
                    allowNew
                  />
                  {'genres' in mediaMetadata && mediaMetadata.genres && mediaMetadata.genres.length > 0 && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          handleSetMatchFieldValue('genres', mediaMetadata.genres)
                        }}
                      >
                        {mediaMetadata.genres.join(', ')}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig.tags && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.tags} onChange={(val) => handleFieldUsageChange('tags', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <MultiSelect
                    selectedItems={
                      Array.isArray(selectedMatch?.tags)
                        ? selectedMatch.tags.map((t) => ({ value: t, content: t }))
                        : selectedMatch?.tags
                          ? [{ value: selectedMatch.tags, content: selectedMatch.tags }]
                          : []
                    }
                    onItemAdded={(item) => {
                      const tags = Array.isArray(selectedMatch?.tags) ? selectedMatch.tags : selectedMatch?.tags ? [selectedMatch.tags] : []
                      handleSetMatchFieldValue('tags', [...tags, item.content])
                    }}
                    onItemRemoved={(item) => {
                      const tags = Array.isArray(selectedMatch?.tags) ? selectedMatch.tags : selectedMatch?.tags ? [selectedMatch.tags] : []
                      handleSetMatchFieldValue(
                        'tags',
                        tags.filter((t) => t !== item.value)
                      )
                    }}
                    disabled={!selectedMatchUsage.tags}
                    label={t('LabelTags')}
                    items={allTags}
                    allowNew
                  />
                  {media.tags && media.tags.length > 0 && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          handleSetMatchFieldValue('tags', media.tags)
                        }}
                      >
                        {media.tags.join(', ')}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig.language && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.language} onChange={(val) => handleFieldUsageChange('language', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch?.language || ''}
                    onChange={(val) => handleSetMatchFieldValue('language', val)}
                    disabled={!selectedMatchUsage.language}
                    label={t('LabelLanguage')}
                  />
                  {'language' in mediaMetadata && mediaMetadata.language && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.language) {
                            handleSetMatchFieldValue('language', mediaMetadata.language)
                          }
                        }}
                      >
                        {mediaMetadata.language}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'isbn' in selectedMatchOrig && selectedMatchOrig.isbn && !isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.isbn} onChange={(val) => handleFieldUsageChange('isbn', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'isbn' in selectedMatch ? selectedMatch.isbn || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('isbn', val)}
                    disabled={!selectedMatchUsage.isbn}
                    label="ISBN"
                  />
                  {'isbn' in mediaMetadata && mediaMetadata.isbn && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.isbn) {
                            handleSetMatchFieldValue('isbn', mediaMetadata.isbn)
                          }
                        }}
                      >
                        {mediaMetadata.isbn}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'asin' in selectedMatchOrig && selectedMatchOrig.asin && !isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.asin} onChange={(val) => handleFieldUsageChange('asin', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'asin' in selectedMatch ? selectedMatch.asin || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('asin', val)}
                    disabled={!selectedMatchUsage.asin}
                    label="ASIN"
                  />
                  {'asin' in mediaMetadata && mediaMetadata.asin && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.asin) {
                            handleSetMatchFieldValue('asin', mediaMetadata.asin)
                          }
                        }}
                      >
                        {mediaMetadata.asin}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'itunesId' in selectedMatchOrig && selectedMatchOrig.itunesId && isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.itunesId} onChange={(val) => handleFieldUsageChange('itunesId', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'itunesId' in selectedMatch && selectedMatch.itunesId ? String(selectedMatch.itunesId) : ''}
                    onChange={(val) => handleSetMatchFieldValue('itunesId', Number(val))}
                    disabled={!selectedMatchUsage.itunesId}
                    type="number"
                    label="iTunes ID"
                  />
                  {'itunesId' in mediaMetadata && mediaMetadata.itunesId && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.itunesId) {
                            handleSetMatchFieldValue('itunesId', Number(mediaMetadata.itunesId))
                          }
                        }}
                      >
                        {String(mediaMetadata.itunesId)}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'feedUrl' in selectedMatchOrig && selectedMatchOrig.feedUrl && isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.feedUrl} onChange={(val) => handleFieldUsageChange('feedUrl', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'feedUrl' in selectedMatch ? selectedMatch.feedUrl || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('feedUrl', val)}
                    disabled={!selectedMatchUsage.feedUrl}
                    label="RSS Feed URL"
                  />
                  {'feedUrl' in mediaMetadata && mediaMetadata.feedUrl && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.feedUrl) {
                            handleSetMatchFieldValue('feedUrl', mediaMetadata.feedUrl)
                          }
                        }}
                      >
                        {mediaMetadata.feedUrl}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'itunesPageUrl' in selectedMatchOrig && selectedMatchOrig.itunesPageUrl && isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.itunesPageUrl} onChange={(val) => handleFieldUsageChange('itunesPageUrl', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'itunesPageUrl' in selectedMatch ? selectedMatch.itunesPageUrl || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('itunesPageUrl', val)}
                    disabled={!selectedMatchUsage.itunesPageUrl}
                    label="iTunes Page URL"
                  />
                  {'itunesPageUrl' in mediaMetadata && mediaMetadata.itunesPageUrl && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.itunesPageUrl) {
                            handleSetMatchFieldValue('itunesPageUrl', mediaMetadata.itunesPageUrl)
                          }
                        }}
                      >
                        {mediaMetadata.itunesPageUrl}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'releaseDate' in selectedMatchOrig && selectedMatchOrig.releaseDate && isPodcast && (
              <div className="flex items-center py-2">
                <Checkbox value={selectedMatchUsage.releaseDate} onChange={(val) => handleFieldUsageChange('releaseDate', val)} checkboxBgClass="bg-bg" />
                <div className="grow ml-4">
                  <TextInput
                    value={selectedMatch && 'releaseDate' in selectedMatch ? selectedMatch.releaseDate || '' : ''}
                    onChange={(val) => handleSetMatchFieldValue('releaseDate', val)}
                    disabled={!selectedMatchUsage.releaseDate}
                    label={t('LabelReleaseDate')}
                  />
                  {'releaseDate' in mediaMetadata && mediaMetadata.releaseDate && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')}{' '}
                      <a
                        title={t('LabelClickToUseCurrentValue')}
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (mediaMetadata.releaseDate) {
                            handleSetMatchFieldValue('releaseDate', mediaMetadata.releaseDate)
                          }
                        }}
                      >
                        {mediaMetadata.releaseDate}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig.explicit != null && (
              <div className={mergeClasses('flex items-center pb-2', mediaMetadata.explicit == null ? 'pt-2' : '')}>
                <Checkbox value={selectedMatchUsage.explicit} onChange={(val) => handleFieldUsageChange('explicit', val)} checkboxBgClass="bg-bg" />
                <div className={mergeClasses('grow ml-4', mediaMetadata.explicit != null ? 'pt-4' : '')}>
                  <Checkbox
                    value={selectedMatch?.explicit || false}
                    onChange={(val) => handleSetMatchFieldValue('explicit', val)}
                    disabled={!selectedMatchUsage.explicit}
                    label={t('LabelExplicit')}
                    checkboxBgClass={!selectedMatchUsage.explicit ? 'bg-bg' : 'bg-primary'}
                    borderColorClass="border-gray-600"
                    labelClass="ps-2 text-base font-semibold"
                  />
                  {mediaMetadata.explicit != null && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')} {mediaMetadata.explicit ? t('LabelExplicitChecked') : t('LabelExplicitUnchecked')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedMatchOrig && 'abridged' in selectedMatchOrig && selectedMatchOrig.abridged != null && !isPodcast && (
              <div className={mergeClasses('flex items-center pb-2', isBookMedia(media) && media.metadata.abridged == null ? 'pt-2' : '')}>
                <Checkbox value={selectedMatchUsage.abridged} onChange={(val) => handleFieldUsageChange('abridged', val)} checkboxBgClass="bg-bg" />
                <div className={mergeClasses('grow ml-4', isBookMedia(media) && media.metadata.abridged != null ? 'pt-4' : '')}>
                  <Checkbox
                    value={selectedMatch && 'abridged' in selectedMatch && selectedMatch.abridged ? selectedMatch.abridged : false}
                    onChange={(val) => handleSetMatchFieldValue('abridged', val)}
                    disabled={!selectedMatchUsage.abridged}
                    label={t('LabelAbridged')}
                    checkboxBgClass={!selectedMatchUsage.abridged ? 'bg-bg' : 'bg-primary'}
                    borderColorClass="border-gray-600"
                    labelClass="ps-2 text-base font-semibold"
                  />
                  {isBookMedia(media) && media.metadata.abridged != null && (
                    <p className="text-xs ml-1 text-white/60">
                      {t('LabelCurrently')} {media.metadata.abridged ? t('LabelAbridgedChecked') : t('LabelAbridgedUnchecked')}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end py-2">
              <Btn color="bg-success" type="submit" disabled={isPendingApply} loading={isPendingApply}>
                {t('ButtonSubmit')}
              </Btn>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
