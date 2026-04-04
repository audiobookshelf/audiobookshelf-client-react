import { BtnExamples } from '../examples/BtnExamples'
import { ContextMenuDropdownExamples } from '../examples/ContextMenuDropdownExamples'
import { IconBtnExamples } from '../examples/IconBtnExamples'
import { ReadIconBtnExamples } from '../examples/ReadIconBtnExamples'
import { ToggleBtnsExamples } from '../examples/ToggleBtnsExamples'

export default function ButtonComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Button Components</h1>
        <p className="mb-6 text-gray-300">This page showcases all the button components available in the audiobookshelf client.</p>
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
              <a href="#button-examples" className="transition-colors hover:text-blue-400">
                Basic Buttons
              </a>
            </li>
            <li>
              <a href="#context-menu-dropdown-examples" className="transition-colors hover:text-blue-400">
                Context Menu Button
              </a>
            </li>
            <li>
              <a href="#icon-button-examples" className="transition-colors hover:text-blue-400">
                Icon Buttons
              </a>
            </li>
            <li>
              <a href="#read-icon-button-examples" className="transition-colors hover:text-blue-400">
                Read Icon Buttons
              </a>
            </li>
            <li>
              <a href="#toggle-button-examples" className="transition-colors hover:text-blue-400">
                Toggle Buttons
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="button-examples">
        <BtnExamples />
      </div>
      <div id="context-menu-dropdown-examples">
        <ContextMenuDropdownExamples />
      </div>
      <div id="icon-button-examples">
        <IconBtnExamples />
      </div>
      <div id="read-icon-button-examples">
        <ReadIconBtnExamples />
      </div>
      <div id="toggle-button-examples">
        <ToggleBtnsExamples />
      </div>
    </div>
  )
}
