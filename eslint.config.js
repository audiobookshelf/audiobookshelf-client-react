const nextConfig = require('eslint-config-next/core-web-vitals')
const nextTypescript = require('eslint-config-next/typescript')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
  ...nextConfig,
  ...nextTypescript,
  prettierConfig,
  {
    ignores: [
      'node_modules/',
      '.next/',
      'dist/',
      'build/',
      'out/',
      'coverage/',
      'cypress/screenshots/',
      'cypress/videos/',
      '.eslintcache',
      'eslint.config.js',
      'next-env.d.ts',
      'public/vendor/'
    ]
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      // New in eslint-plugin-react-hooks v7; disable until codebase is migrated
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off'
    }
  }
]
