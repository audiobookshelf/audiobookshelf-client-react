import { CheckboxExamples } from '../examples/CheckboxExamples'
import { ToggleSwitchExamples } from '../examples/ToggleSwitchExamples'

export default function CheckboxComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Checkbox & Switch Components</h1>
        <p className="mb-6 text-gray-300">This page showcases all the checkbox and switch components available in the audiobookshelf client.</p>
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
              <a href="#toggle-switch-examples" className="transition-colors hover:text-blue-400">
                Toggle Switches
              </a>
            </li>
            <li>
              <a href="#checkbox-examples" className="transition-colors hover:text-blue-400">
                Checkboxes
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="toggle-switch-examples">
        <ToggleSwitchExamples />
      </div>
      <div id="checkbox-examples">
        <CheckboxExamples />
      </div>
    </div>
  )
}
