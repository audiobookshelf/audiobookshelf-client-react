'use client'
import FileInput from '@/components/ui/FileInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// FileInput Examples
export function FileInputExamples() {
  const { showToast } = useGlobalToast()

  return (
    <ComponentExamples title="File Inputs">
      <ComponentInfo component="FileInput" description="File input component with customizable accept types and responsive design">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import FileInput from &apos;@/components/ui/FileInput&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>accept</Code> (file types to accept), <Code>onChange</Code> (callback with selected file),{' '}
          <Code>children</Code> (ReactNode for button content), <Code>className</Code> (custom CSS classes)
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
