// ***********************************************************
// This example support/component.tsx is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
import 'cypress-plugin-tab'

// Import commands.js using ES2015 syntax:
import '@/assets/globals.css'
import messages from '@/locales/en-us.json'
import { mount } from 'cypress/react'
import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'
import './commands'

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

// Custom mount command that wraps components with necessary providers
Cypress.Commands.add('mount', (component: ReactNode, options = {}) => {
  const wrapped = (
    <NextIntlClientProvider locale="en-us" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )

  return mount(wrapped, options)
})

// Example use:
// cy.mount(<MyComponent />)
