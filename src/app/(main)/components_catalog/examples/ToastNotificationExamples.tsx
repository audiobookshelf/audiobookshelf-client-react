'use client'
import Btn from '@/components/ui/Btn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// ToastNotification Examples

export function ToastNotificationExamples() {
  const { showToast } = useGlobalToast()

  return (
    <ComponentExamples title="Toasts">
      <ComponentInfo component="Global Toast Hook" description="Global toast hook for easy toast management throughout the app">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <Code overflow>
            import {'{'} useGlobalToast {'}'} from &apos;@/contexts/ToastContext&apos;
          </Code>
        </p>
        <p className="mb-2">
          Usage: <br />
          <Code>
            const {'{'} showToast {'}'} = useGlobalToast()
          </Code>
          <br />
          <Code>...</Code>
          <br />
          <Code>
            showToast(message, {'{'} type, title, duration {'}'})
          </Code>
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
