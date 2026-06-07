'use client'

import EreaderSettingsModal from '@/components/ereader/EreaderSettingsModal'
import EreaderTocDrawer from '@/components/ereader/EreaderTocDrawer'
import FoliateView, { type FoliateViewHandle } from '@/components/ereader/FoliateView'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useEreaderSettings } from '@/hooks/useEreaderSettings'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { EREADER_THEME_SHELL_CLASS } from '@/lib/ereader/ereaderSettings'
import type { EreaderTocItem } from '@/lib/ereader/ereaderToc'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface EreaderOverlayProps {
  isOpen: boolean
  libraryItemId: string
  title: string
  ebookFormat: string
  epubsAllowScriptedContent: boolean
  savedEbookLocation?: string
  onClose: () => void
}

export default function EreaderOverlay({
  isOpen,
  libraryItemId,
  title,
  ebookFormat,
  epubsAllowScriptedContent,
  savedEbookLocation,
  onClose
}: EreaderOverlayProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { settings, updateSettings } = useEreaderSettings()
  const [showSettings, setShowSettings] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [toc, setToc] = useState<EreaderTocItem[]>([])
  const showSettingsRef = useRef(showSettings)
  const showTocRef = useRef(showToc)
  const foliateRef = useRef<FoliateViewHandle>(null)

  showSettingsRef.current = showSettings
  showTocRef.current = showToc

  const handleCloseRequest = useCallback(() => {
    if (showSettingsRef.current) {
      setShowSettings(false)
      return
    }
    if (showTocRef.current) {
      setShowToc(false)
      return
    }
    onClose()
  }, [onClose])

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

  const handleGoToChapter = useCallback((href: string) => {
    foliateRef.current?.goTo(href)
  }, [])

  if (!isOpen || typeof document === 'undefined') return null

  const shellClass = EREADER_THEME_SHELL_CLASS[settings.theme]

  return createPortal(
    <div className={mergeClasses('fixed inset-0 z-80 flex flex-col', shellClass)}>
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

        <EreaderTocDrawer isOpen={showToc} shellClass={shellClass} items={toc} onClose={() => setShowToc(false)} onGoTo={handleGoToChapter} />
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
