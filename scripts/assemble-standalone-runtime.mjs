/**
 * Assemble the directory a server release ships beside the executable.
 *
 * `next build` with `output: 'standalone'` writes `.next/standalone` (traced
 * node_modules and a standalone `server.js`) and leaves out the browser assets,
 * public files, and the config that rewrites the base path at startup. This
 * copies the runtime files in (omitting `server.js` since Audiobookshelf starts
 * Next itself), transpiles `next.config.ts` and `scripts/rewriteBuildBasePath.ts`
 * to `.mjs` (so runtime startup loads plain JS via Node instead of invoking
 * SWC or downloading `@next/swc-*`), and writes `dist/client-react`.
 *
 * One archive is used on every platform. A `.node` file is a native addon for
 * the machine that built it, so the script refuses to finish if it finds one.
 * Next traces `sharp` because the image optimizer requires it, but this app
 * does not use that optimizer (the server resizes covers with ffmpeg). Those
 * packages are omitted before the native-addon check.
 *
 * pnpm keeps dependencies under `.pnpm/` behind symlinks/junctions. Extracting
 * symlinks across OSes is fragile, so traced packages are flattened into a
 * regular `node_modules/` tree with no symlinks.
 *
 * Keep `BASE_PATH_PLACEHOLDER` in sync with `src/lib/basePath.ts`.
 */
import fs from 'fs'
import { createRequire } from 'node:module'
import path from 'path'
import ts from 'typescript'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const standaloneDir = path.join(root, '.next', 'standalone')
const outputDir = path.join(root, 'dist', 'client-react')

/** Keep in sync with `src/lib/basePath.ts`. */
const BASE_PATH_PLACEHOLDER = '/__ABS_BASE_PATH__'

const TEXT_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.json', '.html', '.rsc', '.txt', '.css'])

/**
 * Copy `source` onto `destination`, following symlinks and junctions.
 * `fs.cpSync({ dereference: true })` still leaves directory symlinks in place
 * on Linux, and those point into the pnpm store that this archive does not ship.
 */
function copyInto(source, destination) {
  const stat = fs.lstatSync(source)
  if (stat.isSymbolicLink()) {
    copyInto(fs.realpathSync(source), destination)
    return
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true })
    for (const entry of fs.readdirSync(source)) {
      copyInto(path.join(source, entry), path.join(destination, entry))
    }
    return
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
}

function transpileTsToMjs(sourcePath, destinationPath, transformSource) {
  const tsSource = fs.readFileSync(sourcePath, 'utf8')
  const { outputText, diagnostics } = ts.transpileModule(tsSource, {
    fileName: path.basename(sourcePath),
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      removeComments: false
    }
  })
  if (diagnostics?.length) {
    const formatted = diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n')
    throw new Error(`Failed to transpile ${sourcePath}:\n${formatted}`)
  }
  const outputSource = transformSource ? transformSource(outputText) : outputText
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
  fs.writeFileSync(destinationPath, outputSource)
}

function isIgnoredRuntimePackage(packageName) {
  // Next's image optimizer traces sharp. This app never calls it.
  return packageName === 'sharp' || packageName === '@img' || packageName.startsWith('@img/')
}

function walkFiles(directory) {
  const found = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      found.push(...walkFiles(entryPath))
      continue
    }
    if (entry.isFile()) found.push(entryPath)
  }
  return found
}

function assertNoSymlinks(directory) {
  const stack = [directory]
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current)) {
      const entryPath = path.join(current, entry)
      const stat = fs.lstatSync(entryPath)
      if (stat.isSymbolicLink()) {
        throw new Error(`Unexpected symlink in runtime directory: ${path.relative(directory, entryPath)}`)
      }
      if (stat.isDirectory()) {
        stack.push(entryPath)
      }
    }
  }
}

/** List `{ name, fullPath }` package entries inside one `node_modules` folder. */
function readPackageEntries(modulesDir) {
  if (!fs.existsSync(modulesDir)) return []
  const packages = []
  for (const entry of fs.readdirSync(modulesDir)) {
    if (entry === '.pnpm' || entry.startsWith('.')) continue
    const entryPath = path.join(modulesDir, entry)
    if (entry.startsWith('@')) {
      for (const scoped of fs.readdirSync(entryPath)) {
        if (scoped.startsWith('.')) continue
        packages.push({ name: `${entry}/${scoped}`, fullPath: path.join(entryPath, scoped) })
      }
      continue
    }
    packages.push({ name: entry, fullPath: entryPath })
  }
  return packages
}

function isRealDirectory(filePath) {
  const stat = fs.lstatSync(filePath)
  return !stat.isSymbolicLink() && stat.isDirectory()
}

/**
 * Flatten standalone `node_modules` into `destModules` without `.pnpm` or symlinks.
 * Walks reachable packages from direct top-level dependencies and `.next/node_modules`
 * (skipping ignored packages such as `sharp` and their exclusive transitive deps).
 * Direct top-level packages win the root slot; any conflicting version of a
 * transitive dependency is nested under the consumer package that requested it.
 */
