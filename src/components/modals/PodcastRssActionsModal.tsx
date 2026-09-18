'use client'

import Modal from '@/components/modals/Modal'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback } from 'react'

/** Properties required to render one podcast RSS action button. */
interface PodcastRssActionButtonProps {
  /** Label rendered on the button. */
  label: string
  /** Material Symbols icon rendered on the button. */
  icon: string
  /** Invoked when the action button is pressed. */
  onAction: () => void
}

/** Renders one operation in the per-podcast RSS action list. */
function PodcastRssActionButton({ label, icon, onAction }: PodcastRssActionButtonProps) {
  return (
    <Btn onClick={onAction} className="w-full justify-between text-start">
      {label}
      <span className="material-symbols ms-2" aria-hidden>
        {icon}
      </span>
    </Btn>
  )
}

/** Properties required to render the per-podcast RSS actions modal. */
export interface PodcastRssActionsModalProps {
  /** Controls whether the modal is mounted and visible. */
  isOpen: boolean
  /** Closes the RSS actions modal. */
  onClose: () => void
  /** Opens the existing automatic-download schedule editor. */
  onOpenSchedule: () => void
  /** Opens the existing Find Episodes flow. */
  onFindEpisodes: () => void
  /** Opens the existing Check for New Episodes flow. */
  onCheckNewEpisodes: () => void
}

/**
 * Groups podcast RSS operations behind one per-podcast entry point.
 *
 * The modal owns presentation and dispatch only. Each operation remains owned
 * by its existing host so its API calls and behavior can later be reused by
 * bulk management.
 */
export default function PodcastRssActionsModal({
  isOpen,
  onClose,
  onOpenSchedule,
  onFindEpisodes,
  onCheckNewEpisodes
}: PodcastRssActionsModalProps) {
  const t = useTypeSafeTranslations()

  const runAction = useCallback(
    (action: () => void) => {
      onClose()
      action()
    },
    [onClose]
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      outerContent={<ModalOuterContent>{t('LabelPodcastRssActions')}</ModalOuterContent>}
      className="w-[min(95vw,32rem)]"
    >
      <div className="flex flex-col gap-3 p-6">
        <PodcastRssActionButton label={t('HeaderSchedule')} icon="schedule" onAction={() => runAction(onOpenSchedule)} />
        <PodcastRssActionButton label={t('LabelFindEpisodes')} icon="podcasts" onAction={() => runAction(onFindEpisodes)} />
        <PodcastRssActionButton
          label={t('ButtonCheckForNewEpisodes')}
          icon="refresh"
          onAction={() => runAction(onCheckNewEpisodes)}
        />
      </div>
    </Modal>
  )
}
