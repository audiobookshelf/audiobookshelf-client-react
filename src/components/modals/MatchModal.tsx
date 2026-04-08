'use client'

import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import Modal from '@/components/modals/Modal'
import ModalSideNavigation from '@/components/modals/ModalSideNavigation'
import Match from '@/components/widgets/Match'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useEntityNavigationContext } from '@/hooks/useEntityNavigationContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EntityNavigationContext } from '@/lib/bookshelfNavigationContext'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useCallback, useLayoutEffect, useRef, useState, useTransition } from 'react'

export type MatchModalProps = {
  isOpen: boolean
  onClose: () => void
} & ({ libraryItem: BookLibraryItem | PodcastLibraryItem } | { navCtx: EntityNavigationContext })

export default function MatchModal(props: MatchModalProps) {
  const { isOpen, onClose } = props
  const navCtxMode = 'navCtx' in props
  const navCtx = navCtxMode ? props.navCtx : undefined
  const entityIds = navCtx?.entityIds ?? []

  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [fetchedItem, setFetchedItem] = useState<BookLibraryItem | PodcastLibraryItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [navFetchPending, setNavFetchPending] = useState(false)
  const fetchGenRef = useRef(0)

  const { currentEntityId, canGoPrev, canGoNext, goPrev, goNext } = useEntityNavigationContext(navCtx, isOpen)

  useLayoutEffect(() => {
    if (!isOpen || !navCtxMode) return
    if (!currentEntityId) {
      setFetchedItem(null)
      return
    }

    const gen = ++fetchGenRef.current
    setNavFetchPending(true)
    setFetchedItem(null)

    startTransition(async () => {
      try {
        const full = await getExpandedLibraryItemAction(currentEntityId)
        if (fetchGenRef.current !== gen) return
        setFetchedItem(full as BookLibraryItem | PodcastLibraryItem)
      } catch (error) {
        console.error('Failed to load library item for match', error)
        if (fetchGenRef.current === gen) {
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
          onClose()
        }
      } finally {
        if (fetchGenRef.current === gen) {
          setNavFetchPending(false)
        }
      }
    })
  }, [isOpen, navCtxMode, navCtx, currentEntityId, onClose, showToast, startTransition, t])

  const blurActiveElement = () => {
    const el = document.activeElement
    if (el instanceof HTMLElement) el.blur()
  }

  const handleGoPrev = useCallback(() => {
    blurActiveElement()
    goPrev()
  }, [goPrev])

  const handleGoNext = useCallback(() => {
    blurActiveElement()
    goNext()
  }, [goNext])

  if (!isOpen) return null

  const resolvedItem = navCtxMode ? fetchedItem : props.libraryItem
  const mediaTitle = resolvedItem?.media.metadata.title ?? ''
  const outerContent = mediaTitle ? (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="max-w-[calc(100vw-4rem)] truncate text-lg text-white" title={mediaTitle}>
        {mediaTitle}
      </h2>
    </div>
  ) : undefined
  const showRails = navCtxMode && entityIds.length > 1
  const navigationProcessing = navCtxMode && (navFetchPending || isPending)

  const sideNavigation =
    showRails && isOpen ? (
      <ModalSideNavigation canGoPrev={canGoPrev} canGoNext={canGoNext} onPrevAction={handleGoPrev} onNextAction={handleGoNext} />
    ) : undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      processing={navigationProcessing}
      sideNavigation={sideNavigation}
      outerContent={outerContent}
      className="md:max-w-[min(90vw,56rem)] lg:max-w-[min(90vw,56rem)]"
    >
      <div className="flex h-[80vh] flex-col overflow-hidden">{resolvedItem ? <Match libraryItem={resolvedItem} /> : null}</div>
    </Modal>
  )
}
