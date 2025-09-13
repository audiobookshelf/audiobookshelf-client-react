import { useState } from 'react'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'
import SlateEditor from '@/components/ui/SlateEditor'
import TextareaInput from '@/components/ui/TextareaInput'
import Label from '@/components/ui/Label'
import { mergeClasses } from '@/lib/merge-classes'
import { slateElementStyles } from '@/components/ui/slate/constants'

export function SlateEditorExamples() {
  const initialContent =
    '<p>This is a<br/>4 line<br/>text<br/>paragraph</p>' +
    '<p><s>Strikethrough</s>, <em>italic</em>, and <strong>bold</strong></p>' +
    '<p>Unordered list:</p><ul><li>First item</li><li>Second item</li></ul>' +
    '<p>Ordered list:</p><ol><li>First item</li><li>Second item</li></ol>' +
    '<p>This is a <a href="https://www.google.com">link</a></p>'

  const rtlContent =
    '<p>זוהי פסקה<br/>בת 4<br/>שורות<br/>של טקסט</p>' +
    '<p><s>מחוק</s>, <strong>בולד</strong>, <em>איטליק</em></p>' +
    '<p>רשימה לא מסודרת:</p><ul><li>פריט 1</li><li>פריט 2</li></ul>' +
    '<p>רשימה מסודרת:</p><ol><li>פריט 1</li><li>פריט 2</li></ol>' +
    '<p>זהו <a href="https://www.google.com">קישור</a></p>'
  const notEditableContent = '<p>This content is not editable.</p>'

  const textAreaValue = 'This is a\n4 line\ntext\nparagraph'
  const editorValue = '<p>This is a\n4 line\ntext\nparagraph</p>'
  const [editorOutput, setEditorOutput] = useState(initialContent)

  const handleUpdate = (html: string) => {
    console.log('Editor content updated:', html)
  }

  const handleUpdateTextarea = (value: string) => {
    console.log('Textarea content updated:', value)
  }

  return (
    <ComponentExamples title="Rich Text Editor">
      <ComponentInfo component="SlateEditor" description="A rich text editor built with Slate.js">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import SlateEditor from '@/components/ui/SlateEditor'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">srcContent</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onUpdate</code>, <code className="bg-gray-700 px-2 py-1 rounded">placeholder</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabledEditor</code>, <code className="bg-gray-700 px-2 py-1 rounded">autofocus</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Editor" className="col-span-1 md:col-span-2 lg:col-span-3">
          <SlateEditor onUpdate={handleUpdate} placeholder="Enter some rich text..." label="Default Editor" />
        </Example>
        <Example title="Editor with Initial Content" className="col-span-1 md:col-span-2 lg:col-span-3">
          <SlateEditor srcContent={initialContent} onUpdate={handleUpdate} label="Editor with Initial Content" />
        </Example>
        <Example title="Read-only Editor" className="col-span-1 md:col-span-2 lg:col-span-3">
          <SlateEditor srcContent={notEditableContent + initialContent} readOnly label="Read-only Editor" />
        </Example>
        <Example title="Editor with RTL content" className="col-span-1 md:col-span-2 lg:col-span-3">
          <SlateEditor srcContent={rtlContent} onUpdate={handleUpdate} label="Editor with RTL content" />
        </Example>
        <Example title="Editor vs. Textarea" className="col-span-1 md:col-span-2 lg:col-span-3 space-y-4">
          <div className="flex gap-4 ">
            <div className="flex-1">
              <SlateEditor srcContent={editorValue} onUpdate={handleUpdate} label="Editor" />
            </div>
            <div className="mt-9.5 flex-1">
              <TextareaInput value={textAreaValue} onChange={handleUpdateTextarea} rows={4} label="Textarea" />
            </div>
          </div>
          <div className="flex gap-4 ">
            <div className="flex-1">
              <SlateEditor srcContent={editorValue} onUpdate={handleUpdate} label="Read-only Editor" readOnly />
            </div>
            <div className="flex-1">
              <TextareaInput value={textAreaValue} onChange={handleUpdateTextarea} rows={4} label="Read-only Textarea" readOnly />
            </div>
          </div>
          <div className="flex gap-4 ">
            <div className="flex-1">
              <SlateEditor srcContent={editorValue} onUpdate={handleUpdate} label="Disabled Editor" disabled />
            </div>
            <div className="flex-1">
              <TextareaInput value={textAreaValue} onChange={handleUpdateTextarea} rows={4} label="Disabled Textarea" disabled />
            </div>
          </div>
        </Example>
        <Example title="Editor vs. Output" className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="flex gap-4 ">
            <div className="flex-1">
              <SlateEditor srcContent={initialContent} onUpdate={setEditorOutput} label="Editor" className="[&_[data-slate-editor]]:h-83" />
            </div>
            <div className="flex-1">
              <Label className="mt-9.5">Output:</Label>
              <div className={mergeClasses(slateElementStyles, 'p-2 border border-gray-500 rounded-md')} dangerouslySetInnerHTML={{ __html: editorOutput }} />
            </div>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
