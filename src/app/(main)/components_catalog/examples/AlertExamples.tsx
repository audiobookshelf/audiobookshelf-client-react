'use client'

import Alert from '@/components/widgets/Alert'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function AlertExamples() {
  return (
    <ComponentExamples title="Alert Components">
      <ComponentInfo component="Alert" description="Display contextual feedback messages with different severity levels (error, warning, success, info).">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Alert from &apos;@/components/widgets/Alert&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>type</Code> (optional: &apos;error&apos; | &apos;warning&apos; | &apos;success&apos; |
          &apos;info&apos;, defaults to &apos;error&apos;), <Code>children</Code> (required), <Code>autoFocus</Code> (optional: boolean, defaults to true. If
          true and type is &apos;error&apos; or &apos;warning&apos;, the alert will be focused when rendered), <Code>className</Code> (optional)
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> Uses Material Symbols icons.
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> <Code>autoFocus</Code> is always set to false in the examples, so as not to steal focus.
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Error Alert">
          <Alert type="error" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Something went wrong!</p>
              <p className="mt-1 text-sm opacity-80">Unable to connect to the server. Please check your internet connection and try again.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Warning Alert">
          <Alert type="warning" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Warning: Low disk space</p>
              <p className="mt-1 text-sm opacity-80">Your storage is running low. Consider removing some files to free up space.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Success Alert">
          <Alert type="success" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Success!</p>
              <p className="mt-1 text-sm opacity-80">Your audiobook has been successfully added to the library.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Info Alert">
          <Alert type="info" autoFocus={false}>
            <div className="pr-4">
              <p className="font-medium">Did you know?</p>
              <p className="mt-1 text-sm opacity-80">You can organize your audiobooks into custom collections for better management.</p>
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
              <p className="mt-1 text-sm opacity-80">This alert has additional shadow styling applied via className prop.</p>
            </div>
          </Alert>
        </Example>

        <Example title="Alert with Action Button">
          <Alert type="warning" autoFocus={false}>
            <div className="flex w-full items-center justify-between pr-4">
              <div>
                <p className="font-medium">Update available</p>
                <p className="mt-1 text-sm opacity-80">A new version of the application is available.</p>
              </div>
              <button className="bg-warning hover:bg-warning/90 ml-4 rounded-md px-4 py-2 text-sm font-medium text-gray-900 transition-colors">
                Update Now
              </button>
            </div>
          </Alert>
        </Example>

        <Example title="Alert with List Content">
          <Alert type="error" autoFocus={false}>
            <div className="pr-4">
              <p className="mb-2 font-medium">Validation errors:</p>
              <ul className="list-inside list-disc space-y-1 text-sm opacity-80">
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