function flattenStandaloneNodeModules(sourceModules, destModules, extraModulesDir) {
  fs.mkdirSync(destModules, { recursive: true })
  const pnpmDir = path.join(sourceModules, '.pnpm')

  if (!fs.existsSync(pnpmDir)) {
    for (const pkg of readPackageEntries(sourceModules)) {
      if (isIgnoredRuntimePackage(pkg.name)) continue
      copyInto(pkg.fullPath, path.join(destModules, ...pkg.name.split('/')))
    }
    return
  }

  /** @type {Map<string, string>} realPath -> package destination in destModules */
  const placedPaths = new Map()
  /** @type {Map<string, string>} packageName -> realPath placed at top level */
  const topLevelRealPaths = new Map()

  function copyPackageToTopLevel(pkgName, realPath) {
    const dest = path.join(destModules, ...pkgName.split('/'))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    copyInto(realPath, dest)
    topLevelRealPaths.set(pkgName, realPath)
    placedPaths.set(realPath, dest)
  }

  // Index every store directory by the real package path(s) it owns and their dependency links.
  /** @type {Map<string, { name: string, linked: Array<{ name: string, realPath: string }> }>} */
  const storeByRealPath = new Map()
  for (const dirName of fs.readdirSync(pnpmDir)) {
    if (dirName === 'node_modules' || dirName.startsWith('sharp@') || dirName.startsWith('@img+')) continue
    const storeModulesDir = path.join(pnpmDir, dirName, 'node_modules')
    if (!fs.existsSync(storeModulesDir)) continue

    const entries = readPackageEntries(storeModulesDir)
    const owned = entries.filter((pkg) => !isIgnoredRuntimePackage(pkg.name) && isRealDirectory(pkg.fullPath))
    const linked = entries
      .filter((pkg) => !isIgnoredRuntimePackage(pkg.name) && !isRealDirectory(pkg.fullPath))
      .map((pkg) => ({ name: pkg.name, realPath: fs.realpathSync(pkg.fullPath) }))

    for (const pkg of owned) {
      storeByRealPath.set(fs.realpathSync(pkg.fullPath), { name: pkg.name, linked })
    }
  }

  // Seed reachability from top-level packages and `.next/node_modules` (e.g. hashed externalized packages).
  /** @type {Set<string>} */
  const reachable = new Set()
  /** @type {string[]} */
  const queue = []

  function markReachable(realPath) {
    if (reachable.has(realPath)) return
    reachable.add(realPath)
    queue.push(realPath)
  }

  // Place direct dependencies first so they own top-level resolution.
  for (const pkg of readPackageEntries(sourceModules)) {
    if (isIgnoredRuntimePackage(pkg.name)) continue
    const realPath = fs.realpathSync(pkg.fullPath)
    if (!topLevelRealPaths.has(pkg.name)) {
      copyPackageToTopLevel(pkg.name, realPath)
    }
    markReachable(realPath)
  }

  for (const pkg of readPackageEntries(extraModulesDir)) {
    if (isIgnoredRuntimePackage(pkg.name)) continue
    markReachable(fs.realpathSync(pkg.fullPath))
  }

  while (queue.length > 0) {
    const current = queue.shift()
    const info = storeByRealPath.get(current)
    if (!info) continue
    for (const dep of info.linked) {
      markReachable(dep.realPath)
    }
  }

  // Place any uncontested reachable transitive packages at top level.
  for (const realPath of reachable) {
    const info = storeByRealPath.get(realPath)
    if (!info) continue
    if (!topLevelRealPaths.has(info.name)) {
      copyPackageToTopLevel(info.name, realPath)
    }
  }

  // Nest conflicting versions directly under the consumer packages that link to them.
  for (const consumerRealPath of reachable) {
    const info = storeByRealPath.get(consumerRealPath)
    const consumerDest = placedPaths.get(consumerRealPath)
    if (!info || !consumerDest) continue

    for (const dep of info.linked) {
      if (topLevelRealPaths.get(dep.name) === dep.realPath) continue
      const nestedDest = path.join(consumerDest, 'node_modules', ...dep.name.split('/'))
      fs.mkdirSync(path.dirname(nestedDest), { recursive: true })
      copyInto(dep.realPath, nestedDest)
    }
  }
}

function assertNoNativeAddons(directory) {
  const nativeAddons = walkFiles(directory).filter((filePath) => path.extname(filePath) === '.node')
  if (nativeAddons.length === 0) return

  const listed = nativeAddons.map((filePath) => path.relative(directory, filePath)).join('\n')
  throw new Error(`Refusing to assemble the runtime directory. These native addons would run only on the OS that built them:\n${listed}`)
}

