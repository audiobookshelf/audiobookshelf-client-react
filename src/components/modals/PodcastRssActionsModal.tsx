'use client'

import SectionedModal, { type Section } from '@/components/modals/SectionedModal'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

/** The RSS operation displayed in the desktop rail or mobile section hub. */
export type PodcastRssActionSection = 'schedule' | 'find-episodes' | 'check-new-episodes'

/**
 * Navigation inputs for a podcast's three RSS operations. The caller supplies
 * the operation body so this component remains independent of server actions.
 */
export interface PodcastRssActionsModalProps {
  /** Controls whether the sectioned modal is visible. */
  isOpen: boolean
  /** Closes the manager and any operation panel it owns. */
  onClose: () => void
  /** Blocks dismissal while the active operation is writing to the server. */
  processing?: boolean
  /** Renders the operation body for the currently selected section. */
  renderSection: (section: PodcastRssActionSection) => ReactNode
}

/**
 * Groups the three podcast RSS operations behind one sectioned modal.
 * Operation-specific state is supplied by `renderSection` in production.
 */
export default function PodcastRssActionsModal({ isOpen, onClose, processing, renderSection }: PodcastRssActionsModalProps) {
  const t = useTypeSafeTranslations()
  const [selectedSection, setSelectedSection] = useState<PodcastRssActionSection>('schedule')

  const sections = useMemo<Section[]>(
    () => [
      // One word each: the desktop rail is one icon wide, and the same labels
      // are used on the mobile hub and its drill-in header.
      { id: 'schedule', label: t('HeaderSchedule'), icon: 'schedule' },
      { id: 'find-episodes', label: t('ButtonLookup'), icon: 'podcasts' },
      { id: 'check-new-episodes', label: t('ButtonCheck'), icon: 'refresh' }
    ],
    [t]
  )

  useEffect(() => {
    if (isOpen) setSelectedSection('schedule')
  }, [isOpen])

  return (
    <SectionedModal
      isOpen={isOpen}
      onClose={onClose}
      processing={processing}
      sections={sections}
      selectedSection={selectedSection}
      onSectionChange={(sectionId) => setSelectedSection(sectionId as PodcastRssActionSection)}
      outerContent={<ModalOuterContent>{t('LabelPodcastRssActions')}</ModalOuterContent>}
      className="w-[min(95vw,48rem)]"
    >
      {renderSection(selectedSection)}
    </SectionedModal>
  )
}
