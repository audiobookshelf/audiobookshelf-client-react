'use client'

import { searchBooksAction, searchPodcastsAction } from '@/app/actions/matchActions'
import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import BookMatchView from '@/components/widgets/match/BookMatchView'
import MatchCard from '@/components/widgets/match/MatchCard'
import PodcastMatchView from '@/components/widgets/match/PodcastMatchView'
import { useBookProviders, useMetadata, usePodcastProviders } from '@/contexts/MetadataContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { BookLibraryItem, BookSearchResult, isBookMedia, isPodcastMedia, PodcastLibraryItem, PodcastSearchResult } from '@/types/api'
import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface MatchProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  availableAuthors?: MultiSelectItem<string>[]
  availableNarrators?: MultiSelectItem<string>[]
  availableGenres?: MultiSelectItem<string>[]
  availableTags?: MultiSelectItem<string>[]
  availableSeries?: MultiSelectItem<string>[]
  isEnabled?: boolean
  bookCoverAspectRatio: number
  onClose?: () => void
}

type MatchResult = BookSearchResult | PodcastSearchResult

export default function Match({
  libraryItem,
  availableNarrators = [],
  availableGenres = [],
  availableTags = [],
  availableSeries = [],
  isEnabled = true,
  bookCoverAspectRatio,
  onClose
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

  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [provider, setProvider] = useState<string>(() => {
    // Initialize provider based on media type - will be overridden when providers load
    return 'google'
  })
  const [searchResults, setSearchResults] = useState<(BookSearchResult | PodcastSearchResult)[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedMatchOrig, setSelectedMatchOrig] = useState<MatchResult | null>(null)
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [hasScrollbar, setHasScrollbar] = useState(false)

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
    if (isEnabled && providersLoaded && searchTitle && !hasSearched && libraryItem.id) {
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
  }, [isEnabled, providersLoaded, libraryItem.id, searchTitle, searchAuthor, validProvider, isPodcast, hasSearched, t, showToast])

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
    setSelectedMatchOrig(JSON.parse(JSON.stringify(match)))
  }, [])

  const handleClearSelectedMatch = useCallback(() => {
    setSelectedMatchOrig(null)
    setFocusedCardIndex(null)
  }, [])

  const handleMatchSuccess = useCallback(() => {
    handleClearSelectedMatch()
    if (onClose) {
      onClose()
    }
  }, [handleClearSelectedMatch, onClose])

  const handleCardArrowKey = useCallback(
    (direction: 'up' | 'down', index: number) => {
      if (direction === 'down') {
        const nextIndex = index + 1
        if (nextIndex < searchResults.length) {
          setFocusedCardIndex(nextIndex)
        }
      } else if (direction === 'up') {
        const prevIndex = index - 1
        if (prevIndex >= 0) {
          setFocusedCardIndex(prevIndex)
        }
      }
    },
    [searchResults.length]
  )

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown' && searchResults.length > 0) {
        e.preventDefault()
        setFocusedCardIndex(0)
      }
    },
    [searchResults.length]
  )

  // Reset focused card when search results change
  useEffect(() => {
    setFocusedCardIndex(null)
  }, [searchResults])

  // Check if scrollbar is present and adjust padding accordingly
  useEffect(() => {
    const checkScrollbar = () => {
      if (scrollContainerRef.current) {
        const hasScroll = scrollContainerRef.current.scrollHeight > scrollContainerRef.current.clientHeight
        setHasScrollbar(hasScroll)
      }
    }

    checkScrollbar()
    const resizeObserver = new ResizeObserver(checkScrollbar)
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current)
    }

    // Also check when search results change
    const timeoutId = setTimeout(checkScrollbar, 100)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeoutId)
    }
  }, [searchResults])

  return (
    <div className="w-full relative flex flex-col">
      {!selectedMatchOrig ? (
        <div className="flex flex-col h-full overflow-hidden px-2 md:px-4 py-4 md:py-6">
          <form onSubmit={handleSubmitSearch} className="flex-shrink-0">
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
            <div className="flex flex-1 items-center justify-center">
              <p>{t('MessageLoading')}</p>
            </div>
          )}

          {!isPendingSearch && !searchResults.length && hasSearched && (
            <div className="flex flex-1 items-center justify-center">
              <p>{t('MessageNoResults')}</p>
            </div>
          )}

          {!isPendingSearch && (
            <div
              ref={scrollContainerRef}
              className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden mt-4 px-1 md:mx-0 md:px-0 min-h-0 gap-2"
              style={{ paddingRight: hasScrollbar ? '1rem' : '0' }}
              onKeyDown={handleContainerKeyDown}
              role="listbox"
              aria-label="Search results"
            >
              {searchResults.map((result, index) => (
                <MatchCard
                  key={index}
                  book={result}
                  isPodcast={isPodcast}
                  currentBookDuration={currentBookDuration}
                  onSelect={handleSelectMatch}
                  isFocused={focusedCardIndex === index}
                  cardIndex={index}
                  onArrowKey={handleCardArrowKey}
                />
              ))}
            </div>
          )}
        </div>
      ) : selectedMatchOrig ? (
        isPodcast ? (
          <PodcastMatchView
            selectedMatchOrig={selectedMatchOrig as PodcastSearchResult}
            libraryItemId={libraryItem.id}
            media={media as PodcastLibraryItem['media']}
            mediaMetadata={mediaMetadata as PodcastLibraryItem['media']['metadata']}
            coverUrl={coverUrl}
            bookCoverAspectRatio={bookCoverAspectRatio}
            availableGenres={availableGenres}
            availableTags={availableTags}
            onBack={handleClearSelectedMatch}
            onSuccess={handleMatchSuccess}
          />
        ) : (
          <BookMatchView
            selectedMatchOrig={selectedMatchOrig as BookSearchResult}
            libraryItemId={libraryItem.id}
            media={media as BookLibraryItem['media']}
            mediaMetadata={mediaMetadata as BookLibraryItem['media']['metadata']}
            coverUrl={coverUrl}
            bookCoverAspectRatio={bookCoverAspectRatio}
            availableGenres={availableGenres}
            availableTags={availableTags}
            availableNarrators={availableNarrators}
            availableSeries={availableSeries}
            onBack={handleClearSelectedMatch}
            onSuccess={handleMatchSuccess}
          />
        )
      ) : null}
    </div>
  )
}
