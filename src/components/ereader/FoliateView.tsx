'use client'

import { updateEbookProgressAction } from '@/app/actions/ebookActions'
import type { FoliateRelocateDetail, FoliateViewElement } from '@/components/ereader/foliate'
import {
  blobToEbookFile,
  parseResumeCfi,
  parseResumePage,
  progressFromRelocate,
  usesPageBasedProgress,
  type EbookProgressUpdate
} from '@/lib/ereader/ereaderEbook'
import { applyEreaderSettingsToView, type EreaderSettings } from '@/lib/ereader/ereaderSettings'
import { attachEpubSecurity } from '@/lib/ereader/ereaderSecurity'
import { normalizeEreaderToc, type EreaderTocItem } from '@/lib/ereader/ereaderToc'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

const PROGRESS_DEBOUNCE_MS = 2000

async function loadFoliateViewModule() {
  await import('foliate-js/view.js')
}

export interface FoliateViewHandle {
  goLeft: () => void
  goRight: () => void
  goTo: (href: string) => void
  getToc: () => EreaderTocItem[]
}

interface FoliateViewProps {
  libraryItemId: string
  ebookFormat: string
  epubsAllowScriptedContent: boolean
  title: string
  savedEbookLocation?: string
  settings: EreaderSettings
  onTocReady?: (toc: EreaderTocItem[]) => void
  onClose?: () => void
  onError?: () => void
}

const FoliateView = forwardRef<FoliateViewHandle, FoliateViewProps>(function FoliateView(
  { libraryItemId, ebookFormat, epubsAllowScriptedContent, title, savedEbookLocation, settings, onTocReady, onClose, onError },
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
    getToc: () => tocRef.current
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
          await view.goTo(resumePage - 1)
          lastSavedLocationRef.current = resumePage
        } else if (resumeCfi) {
          await view.init({ lastLocation: resumeCfi })
          lastSavedLocationRef.current = resumeCfi
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
      viewRef.current?.close()
      viewRef.current = null
      container.innerHTML = ''
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebookFormat, epubsAllowScriptedContent, flushProgress, libraryItemId, scheduleProgressSave, title])

  return <div ref={containerRef} className="h-full w-full" />
})

export default FoliateView
