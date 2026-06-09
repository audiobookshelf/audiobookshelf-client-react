'use client'

import { updateEbookProgressAction } from '@/app/actions/ebookActions'
import type { FoliateRelocateDetail, FoliateSearchSection, FoliateViewElement } from '@/components/ereader/foliate'
import {
  blobToEbookFile,
  parseResumeCfi,
  parseResumePage,
  progressFromRelocate,
  resumeEpubLocation,
  usesPageBasedProgress,
  type EbookProgressUpdate
} from '@/lib/ereader/ereaderEbook'
import { attachEpubSecurity } from '@/lib/ereader/ereaderSecurity'
import { applyEreaderSettingsToView, type EreaderSettings } from '@/lib/ereader/ereaderSettings'
import { normalizeEreaderToc, type EreaderTocItem } from '@/lib/ereader/ereaderToc'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

const PROGRESS_DEBOUNCE_MS = 2000
const FOLIATE_SEARCH_PREFIX = 'foliate-search:'

async function loadFoliateViewModule() {
  await import('foliate-js/view.js')
}

export interface FoliateViewHandle {
  goLeft: () => void
  goRight: () => void
  goTo: (href: string) => void
  goToSearchResult: (cfi: string) => void
  getToc: () => EreaderTocItem[]
  searchBook: (query: string, onProgress?: (progress: number) => void) => Promise<FoliateSearchSection[]>
  clearSearch: () => void
}

interface FoliateViewProps {
  libraryItemId: string
  ebookFormat: string
  epubsAllowScriptedContent: boolean
  title: string
  savedEbookLocation?: string
  savedEbookProgress?: number
  settings: EreaderSettings
  onTocReady?: (toc: EreaderTocItem[]) => void
  onClose?: () => void
  onError?: () => void
}

