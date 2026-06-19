'use client'

import Modal from '@/components/modals/Modal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EpisodeNavigationContext } from '@/lib/episodeEditNavigation'
import type { PodcastEpisode, PodcastLibraryItem } from '@/types/api'

export type EpisodeEditModalProps = {
  isOpen: boolean
  onClose: () => void
} & ({ navCtx: EpisodeNavigationContext } | { libraryItem: PodcastLibraryItem; episode: PodcastEpisode })

/**
 * Episode edit modal shell. Full details/match tabs are not yet ported from the Vue client.
 */
export default function EpisodeEditModal(props: EpisodeEditModalProps) {
  const { isOpen, onClose } = props
  const navCtx = 'navCtx' in props ? props.navCtx : undefined
  const libraryItem = 'libraryItem' in props ? props.libraryItem : undefined
  const episode = 'episode' in props ? props.episode : undefined

  const t = useTypeSafeTranslations()

  const title = episode?.title ?? ''
  const podcastTitle = libraryItem?.media.metadata.title ?? ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="bg-bg border-black-300 w-full rounded-lg border p-6 shadow-lg">
        {title && <h2 className="text-foreground mb-2 text-2xl font-semibold">{title}</h2>}
        {podcastTitle && <p className="text-foreground-muted mb-4 text-sm">{podcastTitle}</p>}
        <p className="text-foreground-muted text-sm">{t('HeaderDetails')} — coming soon in the React client.</p>
        {navCtx && navCtx.slots.length > 1 && (
          <p className="text-foreground-subdued mt-2 text-xs">
            {navCtx.initialIndex + 1} / {navCtx.slots.length}
          </p>
        )}
      </div>
    </Modal>
  )
}
