'use client'

import { updateEbookProgressAction } from '@/app/actions/ebookActions'
import type { FoliateRelocateDetail, FoliateSearchSection, FoliateViewElement } from '@/components/ereader/foliate'
import {
  downloadComicPageImage,
  getComicPageFilename,
  getComicPageImageUrl,
  getComicPageImageUrlFromDoc,
  getComicPageIndex
} from '@/lib/ereader/ereaderComicDownload'
import {
  blobToEbookFile,
  isComicFormat,
  parseResumeCfi,
  parseResumePage,
  progressFromRelocate,
  resumeEpubLocation,
  usesPageBasedProgress,
  type EbookProgressUpdate
} from '@/lib/ereader/ereaderEbook'
import { FixedLayoutZoomController, getFixedLayoutPageSize } from '@/lib/ereader/ereaderFixedLayoutZoom'
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
  zoomIn: () => void
  zoomOut: () => void
  downloadCurrentComicPage: () => void
}

interface FoliateViewProps {
  libraryItemId: string
  ebookFormat: string
  epubsAllowScriptedContent: boolean
  title: string
  savedEbookLocation?: string
  savedEbookProgress?: number
  settings: EreaderSettings
  onZoomChange?: (scale: number | null) => void
  onComicPageChange?: (filename: string | null) => void
  onTocReady?: (toc: EreaderTocItem[]) => void
  onClose?: () => void
  onError?: () => void
}