const FoliateView = forwardRef<FoliateViewHandle, FoliateViewProps>(function FoliateView(
  { libraryItemId, ebookFormat, epubsAllowScriptedContent, title, savedEbookLocation, savedEbookProgress, settings, onTocReady, onClose, onError },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<FoliateViewElement | null>(null)
  const tocRef = useRef<EreaderTocItem[]>([])
  const onTocReadyRef = useRef(onTocReady)

  onTocReadyRef.current = onTocReady
  const lastSavedLocationRef = useRef<string | number | null>(null)
  const pendingProgressRef = useRef<EbookProgressUpdate | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCloseRef = useRef(onClose)
  const onErrorRef = useRef(onError)

  onCloseRef.current = onClose
  onErrorRef.current = onError

  useImperativeHandle(ref, () => ({
    goLeft: () => {
      void viewRef.current?.goLeft()
    },
    goRight: () => {
      void viewRef.current?.goRight()
    },
    goTo: (href: string) => {
      void viewRef.current?.goTo(href)
    },
    goToSearchResult: (cfi: string) => {
      const view = viewRef.current
      if (!view) return

      void (async () => {
        try {
          if (view.select) await view.select(cfi)
          else await view.goTo(cfi)
          await view.addAnnotation({ value: `${FOLIATE_SEARCH_PREFIX}${cfi}` })
        } catch (error) {
          console.error('Failed to navigate to search result', error)
        }
      })()
    },
    getToc: () => tocRef.current,
    searchBook: async (query, onProgress) => {
      const view = viewRef.current
      if (!view?.search) return []

      const sections: FoliateSearchSection[] = []

      for await (const result of view.search({ query })) {
        if (result === 'done') break

        if ('progress' in result) {
          onProgress?.(result.progress)
          continue
        }

        if ('subitems' in result && result.subitems.length > 0) {
          const sectionId = `section-${sections.length}`
          sections.push({
            id: sectionId,
            label: result.label.trim(),
            hits: result.subitems.map((item, index) => ({
              id: `${sectionId}-${index}`,
              cfi: item.cfi,
              excerpt: item.excerpt
            }))
          })
        }
      }

      return sections
    },
    clearSearch: () => {
      viewRef.current?.clearSearch()
    }
  }))

  const flushProgress = useCallback(async () => {
    const pending = pendingProgressRef.current
    if (!pending) return
    pendingProgressRef.current = null

    try {
      await updateEbookProgressAction(libraryItemId, pending)
      lastSavedLocationRef.current = pending.ebookLocation
    } catch (error) {
      console.error('Failed to save ebook progress', error)
    }
  }, [libraryItemId])

  const scheduleProgressSave = useCallback(
    (detail: FoliateRelocateDetail) => {
      const progress = progressFromRelocate(detail, ebookFormat)
      if (!progress) return
      if (progress.ebookLocation === lastSavedLocationRef.current) return

      pendingProgressRef.current = progress

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        void flushProgress()
      }, PROGRESS_DEBOUNCE_MS)
    },
    [ebookFormat, flushProgress]
  )

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    applyEreaderSettingsToView(view, settings, ebookFormat)
  }, [ebookFormat, settings])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resumePage = parseResumePage(savedEbookLocation, ebookFormat)
    const resumeCfi = parseResumeCfi(savedEbookLocation, ebookFormat)
    const pageBased = usesPageBasedProgress(ebookFormat)

    let cancelled = false
    let removeRelocateListener: (() => void) | undefined
    let removeLoadListener: (() => void) | undefined
    let removeDocumentKeydownListener: (() => void) | undefined
    let removeEpubSecurity: (() => void) | undefined
    let handleKeydown: ((event: KeyboardEvent) => void) | undefined
    const contentDocs = new Set<Document>()

    const onRelocate = (event: Event) => {
      scheduleProgressSave((event as CustomEvent<FoliateRelocateDetail>).detail)
    }

    const init = async () => {
      try {
        await loadFoliateViewModule()
        if (cancelled) return

        const view = document.createElement('foliate-view') as FoliateViewElement
        view.style.display = 'block'
        view.style.width = '100%'
        view.style.height = '100%'
        container.appendChild(view)
        viewRef.current = view

        // Foliate renders sections in iframes so listener needs to be added to each
        handleKeydown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onCloseRef.current?.()
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            void view.goLeft()
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            void view.goRight()
          }
        }

        const onLoad = (event: Event) => {
          if (!handleKeydown) return
          const { doc } = (event as CustomEvent<{ doc: Document }>).detail
          doc.addEventListener('keydown', handleKeydown)
          contentDocs.add(doc)
        }

        view.addEventListener('load', onLoad)
        document.addEventListener('keydown', handleKeydown)
        removeLoadListener = () => view.removeEventListener('load', onLoad)
        removeDocumentKeydownListener = () => {
          if (handleKeydown) document.removeEventListener('keydown', handleKeydown)
        }

        const response = await fetch(`/internal-api/items/${libraryItemId}/ebook`, {
          credentials: 'include',
          headers: { Accept: 'application/json' }
        })
        if (!response.ok) {
          throw new Error(`Failed to load ebook (${response.status})`)
        }

        const blob = await response.blob()
        if (cancelled) return

        const file = blobToEbookFile(blob, ebookFormat, title)
        const allowScriptedContent = ebookFormat.toLowerCase() === 'epub' && epubsAllowScriptedContent

        await view.open(file)

        if (!allowScriptedContent) {
          removeEpubSecurity = attachEpubSecurity(view)
        }

        const toc = normalizeEreaderToc(view.book?.toc)
        tocRef.current = toc
        onTocReadyRef.current?.(toc)

        if (pageBased && resumePage) {
          await view.init({ showTextStart: true })
          const resolved = await view.goTo(resumePage - 1)
          if (resolved) {
            lastSavedLocationRef.current = resumePage
          } else {
            console.warn('Failed to resume at saved page, using start of book', resumePage)
          }
        } else if (resumeCfi) {
          const resumed = await resumeEpubLocation(view, resumeCfi, savedEbookProgress)
          if (resumed) lastSavedLocationRef.current = resumeCfi
        } else {
          await view.init({ showTextStart: true })
        }

        applyEreaderSettingsToView(view, settings, ebookFormat)

        view.addEventListener('relocate', onRelocate)
        removeRelocateListener = () => view.removeEventListener('relocate', onRelocate)
      } catch (error) {
        console.error('Failed to initialize foliate reader', error)
        onErrorRef.current?.()
      }
    }

    void init()

    return () => {
      cancelled = true
      removeRelocateListener?.()
      removeLoadListener?.()
      removeDocumentKeydownListener?.()
      removeEpubSecurity?.()
      if (handleKeydown) {
        for (const doc of contentDocs) {
          doc.removeEventListener('keydown', handleKeydown)
        }
      }
      contentDocs.clear()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      void flushProgress()
      viewRef.current?.clearSearch()
      viewRef.current?.close()
      viewRef.current = null
      container.innerHTML = ''
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebookFormat, epubsAllowScriptedContent, flushProgress, libraryItemId, scheduleProgressSave, title])

  return <div ref={containerRef} className="h-full w-full" />
})

export default FoliateView
