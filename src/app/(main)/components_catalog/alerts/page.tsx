import { AlertExamples } from '../examples/AlertExamples'
import { ToastNotificationExamples } from '../examples/ToastNotificationExamples'
import { TooltipExamples } from '../examples/TooltipExamples'

export default function AlertComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Alert, Toast & Tooltip Components</h1>
        <p className="mb-6 text-gray-300">This page showcases all the alert, toast, and tooltip components available in the audiobookshelf client.</p>
        <a href="/components_catalog" className="text-blue-400 transition-colors hover:text-blue-300">
          ← Back to Components Catalog
        </a>
      </div>

      {/* Table of Contents */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-gray-400">Table of Contents</h2>
        <div className="rounded-lg bg-gray-800 p-6">
          <ul className="space-y-2 text-gray-300">
            <li>
              <a href="#alert-examples" className="transition-colors hover:text-blue-400">
                Alerts
              </a>
            </li>
            <li>
              <a href="#toast-notification-examples" className="transition-colors hover:text-blue-400">
                Toast Notifications
              </a>
            </li>
            <li>
              <a href="#tooltip-examples" className="transition-colors hover:text-blue-400">
                Tooltips
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="alert-examples">
        <AlertExamples />
      </div>
      <div id="toast-notification-examples">
        <ToastNotificationExamples />
      </div>
      <div id="tooltip-examples">
        <TooltipExamples />
      </div>
    </div>
  )
}
