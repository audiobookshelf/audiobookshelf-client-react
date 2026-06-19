'use client'

import EpisodeModal, { useEpisodeModal, type EpisodeModalItemSource } from '@/components/modals/EpisodeModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import EpisodeMatch from '@/components/widgets/EpisodeMatch'

export type EpisodeMatchModalProps = {
  isOpen: boolean
  onClose: () => void
} & EpisodeModalItemSource

function EpisodeMatchModalBody() {
  const { resolvedEpisode, resolvedLibraryItem, fetchPending, syncResolvedEpisode } = useEpisodeModal()

  if (fetchPending && !resolvedEpisode) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingIndicator variant="inline" />
      </div>
    )
  }

  if (!resolvedEpisode || !resolvedLibraryItem) return null

  return (
    <EpisodeMatch
      libraryItem={resolvedLibraryItem}
      episode={resolvedEpisode}
      onEpisodeUpdated={(episode, libraryItem) => syncResolvedEpisode(episode, libraryItem)}
    />
  )
}

export default function EpisodeMatchModal(props: EpisodeMatchModalProps) {
  const { isOpen, onClose } = props
  const navCtxMode = 'navCtx' in props

  return (
    <EpisodeModal
      isOpen={isOpen}
      onClose={onClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem, episode: props.episode })}
      className="md:max-w-[min(90vw,56rem)] lg:max-w-[min(90vw,56rem)]"
    >
      <div className="bg-bg border-border flex max-h-[80vh] flex-col overflow-hidden rounded-lg border">
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <EpisodeMatchModalBody />
        </div>
      </div>
    </EpisodeModal>
  )
}
