'use client'

import Modal from '@/components/modals/Modal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EpisodeNavigationContext } from '@/lib/episodeEditNavigation'
import type { PodcastEpisode, PodcastLibraryItem } from '@/types/api'

export type EpisodeMatchModalProps = {
  isOpen: boolean
  onClose: () => void
} & ({ navCtx: EpisodeNavigationContext } | { libraryItem: PodcastLibraryItem; episode: PodcastEpisode })

export default function EpisodeMatchModal({ isOpen, onClose }: EpisodeMatchModalProps) {
  const t = useTypeSafeTranslations()

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="bg-bg border-border w-full rounded-lg border p-6 shadow-lg">
        <p className="text-foreground-muted text-sm">{t('HeaderMatch')} — coming soon in the React client.</p>
      </div>
    </Modal>
  )
}
