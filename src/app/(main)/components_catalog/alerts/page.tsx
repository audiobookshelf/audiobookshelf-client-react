import { AlertExamples } from '../examples/AlertExamples'
import { ToastNotificationExamples } from '../examples/ToastNotificationExamples'
import { TooltipExamples } from '../examples/TooltipExamples'

export default function AlertComponentsPage() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Alert, Toast & Tooltip Components</h1>
        <p className="text-gray-300 mb-6">This page showcases all the alert, toast, and tooltip components available in the audiobookshelf client.</p>
        <a href="/components_catalog" className="text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Components Catalog
        </a>
      </div>

      {/* Table of Contents */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Table of Contents</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <ul className="space-y-2 text-gray-300">
            <li>
              <a href="#alert-examples" className="hover:text-blue-400 transition-colors">
                Alerts
              </a>
            </li>
            <li>
              <a href="#toast-notification-examples" className="hover:text-blue-400 transition-colors">
                Toast Notifications
              </a>
            </li>
            <li>
              <a href="#tooltip-examples" className="hover:text-blue-400 transition-colors">
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
