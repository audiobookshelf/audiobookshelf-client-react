'use client'
import FileInput from '@/components/ui/FileInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// FileInput Examples
export function FileInputExamples() {
  const { showToast } = useGlobalToast()

  return (
    <ComponentExamples title="File Inputs">
      <ComponentInfo component="FileInput" description="File input component with customizable accept types and responsive design">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import FileInput from &apos;@/components/ui/FileInput&apos;</code>
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
