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
          <Code>children</Code> (button label on desktop), <Code>className</Code>, <Code>ariaLabel</Code>, <Code>size</Code> (<Code>small</Code> |{' '}
          <Code>medium</Code>), <Code>icon</Code> (material symbol for mobile icon button)
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

        <Example title="Image File Input">
          <FileInput
            accept=".png, .jpg, .jpeg, .webp"
            onChange={(file) => showToast(`Selected image: ${file.name}`, { type: 'success', title: 'Image Selected' })}
            ariaLabel="Upload Image"
          >
            Upload Image
          </FileInput>
        </Example>

        <Example title="Small Size">
          <FileInput
            size="small"
            onChange={(file) => showToast(`Selected file: ${file.name}`, { type: 'success', title: 'File Selected' })}
            ariaLabel="Upload small file input"
          >
            Choose File
          </FileInput>
        </Example>

        <Example title="Default Icon">
          <FileInput
            className="[&>button:nth-of-type(1)]:!hidden [&>button:nth-of-type(2)]:md:!flex"
            onChange={(file) => showToast(`Selected file: ${file.name}`, { type: 'success', title: 'File Selected' })}
            ariaLabel="Upload file"
          >
            Upload File
          </FileInput>
        </Example>

        <Example title="Custom Icon">
          <FileInput
            className="[&>button:nth-of-type(1)]:!hidden [&>button:nth-of-type(2)]:md:!flex"
            icon="attach_file"
            onChange={(file) => showToast(`Selected file: ${file.name}`, { type: 'success', title: 'File Selected' })}
            ariaLabel="Attach file"
          >
            Attach File
          </FileInput>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
