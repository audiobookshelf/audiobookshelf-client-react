'use client'

import Btn from '@/components/ui/Btn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useCallback, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function ConfirmDialogExamples() {
  const [basicDialogOpen, setBasicDialogOpen] = useState(false)
  const [withCheckboxOpen, setWithCheckboxOpen] = useState(false)
  const [customButtonTextOpen, setCustomButtonTextOpen] = useState(false)
  const [destructiveOpen, setDestructiveOpen] = useState(false)
  const [longMessageOpen, setLongMessageOpen] = useState(false)
  const [combinedDialogOpen, setCombinedDialogOpen] = useState(false)

  const handleBasicConfirm = useCallback(() => {
    setBasicDialogOpen(false)
    console.log('Basic dialog confirmed')
  }, [])

  const handleCheckboxConfirm = useCallback((checkboxValue?: boolean) => {
    setWithCheckboxOpen(false)
    console.log('Checkbox confirmed:', checkboxValue)
  }, [])

  const handleCustomButtonConfirm = useCallback(() => {
    setCustomButtonTextOpen(false)
    console.log('Custom button dialog confirmed')
  }, [])

  const handleDestructiveConfirm = useCallback(() => {
    setDestructiveOpen(false)
    console.log('Destructive action confirmed')
  }, [])

  const handleLongMessageConfirm = useCallback(() => {
    setLongMessageOpen(false)
    console.log('Long message dialog confirmed')
  }, [])

  const handleCombinedConfirm = useCallback((checkboxValue?: boolean) => {
    setCombinedDialogOpen(false)
    console.log('Combined dialog confirmed:', checkboxValue)
  }, [])

  return (
    <ComponentExamples title="Confirm Dialog">
      <ComponentInfo
        component="ConfirmDialog"
        description="Reusable confirmation dialog component for confirming destructive or important actions. Optionally includes a checkbox for 'don't ask again' or similar functionality."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import ConfirmDialog from &apos;@/components/widgets/ConfirmDialog&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>isOpen</Code> (required: boolean), <Code>message</Code> (required: string), <Code>checkboxLabel</Code>{' '}
          (optional: string), <Code>yesButtonText</Code> (optional: string), <Code>yesButtonClassName</Code> (optional: string, defaults to
          &apos;bg-success&apos;), <Code>onClose</Code> (required: function), <Code>onConfirm</Code> (required: function that accepts optional boolean for
          checkbox value), <Code>className</Code> (optional: string)
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: Built on top of Modal component, includes Cancel and Confirm buttons, optional checkbox for persistent choices, customizable button text and
          styling
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Basic Confirm Dialog">
          <div>
            <p className="text-gray-400 text-sm mb-4">A simple confirmation dialog with default styling.</p>
            <Btn onClick={() => setBasicDialogOpen(true)}>Open Basic Confirm Dialog</Btn>

            <ConfirmDialog
              isOpen={basicDialogOpen}
              message="Are you sure you want to proceed with this action?"
              onClose={() => setBasicDialogOpen(false)}
              onConfirm={handleBasicConfirm}
            />
          </div>
        </Example>

        <Example title="With Checkbox">
          <div>
            <p className="text-gray-400 text-sm mb-4">A confirmation dialog with an optional checkbox for &quot;don&apos;t ask again&quot; functionality.</p>
            <Btn onClick={() => setWithCheckboxOpen(true)}>Open Dialog with Checkbox</Btn>

            <ConfirmDialog
              isOpen={withCheckboxOpen}
              message="Delete this item permanently?"
              checkboxLabel="Don't ask me again"
              onClose={() => setWithCheckboxOpen(false)}
              onConfirm={handleCheckboxConfirm}
            />
          </div>
        </Example>

        <Example title="Custom Button Text">
          <div>
            <p className="text-gray-400 text-sm mb-4">A confirmation dialog with custom button text.</p>
            <Btn onClick={() => setCustomButtonTextOpen(true)}>Open Custom Button Dialog</Btn>

            <ConfirmDialog
              isOpen={customButtonTextOpen}
              message="Save your changes before closing?"
              yesButtonText="Save & Close"
              onClose={() => setCustomButtonTextOpen(false)}
              onConfirm={handleCustomButtonConfirm}
            />
          </div>
        </Example>

        <Example title="Destructive Action">
          <div>
            <p className="text-gray-400 text-sm mb-4">A confirmation dialog for destructive actions with a warning-style button.</p>
            <Btn onClick={() => setDestructiveOpen(true)}>Open Destructive Dialog</Btn>

            <ConfirmDialog
              isOpen={destructiveOpen}
              message="This action cannot be undone. Are you sure you want to delete this item?"
              yesButtonText="Delete"
              yesButtonClassName="bg-error"
              onClose={() => setDestructiveOpen(false)}
              onConfirm={handleDestructiveConfirm}
            />
          </div>
        </Example>

        <Example title="Long Message">
          <div>
            <p className="text-gray-400 text-sm mb-4">A confirmation dialog with a longer message that demonstrates text wrapping.</p>
            <Btn onClick={() => setLongMessageOpen(true)}>Open Long Message Dialog</Btn>

            <ConfirmDialog
              isOpen={longMessageOpen}
              message="This action will permanently delete all selected items from your library. This includes all associated metadata, cover art, and user progress. This action cannot be undone. Are you absolutely certain you want to proceed?"
              yesButtonText="Yes, Delete Everything"
              yesButtonClassName="bg-error"
              onClose={() => setLongMessageOpen(false)}
              onConfirm={handleLongMessageConfirm}
            />
          </div>
        </Example>

        <Example title="With Checkbox and Custom Button">
          <div>
            <p className="text-gray-400 text-sm mb-4">A confirmation dialog combining checkbox and custom button styling.</p>
            <Btn onClick={() => setCombinedDialogOpen(true)}>Open Combined Dialog</Btn>

            <ConfirmDialog
              isOpen={combinedDialogOpen}
              message="Remove this item from your library?"
              checkboxLabel="Also remove from device"
              yesButtonText="Remove"
              yesButtonClassName="bg-warning"
              onClose={() => setCombinedDialogOpen(false)}
              onConfirm={handleCombinedConfirm}
            />
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
