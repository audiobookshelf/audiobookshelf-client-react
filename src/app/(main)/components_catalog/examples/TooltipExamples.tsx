'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function TooltipExamples() {
  const [isTooltipModalOpen, setIsTooltipModalOpen] = useState(false)

  return (
    <ComponentExamples title="Tooltips">
      <ComponentInfo component="Tooltip" description="Tooltip component with various positions and hover/focus interactions">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Tooltip from &apos;@/components/ui/Tooltip&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>text</Code>, <Code>children</Code>, <Code>position</Code>, <Code>usePortal</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> If <Code>usePortal</Code> is true, or the tooltip is inside a modal, the tooltip will be rendered in a
          portal.
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Basic">
          <div className="space-y-4">
            <Tooltip text="This is a basic tooltip">
              <Btn>Hover me</Btn>
            </Tooltip>
          </div>
        </Example>

        <Example title="Different Positions">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Tooltip text="Left position" position="left">
                <Btn>Left</Btn>
              </Tooltip>
              <Tooltip text="Top position" position="top">
                <Btn>Top</Btn>
              </Tooltip>
              <Tooltip text="Bottom position" position="bottom">
                <Btn>Bottom</Btn>
              </Tooltip>
            </div>
          </div>
        </Example>

        <Example title="With Icon Button">
          <div className="space-y-4">
            <Tooltip text="Settings">
              <IconBtn size="medium">settings</IconBtn>
            </Tooltip>
          </div>
        </Example>

        <Example title="With Text Input">
          <div className="space-y-4">
            <Tooltip text="Enter your username">
              <TextInput value="John Doe" />
            </Tooltip>
          </div>
        </Example>

        <Example title="Long Text with maxWidth">
          <div className="space-y-4">
            <Tooltip text="This is a very long tooltip text that demonstrates how the tooltip handles longer content" position="bottom" maxWidth={200}>
              <Btn>Long tooltip</Btn>
            </Tooltip>
          </div>
        </Example>

        <Example title="Portal Tooltips">
          <div className="space-y-4">
            <div className="p-4 border border-gray-600 rounded-md overflow-hidden">
              <p className="text-sm text-gray-400 mb-2">This container has overflow: hidden</p>
              <Tooltip text="This tooltip uses a portal and won't be clipped by the container" position="bottom" usePortal>
                <Btn>Portal tooltip</Btn>
              </Tooltip>
            </div>
          </div>
        </Example>

        <Example title="Tooltip inside a modal">
          <div className="space-y-4">
            <Btn onClick={() => setIsTooltipModalOpen(true)}>Open modal</Btn>
            <Modal isOpen={isTooltipModalOpen} onClose={() => setIsTooltipModalOpen(false)} className="w-[200px]">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Tooltip inside a modal</h3>
                <Tooltip text="This is a tooltip inside a modal" position="bottom" className="w-fit">
                  <Btn>Tooltip</Btn>
                </Tooltip>
              </div>
            </Modal>
          </div>
        </Example>

        <Example title="Tooltip with non-element children">
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-2">Not recommended due to accessibility issues</p>
            <Tooltip text="This is a tooltip with non-element children">Tooltip</Tooltip>
          </div>
        </Example>

        <Example title="Tooltip with array of elements as children">
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-2">Not recommended due to accessibility issues</p>
            <Tooltip text="This is a tooltip with array of elements as children" position="bottom" usePortal>
              <Btn>Tooltip</Btn>
              <Btn>Tooltip</Btn>
            </Tooltip>
          </div>
        </Example>

        <Example title="Bottom Edge">
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-2">Slowly scroll to make this button appear on the bottom edge of the screen</p>
            <Tooltip text="bottom tooltip" position="bottom">
              <Btn>Bottom</Btn>
            </Tooltip>
          </div>
        </Example>

        <Example title="Right Edge" className="col-span-1 md:col-span-2 lg:col-span-2">
          <div className="space-y-4 flex flex-col items-end">
            <p className="text-sm text-gray-400 mb-2">Resize to make this button appear close to the right edge of the screen</p>
            <Tooltip text="Very long tooltip text that should be shifted to the left" position="bottom">
              <Btn>Right</Btn>
            </Tooltip>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
