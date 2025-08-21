'use client'

import { ReactNode } from 'react'
import { useState } from 'react'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import type { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import Dropdown from '@/components/ui/Dropdown'
import type { DropdownItem } from '@/components/ui/Dropdown'
import FileInput from '@/components/ui/FileInput'
import IconBtn from '@/components/ui/IconBtn'
import InputDropdown from '@/components/ui/InputDropdown'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import LibraryIcon from '@/components/ui/LibraryIcon'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import MediaIconPicker from '@/components/ui/MediaIconPicker'
import Modal from '@/components/modals/Modal'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'
import RangeInput from '@/components/ui/RangeInput'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import TwoStageMultiSelect, { TwoStageMultiSelectContent } from '@/components/ui/TwoStageMultiSelect'
import DurationPicker from '@/components/ui/DurationPicker'
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup'
import { useGlobalToast } from '@/contexts/ToastContext'
import { mergeClasses } from '@/lib/merge-classes'

interface ComponentExamplesProps {
  title: string
  component?: string
  description?: string
  children: ReactNode
}

function ComponentExamples({ title, children }: ComponentExamplesProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-gray-400">{title}</h2>
      {children}
    </section>
  )
}

interface ComponentInfoProps {
  component?: string
  description?: string
  children?: React.ReactNode
}

function ComponentInfo({ component, description, children }: ComponentInfoProps) {
  if (!component && !description) return null
  return (
    <div className="w-full mb-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <p className="mb-2">
          {component && (
            <>
              <span className="font-bold">Component:</span>
              <code className="bg-gray-700 rounded py-1 px-2">{component}</code>
              <span> - </span>
            </>
          )}
          {description && <span>{description}</span>}
        </p>
        {children}
      </div>
    </div>
  )
}

interface ExampleProps {
  title: string
  children: ReactNode
  className?: string
}

function Example({ title, children, className }: ExampleProps) {
  return (
    <div className={mergeClasses('bg-bg p-6 rounded-lg border border-gray-600', className)}>
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      {children}
    </div>
  )
}

