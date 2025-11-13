import { defineConfig } from 'cypress'
import path from 'path'

export default defineConfig({
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
        }
      }
    }
  }
})
