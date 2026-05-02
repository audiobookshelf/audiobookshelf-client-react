const nextConfig = require('eslint-config-next')
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals')
const prettierConfig = require('eslint-config-prettier')

// React Compiler rules introduced in eslint-config-next@16 that are not yet
// enforced in this codebase. Disable them to maintain the pre-upgrade lint
// baseline; address them in a follow-up PR.
const reactCompilerRulesOff = {
  'react-hooks/static-components': 'off',
  'react-hooks/use-memo': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
  'react-hooks/immutability': 'off',
  'react-hooks/globals': 'off',
  'react-hooks/refs': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-hooks/error-boundaries': 'off',
  'react-hooks/purity': 'off',
  'react-hooks/set-state-in-render': 'off',
  'react-hooks/unsupported-syntax': 'off',
  'react-hooks/config': 'off',
  'react-hooks/gating': 'off'
}

module.exports = [
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
      'next-env.d.ts',
      'eslint.config.js'
    ]
  },
  ...nextConfig,
  ...nextCoreWebVitals,
  prettierConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      }
    }
  },
  // Disable React Compiler rules introduced in eslint-config-next@16
  {
    rules: reactCompilerRulesOff
  }
]
