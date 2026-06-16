'use client'

import Modal from '@/components/modals/Modal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EntityNavigationContext } from '@/lib/bookshelfNavigationContext'
import type { LibraryItem, PodcastEpisode } from '@/types/api'

export interface EpisodeEditModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: LibraryItem
  episode: PodcastEpisode
  navCtx?: EntityNavigationContext
}

/**
 * Episode edit modal shell. Full details/match tabs are not yet ported from the Vue client.
 */
export default function EpisodeEditModal({ isOpen, onClose, libraryItem, episode, navCtx }: EpisodeEditModalProps) {
  const t = useTypeSafeTranslations()

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="bg-bg border-black-300 w-full rounded-lg border p-6 shadow-lg">
        <h2 className="text-foreground mb-2 text-2xl font-semibold">{episode.title}</h2>
        {libraryItem.media.metadata.title && (
          <p className="text-foreground-muted mb-4 text-sm">{libraryItem.media.metadata.title}</p>
        )}
        <p className="text-foreground-muted text-sm">
          {t('HeaderDetails')} — coming soon in the React client.
        </p>
        {navCtx && navCtx.entityIds.length > 1 && (
          <p className="text-foreground-subdued mt-2 text-xs">
            {navCtx.initialIndex + 1} / {navCtx.entityIds.length}
          </p>
        )}
      </div>
    </Modal>
  )
}