const FoliateView = forwardRef<FoliateViewHandle, FoliateViewProps>(function FoliateView(
  {
    libraryItemId,
    ebookFormat,
    epubsAllowScriptedContent,
    title,
    savedEbookLocation,
    savedEbookProgress,
    settings,
    onZoomChange,
    onComicPageChange,
    onTocReady,
    onClose,
    onError
  },
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
  const zoomCtrlRef = useRef(new FixedLayoutZoomController())
  const onZoomChangeRef = useRef(onZoomChange)
  const onComicPageChangeRef = useRef(onComicPageChange)
  const currentComicPageIndexRef = useRef(-1)
  const currentComicImageUrlRef = useRef<string | null>(null)
  const pageBased = usesPageBasedProgress(ebookFormat)
  const isComic = isComicFormat(ebookFormat)
  const isCbr = ebookFormat.toLowerCase() === 'cbr'

  onCloseRef.current = onClose
  onErrorRef.current = onError
  onZoomChangeRef.current = onZoomChange
  onComicPageChangeRef.current = onComicPageChange

  const notifyComicPage = useCallback(
    (pageIndex: number) => {
      if (!isComic || pageIndex < 0) return

      currentComicPageIndexRef.current = pageIndex
      onComicPageChangeRef.current?.(getComicPageFilename(tocRef.current, pageIndex))
    },
    [isComic]
  )

  const notifyComicPageFromRelocate = useCallback(
    (detail: FoliateRelocateDetail) => {
      const index = getComicPageIndex(detail)
      if (index === null) return
      notifyComicPage(index)
    },
    [notifyComicPage]
  )

  const runZoom = useCallback(
    (direction: 'in' | 'out') => {
      const renderer = viewRef.current?.renderer
      if (!renderer || !pageBased) return
      const scale = direction === 'in' ? zoomCtrlRef.current.zoomIn(renderer) : zoomCtrlRef.current.zoomOut(renderer)
      onZoomChangeRef.current?.(scale)
    },
    [pageBased]
  )

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
    },
    zoomIn: () => runZoom('in'),
    zoomOut: () => runZoom('out'),
    downloadCurrentComicPage: () => {
      if (!isComic) return
      const view = viewRef.current
      if (!view?.renderer) return

      const filename = getComicPageFilename(tocRef.current, currentComicPageIndexRef.current)
      const imageUrl = currentComicImageUrlRef.current ?? getComicPageImageUrl(view.renderer)
      if (!filename || !imageUrl) return

      void downloadComicPageImage(imageUrl, filename).catch((error) => {
        console.error('Failed to download comic page', error)
      })
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
      notifyComicPageFromRelocate(detail)

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
    [ebookFormat, flushProgress, notifyComicPageFromRelocate]
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
    let cancelled = false
    let removeRelocateListener: (() => void) | undefined
    let removeLoadListener: (() => void) | undefined
    let removeDocumentKeydownListener: (() => void) | undefined
    let removeEpubSecurity: (() => void) | undefined
    let removeWheelListeners: (() => void) | undefined
    let handleKeydown: ((event: KeyboardEvent) => void) | undefined
    let handleWheelZoom: ((event: WheelEvent) => void) | undefined
    const contentDocs = new Set<Document>()
    const zoomCtrl = zoomCtrlRef.current

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

        handleWheelZoom = (event: WheelEvent) => {
          if (!pageBased || !event.ctrlKey) return
          event.preventDefault()
          event.stopPropagation()
          const renderer = view.renderer
          if (!renderer) return
          const scale = event.deltaY < 0 ? zoomCtrlRef.current.zoomIn(renderer) : zoomCtrlRef.current.zoomOut(renderer)
          onZoomChangeRef.current?.(scale)
        }

        const onLoad = (event: Event) => {
          const { doc, index } = (event as CustomEvent<{ doc: Document; index?: number }>).detail
          if (isComic) {
            currentComicImageUrlRef.current = getComicPageImageUrlFromDoc(doc)
            if (typeof index === 'number') notifyComicPage(index)
          }
          const syncPageSize = () => {
            const pageSize = getFixedLayoutPageSize(doc)
            if (pageSize) zoomCtrlRef.current.setPageSize(pageSize, view.renderer)
          }
          syncPageSize()
          const img = doc.querySelector('img')
          if (img && !img.naturalWidth) img.addEventListener('load', syncPageSize, { once: true })
          if (handleKeydown) doc.addEventListener('keydown', handleKeydown)
          if (handleWheelZoom) doc.addEventListener('wheel', handleWheelZoom, { passive: false, capture: true })
          contentDocs.add(doc)
        }

        view.addEventListener('load', onLoad)
        document.addEventListener('keydown', handleKeydown)
        removeLoadListener = () => view.removeEventListener('load', onLoad)

        if (pageBased && handleWheelZoom) {
          const wheelOptions: AddEventListenerOptions = { passive: false, capture: true }
          container.addEventListener('wheel', handleWheelZoom, wheelOptions)
          document.addEventListener('wheel', handleWheelZoom, wheelOptions)
          removeWheelListeners = () => {
            container.removeEventListener('wheel', handleWheelZoom!, wheelOptions)
            document.removeEventListener('wheel', handleWheelZoom!, wheelOptions)
          }
        }
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

        const allowScriptedContent = ebookFormat.toLowerCase() === 'epub' && epubsAllowScriptedContent

        if (isCbr) {
          const { createCbrComicBook } = await import('@/lib/ereader/ereaderCbrBook')
          const book = await createCbrComicBook(blob, title)
          if (cancelled) return
          await view.open(book)
        } else {
          const file = blobToEbookFile(blob, ebookFormat, title)
          await view.open(file)
        }

        view.addEventListener('relocate', onRelocate)
        removeRelocateListener = () => view.removeEventListener('relocate', onRelocate)

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
      removeWheelListeners?.()
      if (handleKeydown || handleWheelZoom) {
        for (const doc of contentDocs) {
          if (handleKeydown) doc.removeEventListener('keydown', handleKeydown)
          if (handleWheelZoom) doc.removeEventListener('wheel', handleWheelZoom, { capture: true })
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
      zoomCtrl.reset()
      currentComicPageIndexRef.current = -1
      currentComicImageUrlRef.current = null
      container.innerHTML = ''
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebookFormat, epubsAllowScriptedContent, flushProgress, libraryItemId, scheduleProgressSave, title])

  return <div ref={containerRef} className="h-full w-full" />
})

export default FoliateView
