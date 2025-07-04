'use client'

import { useState } from 'react'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import LoadingIndicator from '@/components/LoadingIndicator'
import IconBtn from '@/components/ui/IconBtn'

export default function ComponentsCatalogPage() {
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [checkboxValue2, setCheckboxValue2] = useState(true)
  const [checkboxValue3, setCheckboxValue3] = useState(false)

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Components Catalog</h1>
        <p className="text-gray-300 mb-6">
          This page showcases all the available UI components in the audiobookshelf client.
        </p>
      </div>

      {/* Button Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Button Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Primary Button</h3>
            <Btn>Primary Button</Btn>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Small Button</h3>
            <Btn small>Small Button</Btn>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Button</h3>
            <Btn loading>Loading...</Btn>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Small Loading Button</h3>
            <Btn small loading>Loading...</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Button</h3>
            <Btn disabled>Disabled Button</Btn>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Button with Progress</h3>
            <Btn loading progress="75%">Uploading...</Btn>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Link Button</h3>
            <Btn to="/settings">Go to Settings</Btn>
          </div>
        </div>
      </section>

      {/* Icon Button Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Icon Button Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Icon Button</h3>
            <IconBtn icon="&#xe3c9;" ariaLabel="Edit" />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Outlined Icon Button</h3>
            <IconBtn icon="&#xe5ca;" outlined ariaLabel="Close" />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Borderless Icon Button</h3>
            <IconBtn icon="&#xe3c9;" borderless ariaLabel="Edit" />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Icon Button</h3>
            <IconBtn icon="&#xe3c9;" loading ariaLabel="Loading" />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Icon Button</h3>
            <IconBtn icon="&#xe3c9;" disabled ariaLabel="Edit" />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Size Icon Button</h3>
            <IconBtn icon="&#xe3c9;" size={12} ariaLabel="Large Edit" />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Color Icon Button</h3>
            <IconBtn icon="&#xe5ca;" bgColor="bg-red-500" ariaLabel="Delete" />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Font Size Icon Button</h3>
            <IconBtn icon="&#xe3c9;" iconFontSize="2rem" ariaLabel="Large Edit" />
          </div>
        </div>
      </section>

      {/* Checkbox Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Checkbox Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Checkbox</h3>
            <Checkbox 
              value={checkboxValue} 
              onChange={setCheckboxValue}
              label="Default checkbox"
            />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Checked Checkbox</h3>
            <Checkbox 
              value={checkboxValue2} 
              onChange={setCheckboxValue2}
              label="Checked checkbox"
            />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Small Checkbox</h3>
            <Checkbox 
              value={checkboxValue3} 
              onChange={setCheckboxValue3}
              label="Small checkbox"
              small
            />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Medium Checkbox</h3>
            <Checkbox 
              value={false}
              label="Medium checkbox"
              medium
            />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Checkbox</h3>
            <Checkbox 
              value={true}
              label="Disabled checkbox"
              disabled
            />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Partial Checkbox</h3>
            <Checkbox 
              value={false}
              label="Partial checkbox"
              partial
            />
          </div>
        </div>
      </section>

      {/* Loading Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Loading Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Indicator</h3>
            <LoadingIndicator />
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Interactive Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Button Interactions</h3>
            <div className="flex items-center gap-4">
              <Btn onClick={() => alert('Button clicked!')}>
                Click me!
              </Btn>
              <Btn onClick={() => alert('Form submitted!')} type="submit">
                Submit Form
              </Btn>
              <Btn to="/settings" color="bg-blue-600">
                Navigate to Settings
              </Btn>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Icon Button Interactions</h3>
            <div className="flex items-center gap-4">
              <IconBtn 
                icon="&#xe3c9;" 
                onClick={() => alert('Edit clicked!')}
                ariaLabel="Edit"
              />
              <IconBtn 
                icon="&#xe5ca;" 
                onClick={() => alert('Close clicked!')}
                ariaLabel="Close"
                bgColor="bg-red-500"
              />
              <IconBtn 
                icon="&#xe3c9;" 
                onClick={() => alert('Close clicked!')}
                ariaLabel="Close"
              />
              <IconBtn 
                icon="&#xe3c9;" 
                onClick={() => alert('Loading clicked!')}
                loading
                ariaLabel="Loading"
              />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Checkbox Interactions</h3>
            <div className="space-y-4">
              <Checkbox 
                value={checkboxValue} 
                onChange={setCheckboxValue}
                label="Accept terms and conditions"
              />
              <Checkbox 
                value={checkboxValue2} 
                onChange={setCheckboxValue2}
                label="Subscribe to newsletter"
              />
              <Checkbox 
                value={checkboxValue3} 
                onChange={setCheckboxValue3}
                label="Enable notifications"
                small
              />
            </div>
          </div>
        </div>
      </section>

      {/* Component Information */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Available Components</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">React Components</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li><code className="bg-gray-700 px-2 py-1 rounded">Btn.tsx</code> - Button component with various states (loading, disabled, small, link)</li>
            <li><code className="bg-gray-700 px-2 py-1 rounded">IconBtn.tsx</code> - Icon button component with material symbols, loading states, and customization options</li>
            <li><code className="bg-gray-700 px-2 py-1 rounded">Checkbox.tsx</code> - Checkbox component with different sizes and states</li>
            <li><code className="bg-gray-700 px-2 py-1 rounded">LoadingIndicator.tsx</code> - Loading spinner component with animated dots</li>
          </ul>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Usage Guidelines</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">React Components</h3>
          <div className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">Btn Component</h4>
              <p className="mb-2">Import: <code className="bg-gray-700 px-2 py-1 rounded">import Btn from '@/components/ui/Btn'</code></p>
              <p className="mb-2">Props: <code className="bg-gray-700 px-2 py-1 rounded">color</code>, <code className="bg-gray-700 px-2 py-1 rounded">small</code>, <code className="bg-gray-700 px-2 py-1 rounded">loading</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">to</code> (for navigation)</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">IconBtn Component</h4>
              <p className="mb-2">Import: <code className="bg-gray-700 px-2 py-1 rounded">import IconBtn from '@/components/ui/IconBtn'</code></p>
              <p className="mb-2">Props: <code className="bg-gray-700 px-2 py-1 rounded">icon</code>, <code className="bg-gray-700 px-2 py-1 rounded">bgColor</code>, <code className="bg-gray-700 px-2 py-1 rounded">outlined</code>, <code className="bg-gray-700 px-2 py-1 rounded">borderless</code>, <code className="bg-gray-700 px-2 py-1 rounded">loading</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">size</code>, <code className="bg-gray-700 px-2 py-1 rounded">iconFontSize</code>, <code className="bg-gray-700 px-2 py-1 rounded">ariaLabel</code></p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Checkbox Component</h4>
              <p className="mb-2">Import: <code className="bg-gray-700 px-2 py-1 rounded">import Checkbox from '@/components/ui/Checkbox'</code></p>
              <p className="mb-2">Props: <code className="bg-gray-700 px-2 py-1 rounded">value</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">small</code>, <code className="bg-gray-700 px-2 py-1 rounded">medium</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">partial</code></p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">LoadingIndicator Component</h4>
              <p className="mb-2">Import: <code className="bg-gray-700 px-2 py-1 rounded">import LoadingIndicator from '@/components/LoadingIndicator'</code></p>
              <p className="mb-2">No props required - displays animated loading dots</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 