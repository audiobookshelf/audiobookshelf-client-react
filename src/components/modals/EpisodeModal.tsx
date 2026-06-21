'use client'

import { getExpandedLibraryItemAction, getPodcastEpisodeAction } from '@/app/actions/mediaActions'
import type { ModalProps } from '@/components/modals/Modal'
import Modal from '@/components/modals/Modal'
import ModalSideNavigation from '@/components/modals/ModalSideNavigation'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useEpisodeNavigationContext } from '@/hooks/useEpisodeNavigationContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EpisodeNavigationContext } from '@/lib/episodeEditNavigation'
import type { PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react'

export type EpisodeModalContextValue = {
  resolvedEpisode: PodcastEpisode | null
  resolvedLibraryItem: PodcastLibraryItem | null
  fetchPending: boolean
  pendingEpisodeId: string | null
  syncResolvedEpisode: (episode: PodcastEpisode, libraryItem?: PodcastLibraryItem) => void
}

const EpisodeModalContext = createContext<EpisodeModalContextValue | null>(null)

export function useEpisodeModal(): EpisodeModalContextValue {
  const ctx = useContext(EpisodeModalContext)
  if (!ctx) {
    throw new Error('useEpisodeModal must be used within EpisodeModal')
  }
  return ctx
}

export type EpisodeModalItemSource = { navCtx: EpisodeNavigationContext } | { libraryItem: PodcastLibraryItem; episode: PodcastEpisode }

export type EpisodeModalProps = Omit<ModalProps, 'outerContent' | 'sideNavigation' | 'processing' | 'children'> &
  EpisodeModalItemSource & {
    additionalProcessing?: boolean
    children: ReactNode
  }

export default function EpisodeModal(props: EpisodeModalProps) {
  const { additionalProcessing = false, children, isOpen, onClose, persistent, zIndexClass, bgOpacityClass, className, style } = props

  const navCtxMode = 'navCtx' in props
  const navCtx = navCtxMode ? props.navCtx : undefined
  const directLibraryItem = 'libraryItem' in props ? props.libraryItem : undefined
  const directEpisode = 'episode' in props ? props.episode : undefined

  const slots = navCtx?.slots ?? []

  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [fetchedEpisode, setFetchedEpisode] = useState<PodcastEpisode | null>(null)
  const [fetchedLibraryItem, setFetchedLibraryItem] = useState<PodcastLibraryItem | null>(null)
  const [isNavPending, startNavTransition] = useTransition()
  const [navFetchPending, setNavFetchPending] = useState(false)
  const fetchGenRef = useRef(0)

  const { currentSlot, canGoPrev, canGoNext, goPrev, goNext } = useEpisodeNavigationContext(navCtx, isOpen)

  const currentLibraryItemId = currentSlot?.libraryItemId ?? null
  const currentEpisodeId = currentSlot?.episodeId ?? null

  useLayoutEffect(() => {
    if (!isOpen || !navCtxMode) return
    if (!currentLibraryItemId || !currentEpisodeId) {
      setFetchedEpisode(null)
      setFetchedLibraryItem(null)
      return
    }

    const libraryItemId = currentLibraryItemId
    const episodeId = currentEpisodeId
    const gen = ++fetchGenRef.current
    setNavFetchPending(true)
    setFetchedEpisode(null)

    startNavTransition(async () => {
      try {
        const [episode, libraryItem] = await Promise.all([getPodcastEpisodeAction(libraryItemId, episodeId), getExpandedLibraryItemAction(libraryItemId)])
        if (fetchGenRef.current !== gen) return
        setFetchedEpisode(episode)
        setFetchedLibraryItem(libraryItem as PodcastLibraryItem)
      } catch (error) {
        console.error('Failed to load podcast episode', error)
        if (fetchGenRef.current === gen) {
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
          onClose?.()
        }
      } finally {
        if (fetchGenRef.current === gen) {
          setNavFetchPending(false)
        }
      }
    })
  }, [isOpen, navCtxMode, currentLibraryItemId, currentEpisodeId, onClose, showToast, startNavTransition, t])

  const resolvedEpisode = navCtxMode ? fetchedEpisode : (directEpisode ?? null)
  const resolvedLibraryItem = navCtxMode ? fetchedLibraryItem : (directLibraryItem ?? null)

  const syncResolvedEpisode = useCallback(
    (episode: PodcastEpisode, libraryItem?: PodcastLibraryItem) => {
      if (!navCtxMode) return
      setFetchedEpisode(episode)
      if (libraryItem) {
        setFetchedLibraryItem(libraryItem)
      } else if (fetchedLibraryItem) {
        const episodes = fetchedLibraryItem.media.episodes ?? []
        const updatedEpisodes = episodes.map((ep) => (ep.id === episode.id ? { ...ep, ...episode } : ep))
        setFetchedLibraryItem({
          ...fetchedLibraryItem,
          media: {
            ...fetchedLibraryItem.media,
            episodes: updatedEpisodes
          }
        })
      }
    },
    [navCtxMode, fetchedLibraryItem]
  )

  const handleItemUpdated = useCallback(
    (libraryItem: PodcastLibraryItem) => {
      if (!navCtxMode || !resolvedEpisode) return
      if (libraryItem.id !== resolvedLibraryItem?.id) return
      const episode = libraryItem.media.episodes?.find((ep) => ep.id === resolvedEpisode.id)
      if (episode) {
        setFetchedEpisode(episode)
        setFetchedLibraryItem(libraryItem)
      }
    },
    [navCtxMode, resolvedEpisode, resolvedLibraryItem?.id]
  )

  useSocketEvent<PodcastLibraryItem>('item_updated', handleItemUpdated, [handleItemUpdated])

  const blurActiveElement = useCallback(() => {
    const el = document.activeElement
    if (el instanceof HTMLElement) el.blur()
  }, [])

  const handleGoPrev = useCallback(() => {
    blurActiveElement()
    goPrev()
  }, [blurActiveElement, goPrev])

  const handleGoNext = useCallback(() => {
    blurActiveElement()
    goNext()
  }, [blurActiveElement, goNext])

  const mediaTitle = resolvedLibraryItem?.media.metadata.title ?? ''
  const outerContent = useMemo(() => {
    if (!mediaTitle) return undefined
    return (
      <div className="absolute start-0 top-0 p-4">
        <h2 className="max-w-[calc(100vw-4rem)] truncate text-xl text-white" title={mediaTitle}>
          {mediaTitle}
        </h2>
      </div>
    )
  }, [mediaTitle])

  const showRails = navCtxMode && slots.length > 1
  const fetchPending = navCtxMode && (navFetchPending || isNavPending)
  const pendingEpisodeId = navCtxMode && fetchPending && !resolvedEpisode ? (currentSlot?.episodeId ?? null) : null

  const sideNavigation = useMemo(() => {
    if (!showRails || !isOpen) return undefined
    return <ModalSideNavigation canGoPrev={canGoPrev} canGoNext={canGoNext} onPrevAction={handleGoPrev} onNextAction={handleGoNext} />
  }, [showRails, isOpen, canGoPrev, canGoNext, handleGoPrev, handleGoNext])

  const modalCtx = useMemo(
    () => ({
      resolvedEpisode,
      resolvedLibraryItem,
      fetchPending,
      pendingEpisodeId,
      syncResolvedEpisode
    }),
    [resolvedEpisode, resolvedLibraryItem, fetchPending, pendingEpisodeId, syncResolvedEpisode]
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      persistent={persistent}
      zIndexClass={zIndexClass}
      bgOpacityClass={bgOpacityClass}
      className={className}
      style={style}
      outerContent={outerContent}
      sideNavigation={sideNavigation}
      processing={additionalProcessing}
    >
      <EpisodeModalContext.Provider value={modalCtx}>{children}</EpisodeModalContext.Provider>
    </Modal>
  )
}
