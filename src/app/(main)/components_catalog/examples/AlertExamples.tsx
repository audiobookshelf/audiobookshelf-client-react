'use client'

import Alert from '@/components/widgets/Alert'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function AlertExamples() {
  return (
    <ComponentExamples title="Alert Components">
      <ComponentInfo component="Alert" description="Display contextual feedback messages with different severity levels (error, warning, success, info).">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import Alert from &apos;@/components/widgets/Alert&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">type</code> (optional: &apos;error&apos; |
          &apos;warning&apos; | &apos;success&apos; | &apos;info&apos;, defaults to &apos;error&apos;),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">children</code> (required), <code className="bg-gray-700 px-2 py-1 rounded">autoFocus</code>{' '}
          (optional: boolean, defaults to true. If true and type is &apos;error&apos; or &apos;warning&apos;, the alert will be focused when rendered),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code> (optional)
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> Uses Material Symbols icons.
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> <code className="bg-gray-700 px-2 py-1 rounded">autoFocus</code> is always set to false in the examples, so
          as not to steal focus.
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Error Alert">
          <Alert type="error" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Something went wrong!</p>
              <p className="text-sm opacity-80 mt-1">Unable to connect to the server. Please check your internet connection and try again.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Warning Alert">
          <Alert type="warning" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Warning: Low disk space</p>
              <p className="text-sm opacity-80 mt-1">Your storage is running low. Consider removing some files to free up space.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Success Alert">
          <Alert type="success" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Success!</p>
              <p className="text-sm opacity-80 mt-1">Your audiobook has been successfully added to the library.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Info Alert">
          <Alert type="info" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Did you know?</p>
              <p className="text-sm opacity-80 mt-1">You can organize your audiobooks into custom collections for better management.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Simple Error Alert">
          <Alert type="error" autoFocus={false}>
            <div className="pr-4">
              <p>Invalid username or password</p>
            </div>
          </Alert>
        </Example>

        <Example title="Custom Styled Alert">
          <Alert type="info" className="shadow-lg" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Custom styled alert</p>
              <p className="text-sm opacity-80 mt-1">This alert has additional shadow styling applied via className prop.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Alert with Action Button">
          <Alert type="warning" autoFocus={false}>
            <div className="pr-4 flex items-center justify-between w-full">
              <div>
                <p className="font-medium">Update available</p>
                <p className="text-sm opacity-80 mt-1">A new version of the application is available.</p>
              </div>
              <button className="ml-4 px-4 py-2 bg-warning text-gray-900 rounded-md text-sm font-medium hover:bg-warning/90 transition-colors">
                Update Now
              </button>
            </div>
          </Alert>
        </Example>

        <Example title="Alert with List Content">
          <Alert type="error" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium mb-2">Validation errors:</p>
              <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
                <li>Title field is required</li>
                <li>Author field cannot be empty</li>
                <li>Duration must be greater than 0</li>
              </ul>
            </div>
          </Alert>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
