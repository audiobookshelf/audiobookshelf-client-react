'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import CoverPreviewModal from '@/components/modals/CoverPreviewModal'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useCallback, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

interface PreviewCoverExamplesProps {
  selectedBook?: BookLibraryItem | null
  selectedPodcast?: PodcastLibraryItem | null
}

export function PreviewCoverExamples({ selectedBook, selectedPodcast }: PreviewCoverExamplesProps) {
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [modalCoverSrc, setModalCoverSrc] = useState('')

  // Determine which item to use for examples (prefer book over podcast)
  const exampleItem = selectedBook || selectedPodcast

  const handleCoverClick = useCallback((src: string) => {
    setModalCoverSrc(src)
    setIsCoverModalOpen(true)
  }, [])

  const handleApply = useCallback(() => {
    // Here you would typically apply the cover selection
    setIsCoverModalOpen(false)
  }, [])

  const handleCancel = useCallback(() => {
    setIsCoverModalOpen(false)
  }, [])

  // Don't render if no library item is selected
  if (!selectedBook && !selectedPodcast) {
    return null
  }

  return (
    <ComponentExamples title="Preview Cover">
      <ComponentInfo
        component="PreviewCover"
        description="A cover image preview component with aspect ratio handling, error states, and optional 'open in new tab' functionality."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import PreviewCover from &apos;@/components/covers/PreviewCover&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-inside list-disc">
            <li>
              <Code>src</Code>: Image source URL (required)
            </li>
            <li>
              <Code>width</Code>: Width in pixels (default: 120)
            </li>
            <li>
              <Code>bookCoverAspectRatio</Code>: Optional override; defaults from <Code>LibraryProvider</Code> via <Code>useBookCoverAspectRatio</Code>
            </li>
            <li>
              <Code>auto</Code>: Enable auto-sizing based on container constraints (default: false)
            </li>
            <li>
              <Code>showResolution</Code>: Display image resolution below cover (default: true)
            </li>
          </ul>
        </div>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Standard Cover">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)} />
            <p className="text-xs text-gray-400">120px width</p>
          </div>
        </Example>

        <Example title="Large Cover">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)} width={200} />
            <p className="text-xs text-gray-400">200px width</p>
          </div>
        </Example>

        <Example title="Small square Cover">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)} width={80} bookCoverAspectRatio={1.0} />
            <p className="text-xs text-gray-400">80px width</p>
          </div>
        </Example>

        <Example title="Standard Square Cover">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)} bookCoverAspectRatio={1.0} />
            <p className="text-xs text-gray-400">1:1 aspect ratio</p>
          </div>
        </Example>

        <Example title="Square Cover with non-square image">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)} width={120} bookCoverAspectRatio={1.0} />
            <p className="text-xs text-gray-400">1.6 aspect ratio </p>
          </div>
        </Example>

        <Example title="Square Cover without resolution">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)} bookCoverAspectRatio={1.0} showResolution={false} />
            <p className="text-xs text-gray-400">1:1 aspect ratio, no resolution</p>
          </div>
        </Example>

        <Example title="Square Cover with click handler">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover
              src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)}
              bookCoverAspectRatio={1.0}
              onClick={() => handleCoverClick(getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt))}
            />
            <p className="text-xs text-gray-400">1:1 aspect ratio, click to open modal</p>
          </div>
        </Example>

        <Example title="Non-square Cover with click handler">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover
              src={getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt)}
              bookCoverAspectRatio={1.6}
              onClick={() => handleCoverClick(getLibraryItemCoverUrl(exampleItem!.id, exampleItem!.updatedAt))}
            />
            <p className="text-xs text-gray-400">1.6 aspect ratio, click to open modal</p>
          </div>
        </Example>

        <Example title="Invalid Cover Error State">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/images/book_placeholder.jpg" width={120} forceErrorState={true} />
            <p className="text-xs text-gray-400">Shows error state when image fails to load</p>
          </div>
        </Example>
      </ExamplesBlock>

      {/* Cover Preview Modal */}
      <CoverPreviewModal isOpen={isCoverModalOpen} selectedCover={modalCoverSrc} onClose={handleCancel} onApply={handleApply} />
    </ComponentExamples>
  )
}
