const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname
})

module.exports = [
  ...compat.extends('next/core-web-vitals', 'prettier'),
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  }
]
