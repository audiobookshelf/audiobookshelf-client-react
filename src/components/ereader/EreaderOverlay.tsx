'use client'

import EreaderSettingsModal from '@/components/ereader/EreaderSettingsModal'
import EreaderTocDrawer from '@/components/ereader/EreaderTocDrawer'
import type { FoliateSearchSection } from '@/components/ereader/foliate'
import FoliateView, { type FoliateViewHandle } from '@/components/ereader/FoliateView'
import { MEDIA_PLAYER_BOTTOM_INSET_CLASS } from '@/components/player/MediaPlayerContainer'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useEreaderSettings } from '@/hooks/useEreaderSettings'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { EREADER_THEME_SHELL_CLASS, supportsReflowableSettings } from '@/lib/ereader/ereaderSettings'
import type { EreaderTocItem } from '@/lib/ereader/ereaderToc'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface EreaderOverlayProps {
  isOpen: boolean
  libraryItemId: string
  title: string
  ebookFormat: string
  epubsAllowScriptedContent: boolean
  savedEbookLocation?: string
  savedEbookProgress?: number
  onClose: () => void
}

export default function EreaderOverlay({
  isOpen,
  libraryItemId,
  title,
  ebookFormat,
  epubsAllowScriptedContent,
  savedEbookLocation,
  savedEbookProgress,
  onClose
}: EreaderOverlayProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { streamLibraryItem } = useMediaContext()
  const { settings, updateSettings } = useEreaderSettings()
  const playerOpen = !!streamLibraryItem
  const [showSettings, setShowSettings] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [toc, setToc] = useState<EreaderTocItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoliateSearchSection[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isSearchPending, setIsSearchPending] = useState(false)
  const [searchProgress, setSearchProgress] = useState<number | null>(null)
  const showSettingsRef = useRef(showSettings)
  const showTocRef = useRef(showToc)
  const foliateRef = useRef<FoliateViewHandle>(null)
  const searchRequestIdRef = useRef(0)

  showSettingsRef.current = showSettings
  showTocRef.current = showToc

  const handleError = useCallback(() => {
    showToast(t('ToastFailedToLoadData'), { type: 'error' })
    onClose()
  }, [onClose, showToast, t])

  const goLeft = useCallback(() => {
    foliateRef.current?.goLeft()
  }, [])

  const goRight = useCallback(() => {
    foliateRef.current?.goRight()
  }, [])

  const resetSearch = useCallback(() => {
    searchRequestIdRef.current += 1
    foliateRef.current?.clearSearch()
    setSearchQuery('')
    setSearchResults([])
    setIsSearchMode(false)
    setIsSearchPending(false)
    setSearchProgress(null)
  }, [])

  const handleCloseToc = useCallback(() => {
    setShowToc(false)
  }, [])

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)

      if (query.length <= 1) {
        resetSearch()
        return
      }

      const requestId = searchRequestIdRef.current + 1
      searchRequestIdRef.current = requestId
      setIsSearchMode(true)
      setIsSearchPending(true)
      setSearchResults([])
      setSearchProgress(0)

      try {
        const results = await foliateRef.current?.searchBook(query, (progress) => {
          if (searchRequestIdRef.current === requestId) setSearchProgress(progress)
        })

        if (searchRequestIdRef.current !== requestId) return

        setSearchResults(results ?? [])
      } catch (error) {
        console.error('E-reader search failed', error)
        if (searchRequestIdRef.current === requestId) setSearchResults([])
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsSearchPending(false)
          setSearchProgress(null)
        }
      }
    },
    [resetSearch]
  )

  const handleGoToChapter = useCallback((href: string) => {
    foliateRef.current?.goTo(href)
  }, [])

  const handleGoToSearchResult = useCallback((cfi: string) => {
    foliateRef.current?.goToSearchResult(cfi)
    setShowToc(false)
  }, [])

  useEffect(() => {
    if (!isOpen) resetSearch()
  }, [isOpen, resetSearch])

  const handleCloseRequest = useCallback(() => {
    if (showSettingsRef.current) {
      setShowSettings(false)
      return
    }
    if (showTocRef.current) {
      handleCloseToc()
      return
    }
    onClose()
  }, [handleCloseToc, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const shellClass = EREADER_THEME_SHELL_CLASS[settings.theme]
  const supportsSearch = supportsReflowableSettings(ebookFormat)

  return createPortal(
    <div className={mergeClasses('fixed inset-x-0 top-0 z-80 flex flex-col', playerOpen ? MEDIA_PLAYER_BOTTOM_INSET_CLASS : 'bottom-0', shellClass)}>
      <header className="flex h-12 shrink-0 items-center gap-3 px-3">
        <button
          type="button"
          className="material-symbols text-2xl opacity-80 hover:opacity-100"
          onClick={() => setShowToc((open) => !open)}
          aria-label={t('ButtonMenu')}
        >
          menu
        </button>
        <button
          type="button"
          className="material-symbols text-2xl opacity-80 hover:opacity-100"
          onClick={() => setShowSettings(true)}
          aria-label={t('HeaderEreaderSettings')}
        >
          settings
        </button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>
        <div className="grow" />
        <button type="button" className="material-symbols text-2xl opacity-80 hover:opacity-100" onClick={handleCloseRequest} aria-label={t('ButtonClose')}>
          close
        </button>
      </header>
      <main className="relative flex min-h-0 flex-1">
        <button
          type="button"
          className="hidden w-16 shrink-0 items-center justify-center opacity-50 transition-opacity hover:opacity-100 sm:flex"
          onMouseDown={(event) => event.preventDefault()}
          onClick={goLeft}
          aria-label={t('ButtonPrevious')}
        >
          <span className="material-symbols text-5xl opacity-80">chevron_left</span>
        </button>
        <div className="relative min-h-0 min-w-0 flex-1">
          <FoliateView
            ref={foliateRef}
            libraryItemId={libraryItemId}
            ebookFormat={ebookFormat}
            epubsAllowScriptedContent={epubsAllowScriptedContent}
            title={title}
            savedEbookLocation={savedEbookLocation}
            savedEbookProgress={savedEbookProgress}
            settings={settings}
            onTocReady={setToc}
            onClose={handleCloseRequest}
            onError={handleError}
          />
          <button
            type="button"
            className="absolute inset-y-0 left-0 z-10 w-1/3 sm:hidden"
            onMouseDown={(event) => event.preventDefault()}
            onClick={goLeft}
            aria-label={t('ButtonPrevious')}
          />
          <button type="button" className="absolute inset-y-0 right-0 z-10 w-1/3 sm:hidden" onClick={goRight} aria-label={t('ButtonNext')} />
        </div>
        <button
          type="button"
          className="hidden w-16 shrink-0 items-center justify-center opacity-50 transition-opacity hover:opacity-100 sm:flex"
          onMouseDown={(event) => event.preventDefault()}
          onClick={goRight}
          aria-label={t('ButtonNext')}
        >
          <span className="material-symbols text-5xl opacity-80">chevron_right</span>
        </button>

        <EreaderTocDrawer
          isOpen={showToc}
          shellClass={shellClass}
          items={toc}
          supportsSearch={supportsSearch}
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearchMode={isSearchMode}
          isSearchPending={isSearchPending}
          searchProgress={searchProgress}
          onSearch={handleSearch}
          onClose={handleCloseToc}
          onGoTo={handleGoToChapter}
          onGoToSearchResult={handleGoToSearchResult}
          theme={settings.theme}
        />
      </main>

      <EreaderSettingsModal
        isOpen={showSettings}
        ebookFormat={ebookFormat}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>,
    document.body
  )
}
