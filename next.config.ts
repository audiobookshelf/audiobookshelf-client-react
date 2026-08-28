import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from 'next/constants.js'
import { createRequire } from 'node:module'
import path from 'path'
import { fileURLToPath } from 'url'

const projectDir = process.env.REACT_CLIENT_PATH ? path.resolve(process.env.REACT_CLIENT_PATH) : path.dirname(fileURLToPath(import.meta.url))

// Next compiles this file to CJS and evaluates it as a virtual module. Relative `import` then
// resolves from Audiobookshelf's cwd, not this project. `createRequire` from the client package
// fixes that. Explicit `.ts` works because Next's config loader registers a require hook for the
// duration of this evaluation.
const requireFromProject = createRequire(path.join(projectDir, 'package.json'))
const { BASE_PATH_PLACEHOLDER, getConfiguredBasePath } = requireFromProject('./src/lib/basePath.ts')
const { rewriteBuildBasePath } = requireFromProject('./src/lib/rewriteBuildBasePath.ts')

type BasePathPhase = typeof PHASE_PRODUCTION_BUILD | typeof PHASE_PRODUCTION_SERVER | typeof PHASE_DEVELOPMENT_SERVER

function isBasePathPhase(phase: string): phase is BasePathPhase {
  return phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER || phase === PHASE_DEVELOPMENT_SERVER
}

/** Set via audiobookshelf dev.js `AllowedDevOrigins` → index.js sets ALLOWED_DEV_ORIGINS. */
function allowedDevOriginsFromEnv(): string[] {
  return (process.env.ALLOWED_DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

/**
 * next-intl validates the i18n config path against process.cwd(). When Next is
 * embedded in the audiobookshelf server (Server.js), cwd stays at the server root
 * while Next's project dir is REACT_CLIENT_PATH
 * workaround: temporarily chdir so the check passes.
 */
function runWithProjectCwd<T>(fn: () => T): T {
  const originalCwd = process.cwd()
  const shouldChdir = path.resolve(originalCwd) !== path.resolve(projectDir)

  if (shouldChdir) {
    process.chdir(projectDir)
  }

  try {
    return fn()
  } finally {
    if (shouldChdir) {
      process.chdir(originalCwd)
    }
  }
}

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts')

/**
 * Pick the Next `basePath` for the current phase.
 *
 * - Build: use a placeholder token. Production chunks bake `basePath` in, so we cannot change it
 *   later without rewriting those files.
 * - Production server start: rewrite the placeholder in `.next` to the configured path, then return
 *   that path. Must happen here — once Next has loaded a chunk, its baked-in path is fixed.
 * - Dev: return the configured path directly (no placeholder, no rewrite).
 */
function basePathForPhase(phase: BasePathPhase): string {
  switch (phase) {
    case PHASE_PRODUCTION_BUILD:
      return BASE_PATH_PLACEHOLDER
    case PHASE_PRODUCTION_SERVER: {
      const basePath = getConfiguredBasePath()
      rewriteBuildBasePath(path.join(projectDir, '.next'), basePath)
      return basePath
    }
    case PHASE_DEVELOPMENT_SERVER:
      return getConfiguredBasePath()
  }
}

/**
 * Next does not add the base path to the `url` parameter it sends to the image optimizer, but our
 * image sources are prefixed (they are also used by plain `img` tags), so allow both forms.
 */
function localImagePatterns(basePath: string) {
  const pathnames = ['/api/**', '/images/**']
  return pathnames.flatMap((pathname) => (basePath ? [{ pathname }, { pathname: `${basePath}${pathname}` }] : [{ pathname }]))
}

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: allowedDevOriginsFromEnv(),
  transpilePackages: ['foliate-js', 'node-unrar-js'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  async headers() {
    return [
      {
        // Let the browser pick up service-worker updates promptly.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }]
      }
    ]
  }
}

const configForPhase = (phase: string) => {
  // Next also passes phases we do not care about (export, test, …); treat them like development.
  const basePath = isBasePathPhase(phase) ? basePathForPhase(phase) : getConfiguredBasePath()
  return runWithProjectCwd(() => withNextIntl({ ...nextConfig, basePath, images: { localPatterns: localImagePatterns(basePath) } }))
}

export default configForPhase
