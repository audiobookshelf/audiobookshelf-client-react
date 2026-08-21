'use client'

import { CoverEditModalBody } from '@/components/modals/CoverEditModal'
import { LibraryItemEditModalContent } from '@/components/modals/LibraryItemEditModal'
import LibraryItemModal, { type LibraryItemModalItemSource } from '@/components/modals/LibraryItemModal'
import { MatchModalBody } from '@/components/modals/MatchModal'
import { SectionedModalBody, type Section } from '@/components/modals/SectionedModal'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useEffect, useMemo, useState, useTransition } from 'react'

export type MetadataEditSection = 'details' | 'cover' | 'match'

export type LibraryItemMetadataEditModalProps = {
  isOpen: boolean
  onClose: () => void
  initialSection?: MetadataEditSection
} & LibraryItemModalItemSource

/**
 * Combined Details, Cover, and Match editor for a library item.
 */
export default function LibraryItemMetadataEditModal(props: LibraryItemMetadataEditModalProps) {
  const { isOpen, onClose, initialSection } = props
  const navCtxMode = 'navCtx' in props
  const t = useTypeSafeTranslations()
  const { filterDataLoading } = useLibrary()
  const [isSavePending, startSaveTransition] = useTransition()
  const [selectedSection, setSelectedSection] = useState<MetadataEditSection>(initialSection ?? 'details')

  useEffect(() => {
    if (!isOpen) return
    setSelectedSection(initialSection ?? 'details')
  }, [isOpen, initialSection])

  const sections = useMemo<Section[]>(
    () => [
      { id: 'details', label: t('HeaderDetails'), icon: 'edit' },
      { id: 'cover', label: t('HeaderCover'), icon: 'image' },
      { id: 'match', label: t('HeaderMatch'), icon: 'travel_explore' }
    ],
    [t]
  )

  return (
    <LibraryItemModal
      isOpen={isOpen}
      onClose={onClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem })}
      additionalProcessing={isSavePending || filterDataLoading}
      className="md:max-w-[min(95vw,60rem)]"
    >
      <SectionedModalBody
        sections={sections}
        selectedSection={selectedSection}
        onSectionChange={(sectionId) => setSelectedSection(sectionId as MetadataEditSection)}
        isOpen={isOpen}
        initialSection={initialSection}
      >
        {selectedSection === 'details' ? (
          <LibraryItemEditModalContent
            isOpen={isOpen}
            startSaveTransition={startSaveTransition}
            isSavePending={isSavePending}
            onClose={onClose}
            stableBodyHeight={false}
            fillParent
          />
        ) : selectedSection === 'cover' ? (
          <CoverEditModalBody stableBodyHeight={false} fillParent />
        ) : (
          <MatchModalBody fillParent />
        )}
      </SectionedModalBody>
    </LibraryItemModal>
  )
}
