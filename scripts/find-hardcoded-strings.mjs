/**
 * Finds hardcoded user-facing strings in src/ that should use t('MessageId').
 *
 * Uses the TypeScript AST for accurate line/column reporting and suggests
 * matching keys from en-us.json when the literal equals a known translation value.
 *
 * Known limitations:
 * - Cannot detect dynamically built strings ('Error ' + status)
 * - May miss strings in template literals with expressions
 * - languages.ts native language names are excluded via path allowlist
 * - Some findings will be false positives — use // i18n-ignore on the line
 */
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultScanPath = path.join(repoRoot, 'src')
const enUsPath = path.join(repoRoot, 'src', 'locales', 'en-us.json')

const USER_FACING_PROPS = new Set([
  'label',
  'title',
  'placeholder',
  'message',
  'yesButtonText',
  'noButtonText',
  'header',
  'description',
  'text',
  'successToast',
  'errorToast',
  'tooltip',
  'help'
])

const USER_FACING_JSX_ATTRS = new Set(['aria-label', 'placeholder', 'title', 'alt', 'label'])

const SKIP_JSX_ATTRS = new Set(['className', 'href', 'src', 'type', 'id', 'key', 'role', 'name', 'value', 'htmlFor', 'for'])

const ENUM_VALUES = new Set(['admin', 'user', 'guest', 'error', 'success', 'info', 'warning'])

const EXCLUDED_PATH_FRAGMENTS = [
  `${path.sep}locales${path.sep}`,
  `${path.sep}types${path.sep}translations.ts`,
  `${path.sep}cypress${path.sep}`,
  `${path.sep}lib${path.sep}languages.ts`
]

const CATALOG_PATH_FRAGMENT = `${path.sep}components_catalog${path.sep}`

function parseArgs(argv) {
  const options = {
    scanPath: defaultScanPath,
    includeCatalog: false,
    json: false,
    minLength: 2
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--path') {
      const value = argv[++i]
      if (!value) {
        throw new Error('Missing value for --path')
      }
      options.scanPath = path.isAbsolute(value) ? value : path.join(repoRoot, value)
    } else if (arg === '--include-catalog') {
      options.includeCatalog = true
    } else if (arg === '--json') {
      options.json = true
    } else if (arg === '--min-length') {
      const value = argv[++i]
      if (!value) {
        throw new Error('Missing value for --min-length')
      }
      options.minLength = Number(value)
      if (Number.isNaN(options.minLength) || options.minLength < 0) {
        throw new Error('--min-length must be a non-negative number')
      }
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function printHelp() {
  console.log(`Usage: node scripts/find-hardcoded-strings.mjs [options]

Find hardcoded user-facing strings that should use t('MessageId').

Options:
  --path <file-or-dir>   Limit scan (default: src)
  --include-catalog      Include components_catalog examples
  --json                 Also print machine-readable JSON to stdout
  --min-length <n>       Ignore very short strings (default: 2)
  -h, --help             Show this help
`)
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildReverseLookup(messages) {
  const valueToKeys = new Map()

  for (const [key, value] of Object.entries(messages)) {
    if (typeof value !== 'string') {
      continue
    }

    const existing = valueToKeys.get(value)
    if (existing) {
      existing.push(key)
    } else {
      valueToKeys.set(value, [key])
    }
  }

  return valueToKeys
}

function collectFiles(scanPath) {
  const stat = fs.statSync(scanPath)
  if (stat.isFile()) {
    return [scanPath]
  }

  const files = []

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }

  walk(scanPath)
  return files
}

function shouldExcludeFile(filePath, includeCatalog) {
  const normalized = filePath.split(path.sep).join(path.sep)

  if (normalized.endsWith('.cy.tsx')) {
    return true
  }

  for (const fragment of EXCLUDED_PATH_FRAGMENTS) {
    if (normalized.includes(fragment)) {
      return true
    }
  }

  if (!includeCatalog && normalized.includes(CATALOG_PATH_FRAGMENT)) {
    return true
  }

  return false
}

function getNodeText(node, sourceFile) {
  return node.getText(sourceFile).slice(1, -1)
}

function unescapeStringLiteral(text) {
  return text.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

function isTechnicalString(value) {
  if (!value || !/[a-zA-Z]/.test(value)) {
    return true
  }

  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return true
  }

  if (value.startsWith('@/') || value.startsWith('./') || value.startsWith('../')) {
    return true
  }

  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
    return true
  }

  if (/^[\w-]+$/.test(value) && value === value.toLowerCase() && !ENUM_VALUES.has(value)) {
    return true
  }

  if (/^[\w./-]+$/.test(value) && !value.includes(' ')) {
    if (value.includes('.') || value.includes('/') || /^[a-z]+-[a-z]/.test(value)) {
      return true
    }
  }

  return false
}

function looksUserFacing(value, minLength) {
  if (value.length < minLength) {
    return false
  }

  if (ENUM_VALUES.has(value)) {
    return false
  }

  if (/^&[a-z#0-9]+;$/i.test(value)) {
    return false
  }

  if (isTechnicalString(value)) {
    return false
  }

  if (value.includes(' ')) {
    return true
  }

  if (/^[A-Z]/.test(value)) {
    return true
  }

  if (value.length >= 3 && /[a-zA-Z]/.test(value)) {
    return true
  }

  return false
}

function isInsideTranslationCall(node) {
  let current = node.parent
  while (current) {
    if (ts.isCallExpression(current)) {
      const expr = current.expression
      if (ts.isIdentifier(expr) && expr.text === 't') {
        return true
      }
      if (ts.isPropertyAccessExpression(expr) && expr.name.text === 'rich' && ts.isIdentifier(expr.expression) && expr.expression.text === 't') {
        return true
      }
    }
    current = current.parent
  }
  return false
}

function isInsideConsoleCall(node) {
  let current = node.parent
  while (current) {
    if (ts.isCallExpression(current)) {
      const expr = current.expression
      if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'console') {
        return true
      }
    }
    current = current.parent
  }
  return false
}

function isImportOrExport(node) {
  let current = node.parent
  while (current) {
    if (ts.isImportDeclaration(current) || ts.isExportDeclaration(current) || ts.isImportSpecifier(current) || ts.isExportSpecifier(current)) {
      return true
    }
    current = current.parent
  }
  return false
}

function hasI18nIgnore(sourceFile, node) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  const lineStart = sourceFile.getPositionOfLineAndCharacter(line, 0)
  const nextLineStart = sourceFile.getPositionOfLineAndCharacter(line + 1, 0)
  const lineText = sourceFile.text.slice(lineStart, nextLineStart)
  return lineText.includes('// i18n-ignore')
}

