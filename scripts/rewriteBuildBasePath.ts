import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Swap the compiled-in base path placeholder for the configured path.
 *
 * Next inlines `basePath` into production chunks, so this is what makes the path configurable
 * without a rebuild. The pristine placeholder files are snapshotted on first run, and every later
 * change restores from that snapshot before replacing — reversing a real path like '/abs' in place
 * would corrupt unrelated strings that happen to start with it.
 *
 * Must run before Next loads any build chunk, otherwise already-required modules keep the
 * placeholder. `next.config.ts` is the earliest hook available for that.
 *
 * Kept next to `next.config.ts` (not under `src/`) so Docker can ship the helper without the app
 * source. Keep `BASE_PATH_PLACEHOLDER` in sync with `src/lib/basePath.ts`.
 */

/** Keep in sync with `src/lib/basePath.ts`. */
export const BASE_PATH_PLACEHOLDER = '/__ABS_BASE_PATH__'

const SNAPSHOT_DIR_NAME = 'abs-base-path-snapshot'
const SNAPSHOT_MANIFEST_NAME = 'snapshot-manifest.json'
const STATE_FILE_NAME = 'abs-base-path.json'

/** Bumped when the replacement logic changes, so an existing build is rewritten from scratch. */
const REWRITE_VERSION = 2

/** Build output that is regenerated or irrelevant at runtime. */
const IGNORED_DIRECTORIES = ['cache', SNAPSHOT_DIR_NAME]

/** Text formats the placeholder can appear in. Anything else risks corrupting binary output. */
const REWRITABLE_EXTENSIONS = ['.js', '.cjs', '.mjs', '.json', '.html', '.rsc', '.txt', '.css']

interface SnapshotManifest {
  buildId: string
  files: string[]
}

interface AppliedState {
  version: number
  buildId: string
  basePath: string
}

const PLACEHOLDER_PATTERN = new RegExp(`(\\\\*)${BASE_PATH_PLACEHOLDER}`, 'g')

function normalizeBasePath(basePath: string | null | undefined): string {
  if (!basePath) return ''

  const trimmed = basePath.trim()
  if (!trimmed || trimmed === '/') return ''

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash
}

export function getConfiguredBasePath(): string {
  if (typeof globalThis.RouterBasePath === 'string') {
    return normalizeBasePath(globalThis.RouterBasePath)
  }
  return normalizeBasePath(process.env.ROUTER_BASE_PATH)
}

function replaceBasePathPlaceholder(content: string, basePath: string): string {
  return content.replace(PLACEHOLDER_PATTERN, (_match, backslashes: string) => basePath.split('/').join(`${backslashes}/`))
}

function readBuildId(distDir: string): string {
  return readFileSync(path.join(distDir, 'BUILD_ID'), 'utf8').trim()
}

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
  } catch {
    return null
  }
}

function collectPlaceholderFiles(distDir: string, relativeDir = ''): string[] {
  const absoluteDir = path.join(distDir, relativeDir)
  const found: string[] = []

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name)

    if (entry.isDirectory()) {
      if (relativeDir === '' && IGNORED_DIRECTORIES.includes(entry.name)) continue
      found.push(...collectPlaceholderFiles(distDir, relativePath))
      continue
    }

    if (!entry.isFile() || !REWRITABLE_EXTENSIONS.includes(path.extname(entry.name))) continue

    if (readFileSync(path.join(distDir, relativePath), 'utf8').includes(BASE_PATH_PLACEHOLDER)) {
      found.push(relativePath)
    }
  }

  return found
}

function createSnapshot(distDir: string, snapshotDir: string, buildId: string): SnapshotManifest {
  rmSync(snapshotDir, { recursive: true, force: true })

  const manifest: SnapshotManifest = { buildId, files: collectPlaceholderFiles(distDir) }

  for (const relativePath of manifest.files) {
    const destination = path.join(snapshotDir, relativePath)
    mkdirSync(path.dirname(destination), { recursive: true })
    copyFileSync(path.join(distDir, relativePath), destination)
  }

  mkdirSync(snapshotDir, { recursive: true })
  writeFileSync(path.join(snapshotDir, SNAPSHOT_MANIFEST_NAME), JSON.stringify(manifest))
  return manifest
}

/**
 * @param distDir absolute path to the `.next` directory
 * @param basePath normalized base path ('' for root)
 * @returns true when files were rewritten, false when the build already matches
 */
export function rewriteBuildBasePath(distDir: string, basePath: string): boolean {
  if (!existsSync(path.join(distDir, 'BUILD_ID'))) return false

  const buildId = readBuildId(distDir)
  const snapshotDir = path.join(distDir, SNAPSHOT_DIR_NAME)
  const stateFile = path.join(distDir, STATE_FILE_NAME)

  const state = readJsonFile<AppliedState>(stateFile)
  const isUpToDate = state?.version === REWRITE_VERSION && state.buildId === buildId && state.basePath === basePath
  // Same path/build/version: live files are already correct. Do not rebuild the snapshot (even if missing snapshot dir)
  if (isUpToDate) return false

  let manifest = readJsonFile<SnapshotManifest>(path.join(snapshotDir, SNAPSHOT_MANIFEST_NAME))
  if (manifest?.buildId !== buildId || !manifest.files.length) {
    manifest = createSnapshot(distDir, snapshotDir, buildId)
  }
  if (!manifest.files.length) {
    throw new Error(
      `Cannot apply base path "${basePath || '/'}" to the client build at ${distDir}. The original placeholder files are gone (missing or empty snapshot). Run a new production build.`
    )
  }

  try {
    for (const relativePath of manifest.files) {
      const pristine = readFileSync(path.join(snapshotDir, relativePath), 'utf8')
      writeFileSync(path.join(distDir, relativePath), replaceBasePathPlaceholder(pristine, basePath))
    }
    writeFileSync(stateFile, JSON.stringify({ version: REWRITE_VERSION, buildId, basePath } satisfies AppliedState))
  } catch (error) {
    throw new Error(
      `Failed to apply base path "${basePath || '/'}" to the client build at ${distDir}. The directory must be writable. Cause: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  return true
}
