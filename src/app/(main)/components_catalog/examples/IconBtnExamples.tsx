'use client'
import IconBtn from '@/components/ui/IconBtn'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// IconBtn Examples
export function IconBtnExamples() {
  return (
    <ComponentExamples title="Icon Buttons">
      <ComponentInfo component="IconBtn" description="Icon button component with material symbols, loading states, and customization options">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import IconBtn from &apos;@/components/ui/IconBtn&apos;</code>
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
