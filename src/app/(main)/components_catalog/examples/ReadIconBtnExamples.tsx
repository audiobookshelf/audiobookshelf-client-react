'use client'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// ReadIconBtn Examples
export function ReadIconBtnExamples() {
  const [isRead1, setIsRead1] = useState(false)
  const [isRead2, setIsRead2] = useState(true)
  const [isRead3, setIsRead3] = useState(false)
  const [isRead4, setIsRead4] = useState(true)

  const { showToast } = useGlobalToast()

  const handleReadToggle = (isRead: boolean, setRead: (value: boolean) => void) => {
    setRead(!isRead)
    showToast(!isRead ? 'Marked as finished' : 'Marked as not finished', { type: 'success', title: 'Read Status Updated' })
  }

  return (
    <ComponentExamples title="Read Icon Buttons">
      <ComponentInfo component="ReadIconBtn" description="Read status toggle button using IconBtn with BeenHere icon and visual state indication">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import ReadIconBtn from &apos;@/components/ui/ReadIconBtn&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>isRead</Code>, <Code>disabled</Code>, <Code>borderless</Code>, <Code>onClick</Code>,{' '}
          <Code>className</Code>
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: uses IconBtn with e52d (BeenHere) icon, visual distinction between read/unread states with color coding, proper ARIA labels, event handling
          with stopPropagation, and all IconBtn features (disabled, borderless, etc.)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Button (Unread)">
          <div className="flex items-center gap-4">
            <ReadIconBtn isRead={isRead1} onClick={() => handleReadToggle(isRead1, setIsRead1)} />
            <span className="text-sm text-gray-400">Click to toggle read status</span>
          </div>
        </Example>

        <Example title="Default Button (Read)">
          <div className="flex items-center gap-4">
            <ReadIconBtn isRead={isRead2} onClick={() => handleReadToggle(isRead2, setIsRead2)} />
            <span className="text-sm text-gray-400">Click to toggle read status</span>
          </div>
        </Example>

        <Example title="Borderless Button (Unread)">
          <div className="flex items-center gap-4">
            <ReadIconBtn isRead={isRead3} borderless onClick={() => handleReadToggle(isRead3, setIsRead3)} />
            <span className="text-sm text-gray-400">Borderless style</span>
          </div>
        </Example>

        <Example title="Disabled Button (Read)">
          <div className="flex items-center gap-4">
            <ReadIconBtn isRead={true} disabled />
            <span className="text-sm text-gray-400">Disabled state</span>
          </div>
        </Example>

        <Example title="Borderless Disabled Button (Unread)">
          <div className="flex items-center gap-4">
            <ReadIconBtn isRead={false} borderless disabled />
            <span className="text-sm text-gray-400">Borderless disabled</span>
          </div>
        </Example>

        <Example title="Custom Styled Button (Read)">
          <div className="flex items-center gap-4">
            <ReadIconBtn isRead={isRead4} onClick={() => handleReadToggle(isRead4, setIsRead4)} className="bg-blue-600 hover:bg-blue-700" />
            <span className="text-sm text-gray-400">Custom background color</span>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
