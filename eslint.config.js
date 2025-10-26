const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname
})

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
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      }
    }
  }
]
