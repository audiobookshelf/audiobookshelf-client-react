'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function PreviewCoverExamples() {
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [modalCoverSrc, setModalCoverSrc] = useState('')
  const [modalCoverAspectRatio, setModalCoverAspectRatio] = useState(1.0)

  const handleCoverClick = useCallback((src: string, aspectRatio: number) => {
    setModalCoverSrc(src)
    setModalCoverAspectRatio(aspectRatio)
    setIsCoverModalOpen(true)
  }, [])

  const handleApply = useCallback(() => {
    // Here you would typically apply the cover selection
    setIsCoverModalOpen(false)
  }, [])

  const handleCancel = useCallback(() => {
    setIsCoverModalOpen(false)
  }, [])

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
          <ul className="list-disc list-inside">
            <li>
              <Code>src</Code>: Image source URL (required)
            </li>
            <li>
              <Code>width</Code>: Width in pixels (default: 120)
            </li>
            <li>
              <Code>bookCoverAspectRatio</Code>: Aspect ratio for the cover (required)
            </li>
            <li>
              <Code>showOpenNewTab</Code>: Show open in new tab button on hover/touch (default: false)
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
            <PreviewCover src="/examples/ltr.1.6.png" bookCoverAspectRatio={1.6} />
            <p className="text-xs text-gray-400">120px width</p>
          </div>
        </Example>

        <Example title="Large Cover">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/examples/ltr.1.6.png" width={200} bookCoverAspectRatio={1.6} />
            <p className="text-xs text-gray-400">200px width</p>
          </div>
        </Example>

        <Example title="Small square Cover">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/examples/ltr.1.0.png" width={80} bookCoverAspectRatio={1.0} />
            <p className="text-xs text-gray-400">80px width</p>
          </div>
        </Example>

        <Example title="Standard Square Cover">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/examples/ltr.1.0.png" bookCoverAspectRatio={1.0} />
            <p className="text-xs text-gray-400">1:1 aspect ratio</p>
          </div>
        </Example>

        <Example title="Square Cover with non-square image">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/examples/ltr.1.6.png" width={120} bookCoverAspectRatio={1.0} />
            <p className="text-xs text-gray-400">1.6 aspect ratio </p>
          </div>
        </Example>

        <Example title="Square Cover without resolution">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/examples/ltr.1.0.png" bookCoverAspectRatio={1.0} showResolution={false} />
            <p className="text-xs text-gray-400">1:1 aspect ratio, no resolution</p>
          </div>
        </Example>

        <Example title="Square Cover with click handler">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/examples/ltr.1.0.png" bookCoverAspectRatio={1.0} onClick={() => handleCoverClick('/examples/ltr.1.0.png', 1.0)} />
            <p className="text-xs text-gray-400">1:1 aspect ratio, click to open modal</p>
          </div>
        </Example>

        <Example title="Invalid Cover Error State">
          <div className="flex flex-col items-center gap-4">
            <PreviewCover src="/book_placeholder.jpg" width={120} bookCoverAspectRatio={1.6} forceErrorState={true} />
            <p className="text-xs text-gray-400">Shows error state when image fails to load</p>
          </div>
        </Example>
      </ExamplesBlock>

      {/* Cover Preview Modal */}
      <Modal isOpen={isCoverModalOpen} onClose={handleCancel} contentMarginTop={20}>
        <div className="flex flex-col h-full bg-gray-800 rounded-lg p-6">
          {/* Modal Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Cover Preview</h3>
            <p className="text-gray-400 text-sm">Preview the cover at full size</p>
          </div>

          {/* Cover Display Area */}
          <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg p-8 mb-6 overflow-hidden">
            <div className="max-w-full max-h-full flex items-center justify-center">
              <Image
                src={modalCoverSrc}
                alt="Cover preview"
                width={800}
                height={Math.round(800 / modalCoverAspectRatio)}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                style={{
                  aspectRatio: modalCoverAspectRatio,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                priority
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Btn color="bg-gray-600 hover:bg-gray-700" onClick={handleCancel}>
              Cancel
            </Btn>
            <Btn color="bg-primary hover:bg-primary-dark" onClick={handleApply}>
              Apply
            </Btn>
          </div>
        </div>
      </Modal>
    </ComponentExamples>
  )
}
