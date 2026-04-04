import { AdvancedModalExamples } from '../examples/AdvancedModalExamples'
import { ConfirmDialogExamples } from '../examples/ConfirmDialogExamples'
import { ModalExamples } from '../examples/ModalExamples'

export default function ModalComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Modal Components</h1>
        <p className="mb-6 text-gray-300">This page showcases all the modal components available in the audiobookshelf client.</p>
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
              <a href="#modal-examples" className="transition-colors hover:text-blue-400">
                Basic Modals
              </a>
            </li>
            <li>
              <a href="#advanced-modal-examples" className="transition-colors hover:text-blue-400">
                Advanced Modal Examples
              </a>
            </li>
            <li>
              <a href="#confirm-dialog-examples" className="transition-colors hover:text-blue-400">
                Confirm Dialog
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="modal-examples">
        <ModalExamples />
      </div>
      <div id="advanced-modal-examples">
        <AdvancedModalExamples />
      </div>
      <div id="confirm-dialog-examples">
        <ConfirmDialogExamples />
      </div>
    </div>
  )
}
