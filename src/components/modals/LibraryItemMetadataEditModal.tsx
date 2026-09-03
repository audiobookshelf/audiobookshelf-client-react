'use client'

import { ChaptersEditModalBody, type ChaptersEditCloseHandle } from '@/components/modals/ChaptersEditModalBody'
import { CoverEditModalBody } from '@/components/modals/CoverEditModal'
import { LibraryItemEditModalContent } from '@/components/modals/LibraryItemEditModal'
import LibraryItemModal, { useLibraryItemModal, type LibraryItemModalItemSource } from '@/components/modals/LibraryItemModal'
import { MatchModalBody } from '@/components/modals/MatchModal'
import { MetadataEditFooterProvider } from '@/components/modals/MetadataEditFooterContext'
import ModalFooter from '@/components/modals/ModalFooter'
import { SectionedModalBody, type Section } from '@/components/modals/SectionedModal'
import EmbedMetadataFooterControl from '@/components/widgets/EmbedMetadataFooterControl'
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
  /**
   * Desktop rail tab to select. On mobile, generic Edit (`details` / omitted) opens the hub;
   * `cover` and `match` open that section (e.g. Match from the context menu).
   */
  initialSection?: MetadataEditSection
} & LibraryItemModalItemSource

function isBookWithAudioTracks(item: BookLibraryItem | PodcastLibraryItem | null): boolean {
  return !!item && item.mediaType === 'book' && isBookMediaWithTracks(item.media)
}

/** If the chapters editor is mounted, confirm unsaved edits first; otherwise run `proceed` now. */
function requestChaptersLeaveOrProceed(handle: ChaptersEditCloseHandle | null, proceed: () => void) {
  if (handle) {
    handle.requestLeave(proceed)
    return
  }
  proceed()
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
  const [endContainer, setEndContainer] = useState<HTMLDivElement | null>(null)

  const footerApi = useMemo(
    () => ({
      endContainer
    }),
    [endContainer]
  )

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
    <MetadataEditFooterProvider value={footerApi}>
      <SectionedModalBody
        sections={sections}
        selectedSection={selectedSection}
        onSectionChange={onSectionChange}
        onRequestHubBack={onRequestHubBack}
        isOpen={isOpen}
        initialSection={bodyInitialSection}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
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
              <CoverEditModalBody stableBodyHeight={false} fillParent onClose={onClose} />
            ) : selectedSection === 'chapters' ? (
              <ChaptersEditModalBody closeRequestRef={chaptersCloseRef} onPendingChange={onChaptersPendingChange} />
            ) : (
              <MatchModalBody fillParent onClose={onClose} />
            )}
          </div>
          <ModalFooter start={<EmbedMetadataFooterControl libraryItem={resolvedItem} onClose={onClose} />} endSlotRef={setEndContainer} />
        </div>
      </SectionedModalBody>
    </MetadataEditFooterProvider>
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
      requestChaptersLeaveOrProceed(chaptersCloseRef.current, () => setSelectedSection(next))
    },
    [selectedSection]
  )

  const handleHubBack = useCallback((proceed: () => void) => {
    requestChaptersLeaveOrProceed(chaptersCloseRef.current, proceed)
  }, [])

  const handleClose = useCallback(() => {
    requestChaptersLeaveOrProceed(chaptersCloseRef.current, onClose)
  }, [onClose])

  const mobileInitialSection = initialSection === 'details' ? undefined : initialSection

  return (
    <LibraryItemModal
      isOpen={isOpen}
      onClose={handleClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem })}
      additionalProcessing={isSavePending || filterDataLoading || isChaptersPending}
      className="md:max-w-[min(95vw,60rem)]"
      onBeforeNavigate={(proceed) => requestChaptersLeaveOrProceed(chaptersCloseRef.current, proceed)}
    >
      <LibraryItemMetadataEditModalBody
        isOpen={isOpen}
        onClose={handleClose}
        initialSection={mobileInitialSection}
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
