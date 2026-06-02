'use client'

import {
  fetchPodcastFeedAction,
  getPodcastTitlesAction,
  parseOpmlFeedsAction,
  searchPodcastsForLibraryAction
} from '@/app/(main)/library/[library]/(podcast)/add-podcast/actions'
import NewPodcastModal from '@/components/modals/NewPodcastModal'
import OpmlFeedsModal from '@/components/modals/OpmlFeedsModal'
import Btn from '@/components/ui/Btn'
import FileInput from '@/components/ui/FileInput'
import TextInput from '@/components/ui/TextInput'
import AlreadyInLibraryIndicator from '@/components/widgets/AlreadyInLibraryIndicator'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { OpmlFeed, PodcastSearchResult, RssPodcast } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ExistentPodcast {
  title: string
  itunesId: string | number | null
  id: string
}

interface PodcastSearchResultRow extends PodcastSearchResult {
  alreadyInLibrary?: boolean
  existentId?: string
}

function normalizeGenres(genres: PodcastSearchResult['genres']): string[] {
  if (!genres) return []
  if (Array.isArray(genres)) return genres
  return genres
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
}

export default function AddPodcastClient() {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const { library } = useLibrary()

  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<PodcastSearchResultRow[]>([])
  const [termSearched, setTermSearched] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [feedLoading, setFeedLoading] = useState(false)
  const formDisabled = searchLoading || feedLoading
  const [existentPodcasts, setExistentPodcasts] = useState<ExistentPodcast[]>([])
  const existentPodcastsRef = useRef<ExistentPodcast[]>([])
  const [showNewPodcastModal, setShowNewPodcastModal] = useState(false)
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastSearchResult | null>(null)
  const [selectedPodcastFeed, setSelectedPodcastFeed] = useState<RssPodcast | null>(null)
  const [showOpmlFeedsModal, setShowOpmlFeedsModal] = useState(false)
  const [opmlFeeds, setOpmlFeeds] = useState<OpmlFeed[]>([])

  const podcastSearchRegion = library.settings?.podcastSearchRegion || 'us'

  useEffect(() => {
    existentPodcastsRef.current = existentPodcasts
  }, [existentPodcasts])

  const markResultsInLibrary = useCallback((searchResults: PodcastSearchResult[]): PodcastSearchResultRow[] => {
    return searchResults.map((result) => {
      const podcast = existentPodcastsRef.current.find(
        (p) => (p.itunesId != null && result.id != null && String(p.itunesId) === String(result.id)) || p.title === (result.title || '').toLowerCase()
      )
      if (!podcast) return result
      return {
        ...result,
        alreadyInLibrary: true,
        existentId: podcast.id
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchExistentPodcasts() {
      try {
        const response = await getPodcastTitlesAction(library.id)
        if (cancelled) return
        setExistentPodcasts(
          response.podcasts.map((p) => ({
            title: p.title.toLowerCase(),
            itunesId: p.itunesId,
            id: p.libraryItemId
          }))
        )
      } catch (error) {
        console.error('Failed to fetch podcasts', error)
      }
    }

    void fetchExistentPodcasts()
    return () => {
      cancelled = true
    }
  }, [library.id])

  const checkRSSFeed = useCallback(
    async (rssFeed: string) => {
      setSearchLoading(true)
      try {
        const payload = await fetchPodcastFeedAction(rssFeed)
        setSelectedPodcast(null)
        setSelectedPodcastFeed(payload.podcast)
        setShowNewPodcastModal(true)
      } catch (error) {
        console.error('Failed to get feed', error)
        showToast(t('ToastPodcastGetFeedFailed'), { type: 'error' })
      } finally {
        setSearchLoading(false)
      }
    },
    [showToast, t]
  )

  const submitSearch = useCallback(
    async (term: string) => {
      setSearchLoading(true)
      setTermSearched('')

      try {
        let searchResults = await searchPodcastsForLibraryAction(term, podcastSearchRegion)
        searchResults = searchResults.filter((r) => r.feedUrl)
        setResults(markResultsInLibrary(searchResults))
        setTermSearched(term)
      } catch (error) {
        console.error('Search request failed', error)
        setResults([])
        setTermSearched(term)
      } finally {
        setSearchLoading(false)
      }
    },
    [markResultsInLibrary, podcastSearchRegion]
  )

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmed = searchInput.trim()
      if (!trimmed) return

      if (trimmed.startsWith('http:') || trimmed.startsWith('https:')) {
        setTermSearched('')
        setResults([])
        void checkRSSFeed(trimmed)
      } else {
        void submitSearch(trimmed)
      }
    },
    [checkRSSFeed, searchInput, submitSearch]
  )

  const handleSelectPodcast = useCallback(
    async (podcast: PodcastSearchResultRow) => {
      if (podcast.existentId) {
        router.push(`/library/${library.id}/item/${podcast.existentId}`)
        return
      }
      if (!podcast.feedUrl) {
        showToast(t('MessageNoPodcastFeed'), { type: 'error' })
        return
      }

      setFeedLoading(true)
      try {
        const payload = await fetchPodcastFeedAction(podcast.feedUrl)
        setSelectedPodcast(podcast)
        setSelectedPodcastFeed(payload.podcast)
        setShowNewPodcastModal(true)
      } catch (error) {
        console.error('Failed to get feed', error)
        showToast(t('ToastPodcastGetFeedFailed'), { type: 'error' })
      } finally {
        setFeedLoading(false)
      }
    },
    [library.id, router, showToast, t]
  )

  const handleOpmlFileUpload = useCallback(
    async (file: File) => {
      setSearchLoading(true)
      try {
        const txt = await file.text()

        if (!txt || !txt.includes('<opml') || !txt.includes('<outline ')) {
          showToast(t('MessageTaskOpmlParseFastFail', { opmlTag: '<opml>', outlineTag: '<outline>' }), { type: 'error' })
          return
        }

        const data = await parseOpmlFeedsAction(txt)
        if (!data.feeds?.length) {
          showToast(t('MessageTaskOpmlParseNoneFound'), { type: 'error' })
        } else {
          setOpmlFeeds(data.feeds)
          setShowOpmlFeedsModal(true)
        }
      } catch (error) {
        console.error('Failed to parse OPML', error)
        showToast(t('MessageTaskOpmlParseFailed'), { type: 'error' })
      } finally {
        setSearchLoading(false)
      }
    },
    [showToast, t]
  )

  return (
    <div className="w-full overflow-y-auto px-2 py-6 sm:px-4 md:p-12">
      <div className="mx-auto flex w-full max-w-4xl">
        <form onSubmit={handleSubmit} className="flex grow">
          <TextInput
            value={searchInput}
            onChange={setSearchInput}
            type="search"
            disabled={formDisabled}
            placeholder={t('MessagePodcastSearchField')}
            className="me-2 grow"
          />
          <Btn type="submit" disabled={formDisabled} loading={searchLoading}>
            {t('ButtonSubmit')}
          </Btn>
        </form>
        <FileInput
          accept=".opml, .txt"
          className={mergeClasses('ms-2 shrink-0', formDisabled && 'pointer-events-none opacity-50')}
          onChange={(file) => void handleOpmlFileUpload(file)}
        >
          {t('ButtonUploadOPMLFile')}
        </FileInput>
      </div>

      <div className={mergeClasses('mx-auto w-full max-w-3xl py-4', formDisabled && 'pointer-events-none opacity-60')}>
        {termSearched && !results.length && !searchLoading && <p className="text-foreground text-center text-xl">{t('MessageNoPodcastsFound')}</p>}

        {results.map((podcast) => {
          const genres = normalizeGenres(podcast.genres)
          const resultKey = String(podcast.id ?? podcast.feedUrl ?? podcast.title)

          return (
            <div
              key={resultKey}
              className="hover:bg-primary/25 flex cursor-pointer p-1"
              onClick={() => void handleSelectPodcast(podcast)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  void handleSelectPodcast(podcast)
                }
              }}
            >
              <div className="bg-primary h-20 min-h-20 w-20 min-w-20 md:h-24 md:w-24 md:min-w-24">
                {podcast.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={podcast.cover} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="max-w-2xl grow ps-4">
                <div className="flex items-center gap-1">
                  {podcast.pageUrl ? (
                    <a
                      href={podcast.pageUrl}
                      className="text-foreground hover:text-foreground-muted text-base hover:underline md:text-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {podcast.title}
                    </a>
                  ) : (
                    <span className="text-foreground text-base md:text-lg">{podcast.title}</span>
                  )}
                  {podcast.explicit && <ExplicitIndicator />}
                  {podcast.alreadyInLibrary && <AlreadyInLibraryIndicator />}
                </div>
                {podcast.artistName && (
                  <p className="text-foreground-muted truncate text-sm whitespace-nowrap md:text-base">{t('LabelByAuthor', { 0: podcast.artistName })}</p>
                )}
                {genres.length > 0 && <p className="text-foreground-muted text-xs leading-5">{genres.join(', ')}</p>}
                {podcast.trackCount != null && (
                  <p className="text-foreground-muted text-xs leading-5">
                    {podcast.trackCount} {t('HeaderEpisodes')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <NewPodcastModal
        isOpen={showNewPodcastModal}
        podcastData={selectedPodcast}
        podcastFeedData={selectedPodcastFeed}
        onClose={() => setShowNewPodcastModal(false)}
        onCreated={(libraryItemId) => router.push(`/library/${library.id}/item/${libraryItemId}`)}
      />

      <OpmlFeedsModal isOpen={showOpmlFeedsModal} feeds={opmlFeeds} onClose={() => setShowOpmlFeedsModal(false)} />
    </div>
  )
}
