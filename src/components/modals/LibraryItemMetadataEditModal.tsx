'use client'

import { ChaptersEditModalBody, type ChaptersEditCloseHandle } from '@/components/modals/ChaptersEditModalBody'
import { CoverEditModalBody } from '@/components/modals/CoverEditModal'
import { LibraryItemEditModalContent } from '@/components/modals/LibraryItemEditModal'
import LibraryItemModal, { type LibraryItemModalItemSource, useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import { MatchModalBody } from '@/components/modals/MatchModal'
import { SectionedModalBody, type Section } from '@/components/modals/SectionedModal'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isBookMediaWithTracks, type BookLibraryItem, type PodcastLibraryItem } from '@/types/api'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type Ref,
  type SetStateAction,
  type TransitionStartFunction
} from 'react'

export type MetadataEditSection = 'details' | 'cover' | 'chapters' | 'match'

export type LibraryItemMetadataEditModalProps = {
  isOpen: boolean
  onClose: () => void
  initialSection?: MetadataEditSection
} & LibraryItemModalItemSource

function isBookWithAudioTracks(item: BookLibraryItem | PodcastLibraryItem | null): boolean {
  return !!item && item.mediaType === 'book' && isBookMediaWithTracks(item.media)
}

interface LibraryItemMetadataEditModalBodyProps {
  isOpen: boolean
  onClose: () => void
  initialSection?: MetadataEditSection
  selectedSection: MetadataEditSection
  setSelectedSection: Dispatch<SetStateAction<MetadataEditSection>>
  onSectionChange: (sectionId: string) => void
  onRequestHubBack: (proceed: () => void) => void
  startSaveTransition: TransitionStartFunction
  isSavePending: boolean
  chaptersCloseRef: Ref<ChaptersEditCloseHandle | null>
  onChaptersPendingChange: (pending: boolean) => void
}

function LibraryItemMetadataEditModalBody({
  isOpen,
  onClose,
  initialSection,
  selectedSection,
  setSelectedSection,
  onSectionChange,
  onRequestHubBack,
  startSaveTransition,
  isSavePending,
  chaptersCloseRef,
  onChaptersPendingChange
}: LibraryItemMetadataEditModalBodyProps) {
  const t = useTypeSafeTranslations()
  const { library } = useLibrary()
  const { resolvedItem } = useLibraryItemModal()

  const includeChaptersNav = isBookWithAudioTracks(resolvedItem) || (!resolvedItem && (initialSection === 'chapters' || library.mediaType === 'book'))

  useEffect(() => {
    if (!resolvedItem) return
    if (selectedSection === 'chapters' && !isBookWithAudioTracks(resolvedItem)) {
      setSelectedSection('details')
    }
  }, [resolvedItem, selectedSection, setSelectedSection])

  const sections = useMemo<Section[]>(() => {
    const result: Section[] = [
      { id: 'details', label: t('HeaderDetails'), icon: 'edit' },
      { id: 'cover', label: t('HeaderCover'), icon: 'image' }
    ]
    if (includeChaptersNav) {
      result.push({ id: 'chapters', label: t('HeaderChapters'), icon: 'format_list_bulleted' })
    }
    result.push({ id: 'match', label: t('HeaderMatch'), icon: 'travel_explore' })
    return result
  }, [includeChaptersNav, t])

  const bodyInitialSection = includeChaptersNav ? initialSection : initialSection === 'chapters' ? 'details' : initialSection

  return (
    <SectionedModalBody
      sections={sections}
      selectedSection={selectedSection}
      onSectionChange={onSectionChange}
      onRequestHubBack={onRequestHubBack}
      isOpen={isOpen}
      initialSection={bodyInitialSection}
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
      ) : selectedSection === 'chapters' ? (
        <ChaptersEditModalBody closeRequestRef={chaptersCloseRef} onPendingChange={onChaptersPendingChange} />
      ) : (
        <MatchModalBody fillParent />
      )}
    </SectionedModalBody>
  )
}

/**
 * Combined Details, Cover, Chapters, and Match editor for a library item.
 */
export default function LibraryItemMetadataEditModal(props: LibraryItemMetadataEditModalProps) {
  const { isOpen, onClose, initialSection } = props
  const navCtxMode = 'navCtx' in props
  const { filterDataLoading } = useLibrary()
  const [isSavePending, startSaveTransition] = useTransition()
  const [selectedSection, setSelectedSection] = useState<MetadataEditSection>(initialSection ?? 'details')
  const [isChaptersPending, setIsChaptersPending] = useState(false)
  const chaptersCloseRef = useRef<ChaptersEditCloseHandle | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSelectedSection(initialSection ?? 'details')
  }, [isOpen, initialSection])

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      const next = sectionId as MetadataEditSection
      if (next === selectedSection) return
      if (selectedSection === 'chapters' && chaptersCloseRef.current) {
        chaptersCloseRef.current.requestLeave(() => setSelectedSection(next))
        return
      }
      setSelectedSection(next)
    },
    [selectedSection]
  )

  const handleHubBack = useCallback(
    (proceed: () => void) => {
      if (selectedSection === 'chapters' && chaptersCloseRef.current) {
        chaptersCloseRef.current.requestLeave(proceed)
        return
      }
      proceed()
    },
    [selectedSection]
  )

  const handleClose = useCallback(() => {
    if (selectedSection === 'chapters' && chaptersCloseRef.current) {
      chaptersCloseRef.current.requestLeave(onClose)
      return
    }
    onClose()
  }, [onClose, selectedSection])

  return (
    <LibraryItemModal
      isOpen={isOpen}
      onClose={handleClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem })}
      additionalProcessing={isSavePending || filterDataLoading || isChaptersPending}
      className="md:max-w-[min(95vw,60rem)]"
    >
      <LibraryItemMetadataEditModalBody
        isOpen={isOpen}
        onClose={handleClose}
        initialSection={initialSection}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        onSectionChange={handleSectionChange}
        onRequestHubBack={handleHubBack}
        startSaveTransition={startSaveTransition}
        isSavePending={isSavePending}
        chaptersCloseRef={chaptersCloseRef}
        onChaptersPendingChange={setIsChaptersPending}
      />
    </LibraryItemModal>
  )
}
