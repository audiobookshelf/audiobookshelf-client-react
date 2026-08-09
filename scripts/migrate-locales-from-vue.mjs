/**
 * Migrates non-English locale files from the Vue client strings directory into React locales.
 *
 * Vue strings are fetched from advplyr/audiobookshelf on GitHub.
 *
 * Only copies keys whose English value is identical in both Vue and React en-us.json.
 * All other keys are omitted (Weblate contributors will add them against React en-us).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultReactLocalesDir = path.join(repoRoot, 'src', 'locales')
const vueStringsGithub = {
  owner: 'advplyr',
  repo: 'audiobookshelf',
  ref: 'master',
  path: 'client/strings'
}
const githubApiBase = 'https://api.github.com'
const githubRawBase = 'https://raw.githubusercontent.com'

function parseArgs(argv) {
  const options = {
    dryRun: false,
    locale: null,
    reactLocalesDir: defaultReactLocalesDir
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--locale') {
      options.locale = argv[++i]
      if (!options.locale) {
        throw new Error('Missing value for --locale')
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
  console.log(`Usage: node scripts/migrate-locales-from-vue.mjs [options]

Options:
  --dry-run              Print stats only; do not write files
  --locale <code>        Process a single locale (e.g. pl)
  -h, --help             Show this help
`)
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

function parseJson(raw, label) {
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}: ${error.message}`)
  }
}

async function fetchText(url, label) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${label}: ${url}`)
  }

  return response.text()
}

async function fetchJson(url, label) {
  const raw = await fetchText(url, label)
  return parseJson(raw, label)
}

function githubRawUrl(github, filename) {
  return `${githubRawBase}/${github.owner}/${github.repo}/${github.ref}/${github.path}/${filename}`
}

function createGithubVueStringsSource(github) {
  const directoryUrl = `${githubApiBase}/repos/${github.owner}/${github.repo}/contents/${github.path}?ref=${encodeURIComponent(github.ref)}`
  const label = `${github.owner}/${github.repo}@${github.ref}:${github.path}`

  return {
    label,
    async loadEnUs() {
      const url = githubRawUrl(github, 'en-us.json')
      const raw = await fetchText(url, 'Vue en-us.json')
      return parseJson(raw, 'Vue en-us.json')
    },
    async listLocales() {
      const entries = await fetchJson(directoryUrl, `Vue strings directory (${label})`)
      if (!Array.isArray(entries)) {
        throw new Error(`Unexpected GitHub directory response for ${label}`)
      }

      return entries
        .filter((entry) => entry.type === 'file' && entry.name.endsWith('.json') && entry.name !== 'en-us.json')
        .map((entry) => entry.name.replace(/\.json$/, ''))
        .sort()
    },
    async loadLocale(locale) {
      const url = githubRawUrl(github, `${locale}.json`)
      try {
        const raw = await fetchText(url, `${locale}.json`)
        return parseJson(raw, `${locale}.json`)
      } catch (error) {
        if (String(error.message).includes('HTTP 404')) {
          return null
        }

        throw error
      }
    }
  }
}

const normBr = (s) => s.replace(/<br\s*\/?>\s*(?:<\/br>)?/gi, '\n')

function getCopyableKeys(reactEn, vueEn) {
  const keys = []
  for (const key of Object.keys(reactEn)) {
    if (key in vueEn && (reactEn[key] === vueEn[key] || normBr(reactEn[key]) === normBr(vueEn[key]))) {
      keys.push(key)
    }
  }
  return keys.sort()
}

function buildLocaleFile(vueLocale, copyableKeys) {
  const out = {}
  for (const key of copyableKeys) {
    if (key in vueLocale) {
      out[key] = vueLocale[key].replace(/<br\s*\/?>\s*(?:<\/br>)?/gi, '<br></br>')
    }
  }
  return out
}

function formatLocaleJson(obj) {
  return `${JSON.stringify(obj, null, 2)}\n`
}

function analyzeEnUs(reactEn, vueEn) {
  const reactKeys = new Set(Object.keys(reactEn))
  const vueKeys = new Set(Object.keys(vueEn))
  const onlyInReact = []
  const onlyInVue = []
  const differing = []

  for (const key of reactKeys) {
    if (!vueKeys.has(key)) {
      onlyInReact.push(key)
    } else if (reactEn[key] !== vueEn[key]) {
      differing.push(key)
    }
  }

  for (const key of vueKeys) {
    if (!reactKeys.has(key)) {
      onlyInVue.push(key)
    }
  }

  onlyInReact.sort()
  onlyInVue.sort()
  differing.sort()

  return { onlyInReact, onlyInVue, differing }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const vueStringsSource = createGithubVueStringsSource(vueStringsGithub)
  const reactEnPath = path.join(options.reactLocalesDir, 'en-us.json')

  if (!fs.existsSync(reactEnPath)) {
    console.error(`[migrate-locales] React en-us not found: ${reactEnPath}`)
    process.exit(1)
  }

  const reactEn = loadJson(reactEnPath)
  const vueEn = await vueStringsSource.loadEnUs()
  const copyableKeys = getCopyableKeys(reactEn, vueEn)
  const analysis = analyzeEnUs(reactEn, vueEn)

  console.log('[migrate-locales] Vue strings source')
  console.log(`  ${vueStringsSource.label}`)
  console.log('[migrate-locales] English baseline comparison')
  console.log(`  React en-us keys: ${Object.keys(reactEn).length}`)
  console.log(`  Vue en-us keys:   ${Object.keys(vueEn).length}`)
  console.log(`  Copyable keys:    ${copyableKeys.length}`)
  console.log(`  Only in React:    ${analysis.onlyInReact.length}`)
  console.log(`  Only in Vue:      ${analysis.onlyInVue.length}`)
  console.log(`  Different values: ${analysis.differing.length}`)

  let locales = await vueStringsSource.listLocales()
  if (options.locale) {
    if (!locales.includes(options.locale)) {
      console.error(`[migrate-locales] Locale not found in Vue strings: ${options.locale}`)
      process.exit(1)
    }
    locales = [options.locale]
  }

  if (!fs.existsSync(options.reactLocalesDir)) {
    fs.mkdirSync(options.reactLocalesDir, { recursive: true })
  }

  console.log(`\n[migrate-locales] ${options.dryRun ? 'Would write' : 'Writing'} ${locales.length} locale file(s)`)

  let totalWritten = 0
  for (const locale of locales) {
    const reactLocalePath = path.join(options.reactLocalesDir, `${locale}.json`)
    const vueLocale = await vueStringsSource.loadLocale(locale)

    if (!vueLocale) {
      console.warn(`  ${locale}: skipped (Vue file missing)`)
      continue
    }

    const localeFile = buildLocaleFile(vueLocale, copyableKeys)
    const keyCount = Object.keys(localeFile).length
    const action = options.dryRun ? 'would write' : 'wrote'

    if (keyCount === 0) {
      console.log(`  ${locale}: ${action} empty file`)
    } else {
      console.log(`  ${locale}: ${action} ${keyCount} keys`)
    }

    if (!options.dryRun) {
      fs.writeFileSync(reactLocalePath, formatLocaleJson(localeFile), 'utf8')
    }

    totalWritten += keyCount
  }

  console.log(`\n[migrate-locales] Done. ${options.dryRun ? 'Would write' : 'Wrote'} ${totalWritten} translation entries across ${locales.length} locale(s).`)
}

try {
  await main()
} catch (error) {
  console.error(`[migrate-locales] ${error.message}`)
  process.exit(1)
}
