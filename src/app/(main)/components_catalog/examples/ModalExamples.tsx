'use client'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// Modal Examples

export function ModalExamples() {
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false)
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [isPersistentModalOpen, setIsPersistentModalOpen] = useState(false)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [isOuterContentModalOpen, setIsOuterContentModalOpen] = useState(false)
  const [isResponsiveModalOpen, setIsResponsiveModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useGlobalToast()

  const handleProcessingDemo = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      showToast('Processing completed!', { type: 'success', title: 'Processing Demo' })
    }, 3000)
  }

  return (
    <ComponentExamples title="Modals">
      <ComponentInfo component="Modal" description="Modal dialog component with backdrop, animations, and various customization options">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Modal from &apos;@/components/modals/Modal&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>isOpen</Code>, <Code>onClose</Code>, <Code>children</Code>, <Code>persistent</Code>,{' '}
          <Code>processing</Code>, <Code>zIndexClass</Code>, <Code>bgOpacityClass</Code>, <Code>outerContent</Code>, <Code>className</Code>
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: portal rendering, smooth animations, focus management, keyboard navigation (Escape), backdrop click to close, processing overlay, persistent
          mode, customizable styling via className
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Basic Modal">
          <div>
            <p className="mb-4 text-sm text-gray-400">A simple modal with default settings and close functionality.</p>
            <Btn onClick={() => setIsBasicModalOpen(true)}>Open Basic Modal</Btn>

            <Modal isOpen={isBasicModalOpen} onClose={() => setIsBasicModalOpen(false)} className="w-[500px]">
              <div className="p-6">
                <h3 className="mb-4 text-xl font-semibold text-white">Basic Modal Example</h3>
                <p className="mb-6 text-gray-300">
                  This is a basic modal dialog. You can close it by clicking the close button, pressing Escape, or clicking outside the modal content.
                </p>
                <div className="flex justify-end gap-3">
                  <Btn onClick={() => setIsBasicModalOpen(false)} color="bg-gray-600">
                    Close
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </Example>

        <Example title="Processing Modal">
          <div>
            <p className="mb-4 text-sm text-gray-400">A modal with a processing overlay that prevents interaction during operations.</p>
            <Btn onClick={() => setIsProcessingModalOpen(true)}>Open Processing Modal</Btn>

            <Modal isOpen={isProcessingModalOpen} onClose={() => setIsProcessingModalOpen(false)} processing={isProcessing} className="h-[300px] w-[500px]">
              <div className="flex h-full flex-col p-6">
                <h3 className="mb-4 text-xl font-semibold text-white">Processing Example</h3>
                <p className="mb-6 flex-1 text-gray-300">
                  Click the &quot;Start Processing&quot; button to see the processing overlay in action. The modal will be disabled during processing.
                </p>
                <div className="flex justify-end gap-3">
                  <Btn onClick={() => setIsProcessingModalOpen(false)} color="bg-gray-600">
                    Cancel
                  </Btn>
                  <Btn onClick={handleProcessingDemo} color="bg-blue-600" disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Start Processing'}
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </Example>

        <Example title="Persistent Modal">
          <div>
            <p className="mb-4 text-sm text-gray-400">A modal that cannot be closed by clicking outside or pressing Escape.</p>
            <Btn onClick={() => setIsPersistentModalOpen(true)}>Open Persistent Modal</Btn>

            <Modal
              isOpen={isPersistentModalOpen}
              onClose={() => setIsPersistentModalOpen(false)}
              persistent={true}
              bgOpacityClass="bg-primary/90"
              className="h-[250px] w-[500px]"
            >
              <div className="flex h-full flex-col p-6">
                <h3 className="mb-4 text-xl font-semibold text-white">Persistent Modal</h3>
                <p className="mb-6 flex-1 text-gray-300">
                  This modal is persistent - you can only close it by clicking the &quot;Close&quot; button. Background clicks and Escape key are disabled.
                </p>
                <div className="flex justify-end">
                  <Btn onClick={() => setIsPersistentModalOpen(false)} color="bg-red-600">
                    Close Modal
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </Example>

        <Example title="Custom Styled Modal">
          <div>
            <p className="mb-4 text-sm text-gray-400">A modal with custom dimensions and Tailwind z-index/opacity classes.</p>
            <Btn onClick={() => setIsCustomModalOpen(true)}>Open Custom Modal</Btn>

            <Modal
              isOpen={isCustomModalOpen}
              onClose={() => setIsCustomModalOpen(false)}
              zIndexClass="z-[100]"
              bgOpacityClass="bg-primary/50"
              className="mt-[20px]"
            >
              <div className="flex h-full flex-col rounded-lg bg-gradient-to-br from-blue-900 to-purple-900 p-8">
                <h3 className="mb-6 text-2xl font-bold text-white">Custom Styled Modal</h3>
                <div className="flex-1 space-y-4">
                  <p className="text-blue-100">This modal demonstrates custom styling options:</p>
                  <ul className="list-inside list-disc space-y-2 text-blue-100">
                    <li>Custom width, height, and margin via className</li>
                    <li>Higher z-index (z-[100]) using Tailwind classes</li>
                    <li>Lower background opacity (bg-primary/50) using Tailwind classes</li>
                    <li>Custom margin top (20px) via className</li>
                    <li>Gradient background styling</li>
                  </ul>
                  <div className="mt-4 rounded bg-blue-800/30 p-4">
                    <h4 className="mb-2 text-lg font-semibold text-white">Modal Features</h4>
                    <p className="text-sm text-blue-100">
                      The Modal component supports focus management, keyboard navigation, smooth animations, and portal rendering for proper z-index handling.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-blue-700 pt-6">
                  <Btn onClick={() => setIsCustomModalOpen(false)} color="bg-blue-600">
                    Close Custom Modal
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </Example>

        <Example title="Modal with Outer Content">
          <div>
            <p className="mb-4 text-sm text-gray-400">A modal that can display content outside the main modal area.</p>
            <Btn onClick={() => setIsOuterContentModalOpen(true)}>Open with Outer Content</Btn>

            <Modal
              isOpen={isOuterContentModalOpen}
              onClose={() => setIsOuterContentModalOpen(false)}
              outerContent={<div className="absolute start-10 top-10 rounded bg-yellow-500 px-3 py-1 text-sm font-semibold text-black">Outer Content!</div>}
              className="w-[500px]"
            >
              <div className="flex h-full flex-col p-6">
                <h3 className="mb-4 text-xl font-semibold text-white">Modal with Outer Content</h3>
                <p className="mb-6 flex-1 text-gray-300">
                  This modal has additional content rendered outside the main modal container. Check the yellow badge in the top-left corner.
                </p>
                <div className="flex justify-end">
                  <Btn onClick={() => setIsOuterContentModalOpen(false)} color="bg-gray-600">
                    Close
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </Example>

        <Example title="Responsive Modal">
          <div>
            <p className="mb-4 text-sm text-gray-400">A modal that adapts to different screen sizes using string dimensions.</p>
            <Btn onClick={() => setIsResponsiveModalOpen(true)}>Open Responsive Modal</Btn>

            <Modal isOpen={isResponsiveModalOpen} onClose={() => setIsResponsiveModalOpen(false)} className="h-[80vh] w-[90vw]">
              <div className="flex h-full flex-col p-6">
                <h3 className="mb-4 text-xl font-semibold text-white">Responsive Modal</h3>
                <div className="flex-1 space-y-4">
                  <p className="text-gray-300">This modal uses viewport units for its dimensions:</p>
                  <ul className="list-inside list-disc space-y-2 text-gray-300">
                    <li>Width: 90vw (90% of viewport width)</li>
                    <li>Height: 80vh (80% of viewport height)</li>
                    <li>Automatically adapts to screen size</li>
                    <li>Perfect for mobile devices</li>
                  </ul>
                  <div className="rounded bg-gray-700 p-4">
                    <p className="text-sm text-gray-300">Try resizing your browser window to see how the modal adapts to different screen sizes.</p>
                  </div>
                </div>
                <div className="border-border flex justify-end border-t pt-4">
                  <Btn onClick={() => setIsResponsiveModalOpen(false)} color="bg-gray-600">
                    Close
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