function assertInside(directory, filePath, label) {
  const relative = path.relative(directory, filePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} resolved outside the runtime directory: ${filePath}`)
  }
}

function assertRuntimeResolves(directory) {
  const constantsPath = path.join(directory, 'node_modules', 'next', 'dist', 'shared', 'lib', 'constants.js')
  const requireFromNext = createRequire(constantsPath)
  assertInside(directory, requireFromNext.resolve('@swc/helpers/_/_interop_require_default'), '@swc/helpers')
  assertInside(directory, requireFromNext.resolve('styled-jsx/package.json'), 'styled-jsx')
  assertInside(directory, requireFromNext.resolve('@next/env'), '@next/env')
  assertInside(directory, requireFromNext.resolve('postcss/package.json'), 'postcss')
  assertInside(directory, requireFromNext.resolve('react/package.json'), 'react')
  assertInside(directory, requireFromNext.resolve('react-dom/package.json'), 'react-dom')
  // loadConfig() calls loadWebpackHook() unless standalone config env is set.
  assertInside(directory, requireFromNext.resolve('next/dist/compiled/webpack/webpack-lib'), 'next webpack hook')
  assertInside(directory, requireFromNext.resolve('next/dist/compiled/@babel/runtime/package.json'), 'next babel runtime hook')
  const requireFromRuntime = createRequire(path.join(directory, 'package.json'))
  assertInside(directory, requireFromRuntime.resolve('next/constants.js'), 'next/constants.js')
  assertInside(directory, requireFromRuntime.resolve('./scripts/rewriteBuildBasePath.mjs'), 'rewriteBuildBasePath.mjs')
}

function assertPlaceholderPresent(directory) {
  const textFiles = walkFiles(directory).filter((filePath) => TEXT_EXTENSIONS.has(path.extname(filePath)))
  const hasPlaceholder = textFiles.some((filePath) => fs.readFileSync(filePath, 'utf8').includes(BASE_PATH_PLACEHOLDER))
  if (!hasPlaceholder) {
    throw new Error(
      `The build at ${directory} does not contain ${BASE_PATH_PLACEHOLDER}. The server rewrites that placeholder at startup, so the archive must keep it.`
    )
  }
}

function requirePath(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label} at ${filePath}. Run \`pnpm build\` first.`)
  }
}

export function assembleRuntime({ projectRoot, standaloneDir, outputDir }) {
  requirePath(path.join(standaloneDir, '.next', 'BUILD_ID'), 'standalone build')
  requirePath(path.join(projectRoot, '.next', 'static'), 'client assets (.next/static)')
  requirePath(path.join(projectRoot, 'public'), 'public directory')
  requirePath(path.join(projectRoot, 'next.config.ts'), 'next.config.ts')
  requirePath(path.join(projectRoot, 'scripts', 'rewriteBuildBasePath.ts'), 'base-path rewrite script')

  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })

  for (const entry of fs.readdirSync(standaloneDir)) {
    if (entry === 'node_modules' || entry === 'server.js') continue
    copyInto(path.join(standaloneDir, entry), path.join(outputDir, entry))
  }
  flattenStandaloneNodeModules(
    path.join(standaloneDir, 'node_modules'),
    path.join(outputDir, 'node_modules'),
    path.join(standaloneDir, '.next', 'node_modules')
  )

  copyInto(path.join(projectRoot, '.next', 'static'), path.join(outputDir, '.next', 'static'))
  copyInto(path.join(projectRoot, 'public'), path.join(outputDir, 'public'))
  // Standalone only traces files imported by its generated server.js; custom server
  // startup also loads next.config.mjs (next/constants.js) and loadWebpackHook().
  const projectNextDir = path.dirname(createRequire(path.join(projectRoot, 'package.json')).resolve('next/package.json'))
  const outputNextDir = path.join(outputDir, 'node_modules', 'next')
  copyInto(path.join(projectNextDir, 'constants.js'), path.join(outputNextDir, 'constants.js'))
  copyInto(path.join(projectNextDir, 'dist', 'compiled', 'webpack'), path.join(outputNextDir, 'dist', 'compiled', 'webpack'))
  copyInto(path.join(projectNextDir, 'dist', 'compiled', '@babel'), path.join(outputNextDir, 'dist', 'compiled', '@babel'))
  transpileTsToMjs(path.join(projectRoot, 'next.config.ts'), path.join(outputDir, 'next.config.mjs'), (source) => {
    const updated = source.replace('./scripts/rewriteBuildBasePath.ts', './scripts/rewriteBuildBasePath.mjs')
    if (updated === source) {
      throw new Error('Expected next.config.ts to reference ./scripts/rewriteBuildBasePath.ts')
    }
    return updated
  })
  transpileTsToMjs(path.join(projectRoot, 'scripts', 'rewriteBuildBasePath.ts'), path.join(outputDir, 'scripts', 'rewriteBuildBasePath.mjs'))

  assertNoSymlinks(outputDir)
  assertNoNativeAddons(outputDir)
  assertPlaceholderPresent(path.join(outputDir, '.next'))
  assertRuntimeResolves(outputDir)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assembleRuntime({ projectRoot: root, standaloneDir, outputDir })
  console.log(`[assemble-standalone-runtime] wrote ${outputDir}`)
}
