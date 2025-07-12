import type { Preview } from '@storybook/nextjs-vite'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    // Dark theme for Docs
    docs: {
      theme: {
        colorPrimary: '#232323',
        colorSecondary: '#666666',

        // UI
        appBg: '#373838',
        appContentBg: '#373838',
        appBorderColor: '#555555',
        appBorderRadius: 4,

        // Text colors
        textColor: '#ededed',
        textInverseColor: '#373838',

        // Bar colors
        barTextColor: '#ededed',
        barSelectedColor: '#1ad691',
        barBg: '#2d3436',

        // Form colors
        inputBg: '#444444',
        inputBorder: '#555555',
        inputTextColor: '#ededed',
        inputBorderRadius: 4,

        // Button colors
        buttonBg: '#444444',
        buttonBorder: '#555555',
        booleanBg: '#444444',
        booleanSelectedBg: '#1ad691',

        // Code colors
        codeBg: '#2d3436',
        codeTextColor: '#ededed',

        // Grid colors
        gridCellSize: 20,
        gridColor: '#555555'
      }
    },

    // Dark theme for Canvas as well
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#373838'
        },
        {
          name: 'light',
          value: '#ffffff'
        }
      ]
    }
  }
}

export default preview
