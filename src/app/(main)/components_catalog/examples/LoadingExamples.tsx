'use client'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function LoadingExamples() {
  return (
    <ComponentExamples title="Loading Indicators">
      <ComponentInfo component="LoadingIndicator" description="Loading indicator component with animated dots">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import LoadingIndicator from &apos;@/components/ui/LoadingIndicator&apos;</code>
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
              <code className="bg-gray-700 px-2 py-1 rounded">import LoadingSpinner from &apos;@/components/widgets/LoadingSpinner&apos;</code>
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