function getPropertyNameText(nameNode) {
  if (!nameNode) {
    return null
  }
  if (ts.isIdentifier(nameNode)) {
    return nameNode.text
  }
  if (ts.isStringLiteral(nameNode)) {
    return nameNode.text
  }
  if (ts.isComputedPropertyName(nameNode) && ts.isStringLiteral(nameNode.expression)) {
    return nameNode.expression.text
  }
  return null
}

function getJsxAttributeNameText(nameNode) {
  if (ts.isIdentifier(nameNode)) {
    return nameNode.text
  }
  if (ts.isJsxNamespacedName(nameNode)) {
    return `${nameNode.namespace.text}:${nameNode.name.text}`
  }
  return null
}

function isShowToastFirstArg(node) {
  const parent = node.parent
  if (!parent || !ts.isCallExpression(parent)) {
    return false
  }

  const expr = parent.expression
  if (!ts.isIdentifier(expr) || expr.text !== 'showToast') {
    return false
  }

  return parent.arguments[0] === node
}

function getContextLabel(node, sourceFile) {
  const parent = node.parent

  if (parent && ts.isPropertyAssignment(parent)) {
    const propName = getPropertyNameText(parent.name)
    if (propName) {
      return `${propName}: '${getNodeText(node, sourceFile)}'`
    }
  }

  if (parent && ts.isJsxAttribute(parent)) {
    const attrName = getJsxAttributeNameText(parent.name)
    if (attrName) {
      return `${attrName}: '${getNodeText(node, sourceFile)}'`
    }
  }

  if (parent && ts.isJsxText(parent)) {
    return `JSX text: '${node.text.trim()}'`
  }

  if (isShowToastFirstArg(node)) {
    return `showToast: '${getNodeText(node, sourceFile)}'`
  }

  return `'${getNodeText(node, sourceFile)}'`
}

