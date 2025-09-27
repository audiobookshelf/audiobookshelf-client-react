'use client'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

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
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import Modal from &apos;@/components/modals/Modal&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">isOpen</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onClose</code>, <code className="bg-gray-700 px-2 py-1 rounded">children</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">width</code>, <code className="bg-gray-700 px-2 py-1 rounded">height</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">persistent</code>, <code className="bg-gray-700 px-2 py-1 rounded">processing</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">zIndexClass</code>, <code className="bg-gray-700 px-2 py-1 rounded">bgOpacityClass</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">contentMarginTop</code>, <code className="bg-gray-700 px-2 py-1 rounded">outerContent</code>
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: portal rendering, smooth animations, focus management, keyboard navigation (Escape), backdrop click to close, processing overlay, persistent
          mode, customizable dimensions and styling
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Basic Modal">
          <div>
            <p className="text-gray-400 text-sm mb-4">A simple modal with default settings and close functionality.</p>
            <Btn onClick={() => setIsBasicModalOpen(true)}>Open Basic Modal</Btn>

            <Modal isOpen={isBasicModalOpen} onClose={() => setIsBasicModalOpen(false)}>
              <div className="bg-gray-800 rounded-lg p-6 max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">Basic Modal Example</h3>
                <p className="text-gray-300 mb-6">
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
            <p className="text-gray-400 text-sm mb-4">A modal with a processing overlay that prevents interaction during operations.</p>
            <Btn onClick={() => setIsProcessingModalOpen(true)}>Open Processing Modal</Btn>

            <Modal isOpen={isProcessingModalOpen} onClose={() => setIsProcessingModalOpen(false)} processing={isProcessing} width={500} height={300}>
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Processing Example</h3>
                <p className="text-gray-300 mb-6 flex-1">
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
            <p className="text-gray-400 text-sm mb-4">A modal that cannot be closed by clicking outside or pressing Escape.</p>
            <Btn onClick={() => setIsPersistentModalOpen(true)}>Open Persistent Modal</Btn>

            <Modal
              isOpen={isPersistentModalOpen}
              onClose={() => setIsPersistentModalOpen(false)}
              persistent={true}
              width={450}
              height={250}
              bgOpacityClass="bg-primary/90"
            >
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Persistent Modal</h3>
                <p className="text-gray-300 mb-6 flex-1">
                  This modal is persistent - you can only close it by clicking the &quot;Close&quot; button. Background clicks and Escape key are disabled.
                </p>
                <div className="flex justify-center">
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
            <p className="text-gray-400 text-sm mb-4">A modal with custom dimensions and Tailwind z-index/opacity classes.</p>
            <Btn onClick={() => setIsCustomModalOpen(true)}>Open Custom Modal</Btn>

            <Modal
              isOpen={isCustomModalOpen}
              onClose={() => setIsCustomModalOpen(false)}
              width={800}
              height={600}
              zIndexClass="z-[100]"
              bgOpacityClass="bg-primary/50"
              contentMarginTop={20}
            >
              <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-8 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-6">Custom Styled Modal</h3>
                <div className="flex-1 space-y-4">
                  <p className="text-blue-100">This modal demonstrates custom styling options:</p>
                  <ul className="list-disc list-inside text-blue-100 space-y-2">
                    <li>Custom width (800px) and height (600px)</li>
                    <li>Higher z-index (z-[100]) using Tailwind classes</li>
                    <li>Lower background opacity (bg-primary/50) using Tailwind classes</li>
                    <li>Custom margin top (20px)</li>
                    <li>Gradient background styling</li>
                  </ul>
                  <div className="bg-blue-800/30 rounded p-4 mt-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Modal Features</h4>
                    <p className="text-blue-100 text-sm">
                      The Modal component supports focus management, keyboard navigation, smooth animations, and portal rendering for proper z-index handling.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-blue-700">
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
            <p className="text-gray-400 text-sm mb-4">A modal that can display content outside the main modal area.</p>
            <Btn onClick={() => setIsOuterContentModalOpen(true)}>Open with Outer Content</Btn>

            <Modal
              isOpen={isOuterContentModalOpen}
              onClose={() => setIsOuterContentModalOpen(false)}
              width={400}
              height={300}
              outerContent={<div className="absolute top-10 start-10 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-semibold">Outer Content!</div>}
            >
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Modal with Outer Content</h3>
                <p className="text-gray-300 mb-6 flex-1">
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
            <p className="text-gray-400 text-sm mb-4">A modal that adapts to different screen sizes using string dimensions.</p>
            <Btn onClick={() => setIsResponsiveModalOpen(true)}>Open Responsive Modal</Btn>

            <Modal isOpen={isResponsiveModalOpen} onClose={() => setIsResponsiveModalOpen(false)} width="90vw" height="80vh">
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Responsive Modal</h3>
                <div className="flex-1 space-y-4">
                  <p className="text-gray-300">This modal uses viewport units for its dimensions:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Width: 90vw (90% of viewport width)</li>
                    <li>Height: 80vh (80% of viewport height)</li>
                    <li>Automatically adapts to screen size</li>
                    <li>Perfect for mobile devices</li>
                  </ul>
                  <div className="bg-gray-700 rounded p-4">
                    <p className="text-sm text-gray-300">Try resizing your browser window to see how the modal adapts to different screen sizes.</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-border">
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
