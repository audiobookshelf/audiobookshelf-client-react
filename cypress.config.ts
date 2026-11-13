import { defineConfig } from 'cypress'
import path from 'path'

export default defineConfig({
  // Cypress.env() hydrates every env value into the browser. This suite does not use it.
  allowCypressEnv: false,
  component: {
    specPattern: 'cypress/tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.tsx',
    devServer: {
      framework: 'next',
      bundler: 'webpack',
      webpackConfig: {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'src')
          }
        },
        module: {
          rules: [
            {
              test: path.resolve(__dirname, 'src/app/(main)/settings/users/UsersTable.tsx'),
              // Keep this component's server action out of the browser test bundle.
              resolve: {
                alias: {
                  './actions$': path.resolve(__dirname, 'cypress/support/stubs/userActions.ts')
                }
              }
            }
          ]
        }
      }
    },
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.path?.includes('BraveSoftware')) {
          launchOptions.args.push('--no-first-run')
          launchOptions.args.push('--no-default-browser-check')
          launchOptions.args.push('--profile-directory=Default')
        }
        return launchOptions
      })
    }
  }
})