function ExamplesBlock({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
}

// Button Examples
export function BtnExamples() {
  const { showToast } = useGlobalToast()

  return (
    <ComponentExamples title="Buttons">
      <ComponentInfo component="Btn" description="Button component with various states (loading, disabled, small, link)">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import Btn from '@/components/ui/Btn'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">color</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">small</code>, <code className="bg-gray-700 px-2 py-1 rounded">loading</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">to</code> (for navigation)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Button">
          <Btn onClick={() => showToast('Default Button clicked', { type: 'info', title: 'Default Button' })}>Default Button</Btn>
        </Example>

        <Example title="Button with Span Content">
          <Btn onClick={() => showToast('Button with span content clicked', { type: 'info', title: 'Button with span content' })}>
            <span>Inside Span</span>
          </Btn>
        </Example>
        <Example title="Link Button">
          <Btn to="/settings">Go to Settings</Btn>
        </Example>

        <Example title="Small Button">
          <Btn size="small" onClick={() => showToast('Small Button clicked', { type: 'info', title: 'Small Button' })}>
            Small Button
          </Btn>
        </Example>

        <Example title="Disabled Button">
          <Btn disabled>Disabled Button</Btn>
        </Example>

        <Example title="Button with Progress">
          <Btn loading progress="75%">
            Uploading...
          </Btn>
        </Example>

        <Example title="Loading Button">
          <Btn loading>Loading...</Btn>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// Checkbox Examples
export function CheckboxExamples() {
  const [checkboxValue1, setCheckboxValue1] = useState(false)
  const [checkboxValue2, setCheckboxValue2] = useState(true)
  const [checkboxValue3, setCheckboxValue3] = useState(false)
  const [checkboxValue4, setCheckboxValue4] = useState(false)
  const [checkboxValue5, setCheckboxValue5] = useState(false)

  return (
    <ComponentExamples title="Checkboxes">
      <ComponentInfo component="Checkbox" description="Checkbox component with different sizes and states">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import Checkbox from '@/components/ui/Checkbox'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">small</code>, <code className="bg-gray-700 px-2 py-1 rounded">medium</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">partial</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Checkbox">
          <Checkbox value={checkboxValue1} onChange={setCheckboxValue1} label="Accept terms and conditions" className="w-fit" />
        </Example>

        <Example title="Checked Checkbox">
          <Checkbox value={checkboxValue2} onChange={setCheckboxValue2} label="Subscribe to newsletter" className="w-fit" />
        </Example>

        <Example title="Small Checkbox">
          <Checkbox value={checkboxValue3} onChange={setCheckboxValue3} label="Enable notifications" size="small" className="w-fit" />
        </Example>

        <Example title="Large Checkbox">
          <Checkbox value={checkboxValue4} onChange={setCheckboxValue4} label="Large size checkbox" size="large" className="w-fit" />
        </Example>

        <Example title="Disabled Checkbox">
          <Checkbox value={false} label="Disabled checkbox" disabled className="w-fit" />
        </Example>

        <Example title="Disabled Checked Checkbox">
          <Checkbox value={true} label="Disabled checked checkbox" disabled className="w-fit" />
        </Example>

        <Example title="Partial Checkbox">
          <Checkbox value={false} label="Partial state checkbox" partial className="w-fit" />
        </Example>

        <Example title="Unlabeled Checkbox">
          <Checkbox value={checkboxValue5} onChange={setCheckboxValue5} className="w-fit" />
        </Example>

        <Example title="Unlabeled Disabled Checkbox">
          <Checkbox value={false} disabled className="w-fit" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// ContextMenuDropdown Examples
export function ContextMenuDropdownExamples() {
  const { showToast } = useGlobalToast()

  // ContextMenuDropdown sample data
  const contextMenuItems: ContextMenuDropdownItem[] = [
    { text: 'Edit', action: 'edit' },
    { text: 'Delete', action: 'delete' },
    {
      text: 'More Options',
      action: 'more',
      subitems: [
        { text: 'Copy', action: 'copy' },
        { text: 'Move', action: 'move' },
        { text: 'Share', action: 'share' }
      ]
    },
    {
      text: 'More Options 2',
      action: 'more2',
      subitems: [
        { text: 'Copy 2', action: 'copy2' },
        { text: 'Move 2', action: 'move2' },
        { text: 'Share 2', action: 'share2' }
      ]
    }
  ]

  const contextMenuItemsWithData: ContextMenuDropdownItem[] = [
    { text: 'Edit Item', action: 'edit' },
    { text: 'Delete Item', action: 'delete' },
    {
      text: 'Advanced',
      action: 'advanced',
      subitems: [
        { text: 'Duplicate', action: 'duplicate', data: { id: 1 } },
        { text: 'Archive', action: 'archive', data: { id: 1 } }
      ]
    }
  ]

  const contextMenuItemsWithEmptySubitems: ContextMenuDropdownItem[] = [
    { text: 'Edit Item', action: 'edit' },
    { text: 'Delete Item', action: 'delete' },
    { text: 'Empty', action: 'empty', subitems: [] }
  ]

  return (
    <ComponentExamples title="Context Menu Dropdowns">
      <ComponentInfo component="ContextMenuDropdown" description="Context menu dropdown with submenus, loading states, and custom triggers">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">items</code> (ContextMenuItem[]),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">processing</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">iconClass</code>, <code className="bg-gray-700 px-2 py-1 rounded">menuWidth</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onAction</code>, <code className="bg-gray-700 px-2 py-1 rounded">children</code> (ReactNode or
          function)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Large Button">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              size="large"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Small Button">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              size="small"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Left Aligned Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              menuAlign="left"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Context Menu with Data">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItemsWithData}
              onAction={(action) =>
                showToast(`Action: ${action.action} ${action.data ? `, Data: ${JSON.stringify(action.data)}` : ''}`, {
                  type: 'info',
                  title: 'Context Menu Action'
                })
              }
            />
            <span className="text-sm text-gray-400">Click to see menu with data</span>
          </div>
        </Example>

        <Example title="Disabled Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              disabled={true}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Disabled state</span>
          </div>
        </Example>

        <Example title="Processing Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              processing={true}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Loading state</span>
          </div>
        </Example>

        <Example title="Custom Icon Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              iconClass="text-blue-400"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Custom icon color</span>
          </div>
        </Example>

        <Example title="Wide Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              menuWidth={250}
              menuAlign="left"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Wider menu</span>
          </div>
        </Example>

        <Example title="Context Menu with Empty Submenu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItemsWithEmptySubitems}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
          </div>
        </Example>

        <Example title="Borderless Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              borderless={true}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Borderless state</span>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// Dropdown Examples
export function DropdownExamples() {
  // Dropdown sample data
  const dropdownItems: DropdownItem[] = [
    { text: 'Option 1', value: 'option1' },
    { text: 'Option 2', value: 'option2' },
    { text: 'Option 3', value: 'option3' },
    { text: 'Option 4', value: 'option4' }
  ]

  const dropdownItemsWithSubtext: DropdownItem[] = [
    { text: 'English', value: 'en', subtext: 'US' },
    { text: 'Spanish', value: 'es', subtext: 'ES' },
    { text: 'French', value: 'fr', subtext: 'FR' },
    { text: 'German', value: 'de', subtext: 'DE' }
  ]

  const [dropdownValue, setDropdownValue] = useState('option1')
  const [dropdownValue2, setDropdownValue2] = useState('en')
  const [dropdownValue3, setDropdownValue3] = useState('option1')

  // Dropdown change handlers
  const handleDropdownChange = (value: string | number) => {
    setDropdownValue(String(value))
  }

  const handleDropdownChange2 = (value: string | number) => {
    setDropdownValue2(String(value))
  }

  const handleDropdownChange3 = (value: string | number) => {
    setDropdownValue3(String(value))
  }

  return (
    <ComponentExamples title="Dropdowns">
      <ComponentInfo component="Dropdown" description="Select dropdown component with labels, subtext, and various states">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import Dropdown from '@/components/ui/Dropdown'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">items</code> (DropdownItem[]),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">small</code>, <code className="bg-gray-700 px-2 py-1 rounded">menuMaxHeight</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Select Option" />
        </Example>

        <Example title="Dropdown with Subtext">
          <Dropdown value={dropdownValue2} onChange={handleDropdownChange2} items={dropdownItemsWithSubtext} label="Language" />
        </Example>

        <Example title="Disabled Dropdown">
          <Dropdown value="option1" items={dropdownItems} label="Disabled Option" disabled />
        </Example>

        <Example title="Large Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Large Option" size="large" />
        </Example>

        <Example title="Small Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Small Option" size="small" />
        </Example>

        <Example title="Custom Menu Height Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Custom Height" menuMaxHeight="100px" />
        </Example>

        <Example title="Unlabeled Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// FileInput Examples
export function FileInputExamples() {
  const { showToast } = useGlobalToast()

  return (
    <ComponentExamples title="File Inputs">
      <ComponentInfo component="FileInput" description="File input component with customizable accept types and responsive design">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import FileInput from '@/components/ui/FileInput'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">accept</code> (file types to accept),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code> (callback with selected file),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">children</code> (ReactNode for button content),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code> (custom CSS classes)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default File Input">
          <FileInput onChange={(file) => showToast(`Selected file: ${file.name}`, { type: 'success', title: 'File Selected' })}>Choose File</FileInput>
        </Example>

        <Example title="Document File Input">
          <FileInput
            accept=".pdf, .doc, .docx, .txt"
            onChange={(file) => showToast(`Selected document: ${file.name}`, { type: 'success', title: 'Document Selected' })}
            ariaLabel="Upload Document"
          >
            Upload Document
          </FileInput>
        </Example>

        <Example title="All Files Input">
          <FileInput
            accept="*"
            onChange={(file) => showToast(`Selected file: ${file.name}`, { type: 'success', title: 'File Selected' })}
            ariaLabel="Upload Any File"
          >
            Choose Any File
          </FileInput>
        </Example>

        <Example title="Custom Styled File Input">
          <FileInput
            accept=".png, .jpg, .jpeg"
            onChange={(file) => showToast(`Selected image: ${file.name}`, { type: 'success', title: 'Image Selected' })}
            className="border-2 border-dashed border-blue-400 rounded-lg bg-blue-50"
            ariaLabel="Upload Image"
          >
            Drop Image Here
          </FileInput>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// IconBtn Examples
export function IconBtnExamples() {
  return (
    <ComponentExamples title="Icon Buttons">
      <ComponentInfo component="IconBtn" description="Icon button component with material symbols, loading states, and customization options">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import IconBtn from '@/components/ui/IconBtn'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">children</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">borderless</code>, <code className="bg-gray-700 px-2 py-1 rounded">loading</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">size</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">iconFontSize</code>, <code className="bg-gray-700 px-2 py-1 rounded">ariaLabel</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default">
          <IconBtn>edit</IconBtn>
        </Example>

        <Example title="Large">
          <IconBtn size="large">edit</IconBtn>
        </Example>

        <Example title="Small">
          <IconBtn size="small">edit</IconBtn>
        </Example>

        <Example title="Filled (not outlined)">
          <IconBtn outlined={false}>edit</IconBtn>
        </Example>

        <Example title="Borderless">
          <IconBtn borderless>settings</IconBtn>
        </Example>

        <Example title="Loading">
          <IconBtn loading>edit</IconBtn>
        </Example>

        <Example title="Disabled">
          <IconBtn disabled>favorite</IconBtn>
        </Example>

        <Example title="Custom Icon Font Size">
          <IconBtn className="text-3xl">edit</IconBtn>
        </Example>

        <Example title="Custom Background Color">
          <IconBtn className="bg-blue-500">close</IconBtn>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

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
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import ReadIconBtn from '@/components/ui/ReadIconBtn'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">isRead</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">borderless</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onClick</code>, <code className="bg-gray-700 px-2 py-1 rounded">className</code>
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

// InputDropdown Examples
export function InputDropdownExamples() {
  const { showToast } = useGlobalToast()

  // InputDropdown sample data
  const inputDropdownItems = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew']
  const [inputDropdownValue, setInputDropdownValue] = useState('')
  const [inputDropdownValue2, setInputDropdownValue2] = useState('')
  const [inputDropdownValue3, setInputDropdownValue3] = useState('')

  // InputDropdown change handlers
  const handleInputDropdownChange = (value: string | number) => {
    setInputDropdownValue(String(value))
  }

  const handleInputDropdownChange2 = (value: string | number) => {
    setInputDropdownValue2(String(value))
  }

  const handleInputDropdownChange3 = (value: string | number) => {
    setInputDropdownValue3(String(value))
  }

  const handleInputDropdownNewItem = (value: string) => {
    showToast(`New item created: ${value}`, { type: 'success', title: 'Item Created' })
  }

  return (
    <ComponentExamples title="Input Dropdowns">
      <ComponentInfo component="InputDropdown" description="Input dropdown component that allows typing and filtering with optional new item creation">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import InputDropdown from '@/components/ui/InputDropdown'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">items</code> (string[] or number[]),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">editable</code>, <code className="bg-gray-700 px-2 py-1 rounded">showAllWhenEmpty</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onNewItem</code>, <code className="bg-gray-700 px-2 py-1 rounded">className</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Input Dropdown">
          <InputDropdown value={inputDropdownValue} onChange={handleInputDropdownChange} items={inputDropdownItems} label="Select Fruit" />
        </Example>

        <Example title="Input Dropdown with New Item Creation">
          <InputDropdown
            value={inputDropdownValue2}
            onChange={handleInputDropdownChange2}
            items={inputDropdownItems}
            label="Add or Select Fruit"
            onNewItem={handleInputDropdownNewItem}
          />
        </Example>

        <Example title="Show All When Empty">
          <InputDropdown
            value={inputDropdownValue3}
            onChange={handleInputDropdownChange3}
            items={inputDropdownItems}
            label="Fruit with Show All"
            showAllWhenEmpty
          />
        </Example>

        <Example title="Disabled Input Dropdown">
          <InputDropdown value="Apple" items={inputDropdownItems} label="Disabled Fruit" disabled />
        </Example>

        <Example title="Input Dropdown without Label">
          <InputDropdown value={inputDropdownValue} onChange={handleInputDropdownChange} items={inputDropdownItems} />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// TextareaInput Examples
export function TextareaInputExamples() {
  const [textValue1, setTextValue1] = useState('These are my notes.')
  const [textValue2, setTextValue2] = useState('Initial content')
  const [textValue3, setTextValue3] = useState('')
  const [textValue4] = useState('Read-only content.\nThis is a long text\nto test the textarea input.')

  return (
    <ComponentExamples title="Textarea Inputs">
      <ComponentInfo component="TextareaInput" description="Accessible textarea input with disabled and focus styles consistent with InputDropdown">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import TextareaInput from '@/components/ui/TextareaInput'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">placeholder</code>, <code className="bg-gray-700 px-2 py-1 rounded">rows</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">readOnly</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code>, <code className="bg-gray-700 px-2 py-1 rounded">id</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Textarea">
          <TextareaInput label="Notes" value={textValue1} onChange={setTextValue1} />
        </Example>

        <Example title="Read-only Textarea">
          <TextareaInput label="Read-only" value={textValue4} readOnly />
        </Example>

        <Example title="Disabled Textarea">
          <TextareaInput label="Disabled" value={'Disabled state. \nThis is a long text\nto test the textarea input.'} disabled />
        </Example>

        <Example title="Textarea with 4 Rows">
          <TextareaInput value={textValue2} onChange={setTextValue2} rows={4} />
        </Example>

        <Example title="Default Textarea with Placeholder">
          <TextareaInput value={textValue3} onChange={setTextValue3} placeholder="Type your text here..." />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// TextInput Examples
export function TextInputExamples() {
  const [textValue1, setTextValue1] = useState('Hello World')
  const [textValue2, setTextValue2] = useState('')
  const [textValue3, setTextValue3] = useState('password123')
  const [textValue4, setTextValue4] = useState('2024-01-15T10:30')
  const [textValue5, setTextValue5] = useState('Copy this text')
  const [textValue6, setTextValue6] = useState('Clear me')
  const [textValue7, setTextValue7] = useState('Centered text')
  const [textValue8, setTextValue8] = useState('42')

  const { showToast } = useGlobalToast()

  const handleClear = () => {
    showToast('Text cleared!', { type: 'info', title: 'Clear Action' })
  }

  return (
    <ComponentExamples title="Text Inputs">
      <ComponentInfo
        component="TextInput"
        description="Accessible text input with password visibility toggle, copy to clipboard, clear button, and various styling options"
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import TextInput from '@/components/ui/TextInput'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">placeholder</code>, <code className="bg-gray-700 px-2 py-1 rounded">type</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">readOnly</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">clearable</code>, <code className="bg-gray-700 px-2 py-1 rounded">showCopy</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">customInputClass</code>, <code className="bg-gray-700 px-2 py-1 rounded">step</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">min</code>, <code className="bg-gray-700 px-2 py-1 rounded">onClear</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onFocus</code>, <code className="bg-gray-700 px-2 py-1 rounded">onBlur</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">id</code>, <code className="bg-gray-700 px-2 py-1 rounded">name</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code>, <code className="bg-gray-700 px-2 py-1 rounded">ref</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Text Input">
          <TextInput label="Name" value={textValue1} onChange={setTextValue1} placeholder="Enter your name" />
        </Example>

        <Example title="Text Input with Label">
          <TextInput label="Email" value={textValue2} onChange={setTextValue2} placeholder="Enter your email" />
        </Example>

        <Example title="Password Input">
          <TextInput label="Password" value={textValue3} onChange={setTextValue3} type="password" placeholder="Enter password" />
        </Example>

        <Example title="Date Time Input">
          <TextInput label="Date & Time" value={textValue4} onChange={setTextValue4} type="datetime-local" />
        </Example>

        <Example title="Number Input">
          <TextInput label="Age" value={textValue8} onChange={setTextValue8} type="number" min="0" step="1" />
        </Example>

        <Example title="Number Input (No Spinner)">
          <TextInput label="Age" value={textValue8} onChange={setTextValue8} type="number" min="0" step="1" customInputClass="no-spinner" />
        </Example>

        <Example title="Copy to Clipboard">
          <TextInput label="Copy Text" value={textValue5} onChange={setTextValue5} showCopy />
        </Example>

        <Example title="Clearable Input">
          <TextInput label="Clearable" value={textValue6} onChange={setTextValue6} clearable onClear={handleClear} />
        </Example>

        <Example title="Centered Text">
          <TextInput label="Centered" value={textValue7} onChange={setTextValue7} customInputClass="text-center" />
        </Example>

        <Example title="Read-only Input">
          <TextInput label="Read-only" value="This is read-only content" readOnly />
        </Example>

        <Example title="Disabled Input">
          <TextInput label="Disabled" value="This input is disabled" disabled />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// LibraryIcon Examples
export function LibraryIconExamples() {
  return (
    <ComponentExamples title="Library Icons">
      <ComponentInfo component="LibraryIcon" description="Library icon component using absicons font with validation and fallback">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import LibraryIcon from '@/components/ui/LibraryIcon'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">icon</code> (icon name from absicons, defaults to
          'audiobookshelf'), <code className="bg-gray-700 px-2 py-1 rounded">fontSize</code> (CSS font size class, defaults to 'text-lg'),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">size</code> (5 or 6 for container size, defaults to 5),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code> (additional CSS classes)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Library Icon">
          <div className="p-2 rounded-lg">
            <LibraryIcon />
          </div>
        </Example>

        <Example title="Large Size">
          <div className="p-2 rounded-lg">
            <LibraryIcon size={6} />
          </div>
        </Example>

        <Example title="Custom Icon">
          <LibraryIcon icon="books-1" />
        </Example>

        <Example title="Custom Font Size">
          <LibraryIcon fontSize="text-3xl" />
        </Example>

        <Example title="Custom Icon with Large Size">
          <LibraryIcon icon="headphones" size={6} fontSize="text-3xl" />
        </Example>

        <Example title="Invalid Icon (Falls Back to Default)">
          <LibraryIcon icon="invalid-icon" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// Loading Examples
export function LoadingExamples() {
  return (
    <ComponentExamples title="Loading Indicators">
      <ComponentInfo component="LoadingIndicator" description="Loading indicator component with animated dots">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import LoadingIndicator from '@/components/ui/LoadingIndicator'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> No props required - displays animated loading dots
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <ComponentInfo component="LoadingSpinner" description="Loading spinner component with various sizes and customization options">
            <p className="mb-2">
              <span className="font-bold">Import:</span>{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">import LoadingSpinner from '@/components/widgets/LoadingSpinner'</code>
            </p>
            <p className="mb-2">
              <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">size</code> (la-sm, la-lg, la-2x, la-3x),{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">dark</code>, <code className="bg-gray-700 px-2 py-1 rounded">color</code>,{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">className</code>
            </p>
          </ComponentInfo>
        </div>

        <Example title="Loading Indicator">
          <LoadingIndicator />
        </Example>

        <Example title="Loading Spinner (Default - Small)">
          <LoadingSpinner />
        </Example>

        <Example title="Loading Spinner (Large)">
          <LoadingSpinner size="la-lg" />
        </Example>

        <Example title="Loading Spinner (2x)">
          <LoadingSpinner size="la-2x" />
        </Example>

        <Example title="Loading Spinner (3x)">
          <LoadingSpinner size="la-3x" />
        </Example>

        <Example title="Loading Spinner (Dark - Large)">
          <div className="bg-gray-500 p-6 rounded-lg">
            <LoadingSpinner size="la-lg" dark />
          </div>
        </Example>

        <Example title="Loading Spinner (Custom Color - Large)">
          <LoadingSpinner size="la-lg" color="#ff6b6b" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// MediaIconPicker Examples
export function MediaIconPickerExamples() {
  const [mediaIconValue, setMediaIconValue] = useState('audiobookshelf')

  return (
    <ComponentExamples title="Media Icon Pickers">
      <ComponentInfo component="MediaIconPicker" description="Icon picker component for selecting library icons with dropdown menu">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import MediaIconPicker from '@/components/ui/MediaIconPicker'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code> (selected icon name, defaults to 'database'),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code> (callback when icon is selected),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">label</code> (label text, defaults to 'Icon'),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code> (disables the picker),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code> (additional CSS classes),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">align</code> (menu alignment, defaults to 'left', options: 'left', 'right', 'center')
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Media Icon Picker">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} />
        </Example>

        <Example title="Custom Label & Value">
          <MediaIconPicker value="books-1" onChange={setMediaIconValue} label="Choose Books Icon" />
        </Example>

        <Example title="Disabled State">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} label="Disabled Picker" disabled />
        </Example>

        <Example title="Menu Alignment (Right)">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} align="right" />
        </Example>

        <Example title="Menu Alignment (Center)">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} align="center" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// Several different controls side by side
export function SideBySideControlsExamples() {
  const { showToast } = useGlobalToast()
  const [textInputValue, setTextInputValue] = useState('Initial Value')
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [dropdownValue, setDropdownValue] = useState<string | number>('item1')
  const [rangeValue, setRangeValue] = useState(50)
  const [readIconBtnValue, setReadIconBtnValue] = useState(false)
  const [multiSelectValue, setMultiSelectValue] = useState<MultiSelectItem[]>([
    { content: 'Item 1', value: 'item1' },
    { content: 'Item 2', value: 'item2' }
  ])
  const [checkboxValue2, setCheckboxValue2] = useState(false)

  return (
    <ComponentExamples title="Side By Side Controls">
      <ComponentInfo component="SideBySideControls" description="Several different controls side by side" />

      <ExamplesBlock>
        <Example title="Side By Side Controls" className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="flex gap-2 items-start ">
            <Btn className="mt-6" onClick={() => showToast('Button clicked', { type: 'info', title: 'Button' })}>
              Button
            </Btn>
            <IconBtn className="mt-6 shrink-0" onClick={() => showToast('IconBtn clicked', { type: 'info', title: 'IconBtn' })}>
              Edit
            </IconBtn>
            <TextInput label="Text Input" value={textInputValue} onChange={setTextInputValue} />
            <Checkbox className="mt-6 grow-0 shrink" labelClass="w-fit" label="Checkbox" value={checkboxValue} onChange={setCheckboxValue} />
            <Dropdown
              label="Dropdown"
              items={[
                { text: 'Item 1', value: 'item1' },
                { text: 'Item 2', value: 'item2' }
              ]}
              value={dropdownValue}
              onChange={setDropdownValue}
            />
            <FileInput className="mt-6 shrink-0">Select File</FileInput>
            <RangeInput label="Range Input" value={rangeValue} min={0} max={100} step={1} onChange={setRangeValue} />
            <ReadIconBtn className="mt-6 shrink-0" isRead={readIconBtnValue} onClick={() => setReadIconBtnValue(!readIconBtnValue)} />
            <MultiSelect
              label="Multi Select"
              items={[
                { content: 'Item 1', value: 'item1' },
                { content: 'Item 2', value: 'item2' },
                { content: 'Item 3', value: 'item3' },
                { content: 'Item 4', value: 'item4' },
                { content: 'Item 5', value: 'item5' },
                { content: 'Item 6', value: 'item6' },
                { content: 'Item 7', value: 'item7' },
                { content: 'Item 8', value: 'item8' },
                { content: 'Item 9', value: 'item9' }
              ]}
              selectedItems={multiSelectValue}
              onItemAdded={(item) => setMultiSelectValue([...multiSelectValue, item])}
              onItemRemoved={(item) => setMultiSelectValue(multiSelectValue.filter((i) => i.value !== item.value))}
              onItemEdited={(item, index) => {
                const newItems = [...multiSelectValue]
                newItems[index] = item
                setMultiSelectValue(newItems)
              }}
            />
            <Checkbox className="mt-6 grow-0 shrink" labelClass="w-fit" value={checkboxValue2} onChange={setCheckboxValue2} />
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// MultiSelect Examples
export function MultiSelectExamples() {
  const { showToast } = useGlobalToast()

  // MultiSelect sample data
  const multiSelectItems: MultiSelectItem[] = [
    { content: 'Apple', value: 'apple' },
    { content: 'Banana', value: 'banana' },
    { content: 'Cherry', value: 'cherry' },
    { content: 'Date', value: 'date' },
    { content: 'Elderberry', value: 'elderberry' },
    { content: 'Fig', value: 'fig' },
    { content: 'Grape', value: 'grape' },
    { content: 'Honeydew', value: 'honeydew' }
  ]
  const [multiSelectValue, setMultiSelectValue] = useState<MultiSelectItem[]>([
    { content: 'Apple', value: 'apple' },
    { content: 'Banana', value: 'banana' }
  ])

  // MultiSelect handlers
  const handleMultiSelectItemAdded = (item: MultiSelectItem) => {
    const newItems = [...multiSelectValue, item]
    setMultiSelectValue(newItems)
    if (item.value.startsWith('new-')) {
      showToast(`New item created: ${item.content}`, { type: 'success', title: 'Item Created' })
    }
  }

  const handleMultiSelectItemRemoved = (item: MultiSelectItem) => {
    const newItems = multiSelectValue.filter((i) => i.value !== item.value)
    setMultiSelectValue(newItems)
    showToast(`Removed: ${item.content}`, { type: 'info', title: 'Item Removed' })
  }

  const handleMultiSelectItemEdited = (item: MultiSelectItem, index: number) => {
    const newItems = [...multiSelectValue]
    newItems[index] = item
    setMultiSelectValue(newItems)
    showToast(`Edited: ${item.content}`, { type: 'info', title: 'Item Edited' })
  }

  return (
    <ComponentExamples title="Multi Selects">
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <ComponentInfo component="MultiSelect" description="Multi-select component with item management, editing, and validation">
          <p className="mb-2">
            <span className="font-bold">Import:</span>{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">
              import MultiSelect, {'{'} MultiSelectItem {'}'} from '@/components/ui/MultiSelect'
            </code>
          </p>
          <p className="mb-2">
            <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">selectedItems</code> (MultiSelectItem[]),{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">onItemAdded</code>, <code className="bg-gray-700 px-2 py-1 rounded">onItemRemoved</code>,{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">onItemEdited</code>, <code className="bg-gray-700 px-2 py-1 rounded">items</code>{' '}
            (MultiSelectItem[]), <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">showEdit</code>, <code className="bg-gray-700 px-2 py-1 rounded">onValidate</code>
          </p>
        </ComponentInfo>
      </div>

      <ExamplesBlock>
        <Example title="Default MultiSelect">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            items={multiSelectItems}
            label="Select Fruits"
          />
        </Example>

        <Example title="MultiSelect with Edit">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            onItemEdited={handleMultiSelectItemEdited}
            items={multiSelectItems}
            label="Select Fruits"
            showEdit
          />
        </Example>

        <Example title="Disabled MultiSelect">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            items={multiSelectItems}
            label="Select Fruits"
            disabled
          />
        </Example>

        <Example title="MultiSelect with Validation">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            onItemEdited={handleMultiSelectItemEdited}
            items={multiSelectItems}
            label="Select Fruits"
            showEdit
            onValidate={(content) => {
              if (content.includes(' ')) {
                return 'A fruit name cannot contain any spaces'
              }
              return null
            }}
          />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// MultiSelectDropdown Examples
export function MultiSelectDropdownExamples() {
  const { showToast } = useGlobalToast()

  const multiSelectDropdownItems = [
    { content: 'Red', value: '#ff0000' },
    { content: 'Green', value: '#00ff00' },
    { content: 'Blue', value: '#0000ff' },
    { content: 'Yellow', value: '#ffff00' },
    { content: 'Purple', value: '#800080' }
  ]
  const [multiSelectDropdownSelectedItems, setMultiSelectDropdownSelectedItems] = useState<MultiSelectItem[]>([
    { content: 'Red', value: '#ff0000' },
    { content: 'Blue', value: '#0000ff' }
  ])

  const handleMultiSelectDropdownItemAdded = (item: MultiSelectItem) => {
    const newItems = [...multiSelectDropdownSelectedItems, item]
    setMultiSelectDropdownSelectedItems(newItems)
    if (item.value.startsWith('new-')) {
      showToast(`New item created: ${item.content}`, { type: 'success', title: 'Item Created' })
    }
  }

  const handleMultiSelectDropdownItemRemoved = (item: MultiSelectItem) => {
    const newItems = multiSelectDropdownSelectedItems.filter((i) => i.value !== item.value)
    setMultiSelectDropdownSelectedItems(newItems)
    showToast(`Removed: ${item.content}`, { type: 'info', title: 'Item Removed' })
  }

  return (
    <ComponentExamples title="Multi Select Dropdowns">
      <ComponentInfo component="MultiSelectDropdown" description="Multi-select dropdown component with item management">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">selectedItems</code> (MultiSelectItem[]),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onItemAdded</code>, <code className="bg-gray-700 px-2 py-1 rounded">onItemRemoved</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">items</code> (MultiSelectItem[]), <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default MultiSelectDropdown">
          <MultiSelectDropdown
            selectedItems={multiSelectDropdownSelectedItems}
            onItemAdded={handleMultiSelectDropdownItemAdded}
            onItemRemoved={handleMultiSelectDropdownItemRemoved}
            items={multiSelectDropdownItems}
            label="Select Colors"
          />
        </Example>
        <Example title="Disabled MultiSelectDropdown">
          <MultiSelectDropdown
            selectedItems={multiSelectDropdownSelectedItems}
            onItemAdded={handleMultiSelectDropdownItemAdded}
            onItemRemoved={handleMultiSelectDropdownItemRemoved}
            items={multiSelectDropdownItems}
            label="Select Colors"
            disabled
          />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// RangeInput Examples
export function RangeInputExamples() {
  // RangeInput sample data
  const [rangeValue1, setRangeValue1] = useState(50)
  const [rangeValue2, setRangeValue2] = useState(25)
  const [rangeValue3, setRangeValue3] = useState(75)
  const [rangeValue4, setRangeValue4] = useState(0)
  const [rangeValue5, setRangeValue5] = useState(100)

  return (
    <ComponentExamples title="Range Inputs">
      <ComponentInfo component="RangeInput" description="Accessible range input component with customizable min/max/step values, labels, and disabled state">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import RangeInput from '@/components/ui/RangeInput'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">min</code>, <code className="bg-gray-700 px-2 py-1 rounded">max</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">step</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code>, <code className="bg-gray-700 px-2 py-1 rounded">aria-describedby</code>
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: accessible with proper ARIA attributes, keyboard navigation, screen reader support, customizable styling, flexible layout (with/without
          label)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default RangeInput">
          <RangeInput value={rangeValue1} onChange={setRangeValue1} label="Volume Control" />
        </Example>

        <Example title="RangeInput without Label">
          <RangeInput value={rangeValue2} onChange={setRangeValue2} />
        </Example>

        <Example title="Custom Range (0-200)">
          <RangeInput value={rangeValue3} onChange={setRangeValue3} min={0} max={200} step={10} label="Custom Range With Step" />
        </Example>

        <Example title="Disabled RangeInput">
          <RangeInput value={50} onChange={() => {}} disabled label="Disabled Range" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// DurationPicker Examples
export function DurationPickerExamples() {
  const [timeValue1, setTimeValue1] = useState(3661) // 1:01:01
  const [timeValue2, setTimeValue2] = useState(7200) // 2:00:00
  const [timeValue3, setTimeValue3] = useState(360000) // 100:00:00 (3-digit hours)
  const [timeValue4, setTimeValue4] = useState(0) // 0:00:00

  return (
    <ComponentExamples title="Duration Picker">
      <ComponentInfo
        component="DurationPicker"
        description="Interactive duration input component with hours, minutes, and seconds. Supports keyboard navigation and 3-digit hours for long durations"
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import DurationPicker from '@/components/ui/DurationPicker'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">onInput</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">showThreeDigitHour</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">readOnly</code>, <code className="bg-gray-700 px-2 py-1 rounded">borderless</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">size</code>, <code className="bg-gray-700 px-2 py-1 rounded">className</code>
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: click-to-focus individual digits, keyboard navigation (arrow keys, number input), visual focus indicators, support for 3-digit hours (over
          99 hours), click outside to blur, accessible with proper ARIA attributes
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default DurationPicker">
          <div className="space-y-2">
            <DurationPicker value={timeValue1} onChange={setTimeValue1} className="w-fit" />
            <p className="text-sm text-gray-400">
              Value: {timeValue1} seconds ({Math.floor(timeValue1 / 3600)}:{(Math.floor(timeValue1 / 60) % 60).toString().padStart(2, '0')}:
              {(timeValue1 % 60).toString().padStart(2, '0')})
            </p>
          </div>
        </Example>

        <Example title="DurationPicker with 3-Digit Hours">
          <div className="space-y-2">
            <DurationPicker value={timeValue3} onChange={setTimeValue3} showThreeDigitHour className="w-fit" />
            <p className="text-sm text-gray-400">
              Value: {timeValue3} seconds ({Math.floor(timeValue3 / 3600)}:{(Math.floor(timeValue3 / 60) % 60).toString().padStart(2, '0')}:
              {(timeValue3 % 60).toString().padStart(2, '0')})
            </p>
          </div>
        </Example>

        <Example title="Disabled DurationPicker">
          <DurationPicker value={timeValue2} onChange={() => {}} disabled className="w-fit" />
        </Example>

        <Example title="ReadOnly DurationPicker">
          <DurationPicker value={timeValue2} onChange={() => {}} readOnly className="w-fit" />
        </Example>

        <Example title="Borderless DurationPicker">
          <DurationPicker value={timeValue1} onChange={setTimeValue1} borderless className="w-fit" />
        </Example>

        <Example title="Small Size DurationPicker">
          <DurationPicker value={timeValue2} onChange={setTimeValue2} size="small" className="w-fit" />
        </Example>

        <Example title="Large Size DurationPicker">
          <DurationPicker value={timeValue2} onChange={setTimeValue2} size="large" className="w-fit" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// ToastNotification Examples
export function ToastNotificationExamples() {
  const { showToast } = useGlobalToast()

  return (
    <ComponentExamples title="Toasts">
      <ComponentInfo component="Global Toast Hook" description="Global toast hook for easy toast management throughout the app">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">
            import {'{'} useGlobalToast {'}'} from '@/contexts/ToastContext'
          </code>
        </p>
        <p className="mb-2">
          Usage: <br />
          <code className="bg-gray-700 px-2 py-1 rounded">
            const {'{'} showToast {'}'} = useGlobalToast()
          </code>
          <br />
          <code className="bg-gray-700 px-2 py-1 rounded">...</code>
          <br />
          <code className="bg-gray-700 px-2 py-1 rounded">
            showToast(message, {'{'} type, title, duration {'}'})
          </code>
        </p>
        <p className="mb-2 text-sm text-gray-400">Note: Global toast is automatically available in all pages. No need to include ToastContainer manually.</p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Success Toast">
          <Btn onClick={() => showToast('Operation completed successfully!', { type: 'success', title: 'Success' })}>Show Success</Btn>
        </Example>

        <Example title="Error Toast">
          <Btn onClick={() => showToast('Something went wrong!', { type: 'error', title: 'Error' })}>Show Error</Btn>
        </Example>

        <Example title="Warning Toast">
          <Btn onClick={() => showToast('Please be careful!', { type: 'warning', title: 'Warning' })}>Show Warning</Btn>
        </Example>

        <Example title="Info Toast">
          <Btn onClick={() => showToast('Here is some information.', { type: 'info', title: 'Information' })}>Show Info</Btn>
        </Example>

        <Example title="Long Duration Toast">
          <Btn onClick={() => showToast('This toast will stay for 10 seconds.', { type: 'info', title: 'Long Toast', duration: 10000 })}>Show Long Toast</Btn>
        </Example>

        <Example title="No Auto-Dismiss Toast">
          <Btn onClick={() => showToast('This toast will not auto-dismiss.', { type: 'warning', title: 'Persistent', duration: 0 })}>Show Persistent</Btn>
        </Example>

        <Example title="Toast with Title Only">
          <Btn onClick={() => showToast('Just a simple message.', { type: 'info' })}>Show Simple</Btn>
        </Example>

        <Example title="Multiple Toasts">
          <Btn
            onClick={() => {
              showToast('First notification', { type: 'info', title: 'First' })
              setTimeout(() => showToast('Second notification', { type: 'success', title: 'Second' }), 500)
              setTimeout(() => showToast('Third notification', { type: 'warning', title: 'Third' }), 1000)
            }}
          >
            Show Multiple
          </Btn>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// TwoStageMultiSelect Examples
export function TwoStageMultiSelectExamples() {
  const { showToast } = useGlobalToast()

  const [twoStageMultiSelectValue, setTwoStageMultiSelectValue] = useState<MultiSelectItem<TwoStageMultiSelectContent>[]>([
    { value: '1', content: { value: 'Harry Potter', modifier: '1' } },
    { value: '2', content: { value: 'Lord of the Rings', modifier: '3' } }
  ])

  const twoStageMultiSelectItems = [
    { value: '1', content: 'Harry Potter' },
    { value: '2', content: 'Lord of the Rings' },
    { value: '3', content: 'The Hitchhikers Guide to the Galaxy' },
    { value: '4', content: 'The Chronicles of Narnia' },
    { value: '5', content: 'The Hunger Games' },
    { value: '6', content: 'Foundation' },
    { value: '7', content: 'A song of ice and fire' },
    { value: '8', content: 'Robots' }
  ]

  const handleTwoStageMultiSelectItemAdded = (item: any) => {
    const newItems = [...twoStageMultiSelectValue, item]
    setTwoStageMultiSelectValue(newItems)
    if (item.value.startsWith('new-')) {
      console.log('new item', item)
      showToast(`New item created: ${item.content.value}${item.content.modifier ? ` #${item.content.modifier}` : ''}`, {
        type: 'success',
        title: 'Item Created'
      })
    }
  }

  const handleTwoStageMultiSelectItemRemoved = (item: any) => {
    const newItems = twoStageMultiSelectValue.filter((i) => i.value !== item.value)
    setTwoStageMultiSelectValue(newItems)
    showToast(`Removed: ${item.content.value}${item.content.modifier ? ` #${item.content.modifier}` : ''}`, { type: 'info', title: 'Item Removed' })
  }

  const handleTwoStageMultiSelectItemEdited = (item: any, index: number) => {
    const newItems = [...twoStageMultiSelectValue]
    newItems[index] = item
    setTwoStageMultiSelectValue(newItems)
  }

  return (
    <ComponentExamples title="Two Stage Multi Selects">
      <ComponentInfo component="TwoStageMultiSelect" description="Two-stage multi-select component with primary and modifier values">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">
            import TwoStageMultiSelect, {'{'} TwoStageMultiSelectContent {'}'} from '@/components/ui/TwoStageMultiSelect'
          </code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">selectedItems</code>{' '}
          (MultiSelectItem&lt;TwoStageMultiSelectContent&gt;[]), <code className="bg-gray-700 px-2 py-1 rounded">onItemAdded</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onItemRemoved</code>, <code className="bg-gray-700 px-2 py-1 rounded">onItemEdited</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">items</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onValidate</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default TwoStageMultiSelect">
          <TwoStageMultiSelect
            selectedItems={twoStageMultiSelectValue}
            onItemAdded={handleTwoStageMultiSelectItemAdded}
            onItemRemoved={handleTwoStageMultiSelectItemRemoved}
            onItemEdited={handleTwoStageMultiSelectItemEdited}
            items={twoStageMultiSelectItems}
            label="Select Series and Sequence"
            onValidate={(content) => {
              if (content.modifier && content.modifier.includes(' ')) {
                return 'A sequence cannot contain any spaces'
              }
              return null
            }}
          />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}

// AdvancedModal Examples
export function AdvancedModalExamples() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { showToast } = useGlobalToast()

  // MultiSelect sample data
  const multiSelectItems: MultiSelectItem[] = [
    { content: 'Apple', value: 'apple' },
    { content: 'Banana', value: 'banana' },
    { content: 'Cherry', value: 'cherry' },
    { content: 'Date', value: 'date' },
    { content: 'Elderberry', value: 'elderberry' },
    { content: 'Fig', value: 'fig' },
    { content: 'Grape', value: 'grape' },
    { content: 'Honeydew', value: 'honeydew' }
  ]
  const [multiSelectValue, setMultiSelectValue] = useState<MultiSelectItem[]>([
    { content: 'Apple', value: 'apple' },
    { content: 'Banana', value: 'banana' }
  ])

  // MultiSelect handlers
  const handleMultiSelectItemAdded = (item: MultiSelectItem) => {
    const newItems = [...multiSelectValue, item]
    setMultiSelectValue(newItems)
    if (item.value.startsWith('new-')) {
      showToast(`New item created: ${item.content}`, { type: 'success', title: 'Item Created' })
    }
  }

  const handleMultiSelectItemRemoved = (item: MultiSelectItem) => {
    const newItems = multiSelectValue.filter((i) => i.value !== item.value)
    setMultiSelectValue(newItems)
    showToast(`Removed: ${item.content}`, { type: 'info', title: 'Item Removed' })
  }

  const handleMultiSelectItemEdited = (item: MultiSelectItem, index: number) => {
    const newItems = [...multiSelectValue]
    newItems[index] = item
    setMultiSelectValue(newItems)
    showToast(`Edited: ${item.content}`, { type: 'info', title: 'Item Edited' })
  }

  return (
    <ComponentExamples title="Advanced Modal Examples">
      <ExamplesBlock>
        <Example title="MultiSelect within Modal Dialog">
          <div>
            <p className="text-gray-400 text-sm mb-4">This example shows how MultiSelect works inside a modal dialog.</p>
            <Btn onClick={() => setIsModalOpen(true)}>Open Modal with MultiSelect</Btn>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} width={600}>
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-600 pb-4">
                  <h3 className="text-xl font-semibold text-white">Edit Tags</h3>
                </div>

                {/* Content */}
                <div className="space-y-4 flex-1">
                  <p className="text-gray-300 text-sm">Select or add tags for this item.</p>

                  <MultiSelect
                    selectedItems={multiSelectValue}
                    onItemAdded={handleMultiSelectItemAdded}
                    onItemRemoved={handleMultiSelectItemRemoved}
                    onItemEdited={handleMultiSelectItemEdited}
                    items={multiSelectItems}
                    label="Item Tags"
                    showEdit
                  />

                  <div className="text-xs text-gray-400 mt-2">
                    Current selection: {multiSelectValue.length > 0 ? multiSelectValue.map((i) => i.content).join(', ') : 'None'}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-600">
                  <Btn onClick={() => setIsModalOpen(false)} color="bg-gray-600">
                    Cancel
                  </Btn>
                  <Btn onClick={() => setIsModalOpen(false)} color="bg-blue-600">
                    Save Changes
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
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import Modal from '@/components/modals/Modal'</code>
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
                  Click the "Start Processing" button to see the processing overlay in action. The modal will be disabled during processing.
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
                  This modal is persistent - you can only close it by clicking the "Close" button. Background clicks and Escape key are disabled.
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
              outerContent={<div className="absolute top-10 left-10 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-semibold">Outer Content!</div>}
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
                <div className="flex justify-end pt-4 border-t border-gray-600">
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

// Toggle Button Examples
export function ToggleBtnsExamples() {
  const [selectedValue1, setSelectedValue1] = useState('option1')
  const [selectedValue2, setSelectedValue2] = useState('small')
  const [selectedValue3, setSelectedValue3] = useState('enabled')
  const [selectedValue4, setSelectedValue4] = useState('medium')
  const [selectedValue5, setSelectedValue5] = useState('large')

  const handleChange1 = (value: string | number) => setSelectedValue1(String(value))
  const handleChange2 = (value: string | number) => setSelectedValue2(String(value))
  const handleChange3 = (value: string | number) => setSelectedValue3(String(value))
  const handleChange4 = (value: string | number) => setSelectedValue4(String(value))
  const handleChange5 = (value: string | number) => setSelectedValue5(String(value))

  const basicItems = [
    { text: 'Option 1', value: 'option1' },
    { text: 'Option 2', value: 'option2' },
    { text: 'Option 3', value: 'option3' }
  ]

  const sizeItems = [
    { text: 'Small', value: 'small' },
    { text: 'Medium', value: 'medium' },
    { text: 'Large', value: 'large' }
  ]

  const stateItems = [
    { text: 'Enabled', value: 'enabled' },
    { text: 'Disabled', value: 'disabled' }
  ]

  return (
    <ComponentExamples title="Toggle Buttons">
      <ComponentInfo component="ToggleButtonGroup" description="Toggle button group component with radio button behavior and keyboard navigation">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">items</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">value</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">size</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Basic Toggle Buttons">
          <div className="space-y-4">
            <ToggleButtonGroup items={basicItems} value={selectedValue1} onChange={handleChange1} label="Select an option" />
          </div>
        </Example>

        <Example title="Different Sizes">
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <ToggleButtonGroup items={sizeItems} value={selectedValue2} onChange={handleChange2} size="small" label="Small" />
              </div>
              <div>
                <ToggleButtonGroup items={sizeItems} value={selectedValue4} onChange={handleChange4} size="medium" label="Medium" />
              </div>
              <div>
                <ToggleButtonGroup items={sizeItems} value={selectedValue5} onChange={handleChange5} size="large" label="Large" />
              </div>
            </div>
          </div>
        </Example>

        <Example title="Disabled State">
          <div className="space-y-4">
            <ToggleButtonGroup items={stateItems} value={selectedValue3} onChange={handleChange3} disabled={true} label="Select state" />
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