function shouldFlagString(node, sourceFile, value, minLength) {
  if (!ts.isStringLiteral(node)) {
    return false
  }

  if (isInsideTranslationCall(node) || isInsideConsoleCall(node) || isImportOrExport(node)) {
    return false
  }

  if (hasI18nIgnore(sourceFile, node)) {
    return false
  }

  if (!looksUserFacing(value, minLength)) {
    return false
  }

  const parent = node.parent

  if (parent && ts.isPropertyAssignment(parent)) {
    const propName = getPropertyNameText(parent.name)
    if (propName && USER_FACING_PROPS.has(propName)) {
      return true
    }
  }

  if (parent && ts.isJsxAttribute(parent)) {
    const attrName = getJsxAttributeNameText(parent.name)
    if (attrName && USER_FACING_JSX_ATTRS.has(attrName)) {
      return true
    }
    if (attrName && SKIP_JSX_ATTRS.has(attrName)) {
      return false
    }
  }

  if (parent && ts.isJsxText(parent)) {
    const trimmed = node.text.trim()
    return trimmed.length > 0 && looksUserFacing(trimmed, minLength)
  }

  if (isShowToastFirstArg(node)) {
    return true
  }

  return false
}

function scanFile(filePath, valueToKeys, minLength) {
  const sourceText = fs.readFileSync(filePath, 'utf8')
  const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind)
  const findings = []

  function visit(node) {
    if (ts.isStringLiteral(node)) {
      const raw = getNodeText(node, sourceFile)
      const value = unescapeStringLiteral(raw)

      if (shouldFlagString(node, sourceFile, value, minLength)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
        const suggestedKeys = valueToKeys.get(value) || []

        findings.push({
          file: path.relative(repoRoot, filePath).split(path.sep).join('/'),
          line: line + 1,
          column: character + 1,
          value,
          context: getContextLabel(node, sourceFile),
          suggestedKeys
        })
      }
    }

    if (ts.isJsxText(node)) {
      const trimmed = node.text.trim()
      if (trimmed && looksUserFacing(trimmed, minLength) && !hasI18nIgnore(sourceFile, node)) {
        const parent = node.parent
        if (parent && ts.isJsxElement(parent)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          const suggestedKeys = valueToKeys.get(trimmed) || []

          findings.push({
            file: path.relative(repoRoot, filePath).split(path.sep).join('/'),
            line: line + 1,
            column: character + 1,
            value: trimmed,
            context: `JSX text: '${trimmed}'`,
            suggestedKeys
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return findings
}

function formatSuggestion(suggestedKeys) {
  if (suggestedKeys.length === 0) {
    return '(no matching key)'
  }
  if (suggestedKeys.length === 1) {
    return `→ ${suggestedKeys[0]}`
  }
  return `→ ${suggestedKeys.join(' | ')}`
}

function printReport(findings) {
  const byFile = new Map()
  for (const finding of findings) {
    if (!byFile.has(finding.file)) {
      byFile.set(finding.file, [])
    }
    byFile.get(finding.file).push(finding)
  }

  const fileCount = byFile.size
  console.log(`\nfind-hardcoded-strings — ${findings.length} findings in ${fileCount} files\n`)

  for (const [file, fileFindings] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(file)
    for (const finding of fileFindings) {
      const location = `${finding.line}:${finding.column}`.padEnd(8)
      const context = finding.context.padEnd(40)
      console.log(`  ${location} ${context} ${formatSuggestion(finding.suggestedKeys)}`)
    }
    console.log()
  }

  const withKeys = findings.filter((f) => f.suggestedKeys.length > 0).length
  const withoutKeys = findings.length - withKeys
  console.log(`Summary: ${findings.length} findings | ${withKeys} with suggested keys | ${withoutKeys} need new keys`)
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const valueToKeys = buildReverseLookup(loadJson(enUsPath))
  const files = collectFiles(options.scanPath).filter((file) => !shouldExcludeFile(file, options.includeCatalog))

  const findings = []
  for (const file of files) {
    findings.push(...scanFile(file, valueToKeys, options.minLength))
  }

  findings.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }
    if (a.line !== b.line) {
      return a.line - b.line
    }
    return a.column - b.column
  })

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          findings,
          summary: {
            total: findings.length,
            withSuggestedKeys: findings.filter((f) => f.suggestedKeys.length > 0).length,
            needNewKeys: findings.filter((f) => f.suggestedKeys.length === 0).length,
            fileCount: new Set(findings.map((f) => f.file)).size
          }
        },
        null,
        2
      )
    )
  } else {
    printReport(findings)
  }

  process.exit(findings.length > 0 ? 1 : 0)
}

main()
