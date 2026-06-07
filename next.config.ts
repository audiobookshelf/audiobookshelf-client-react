import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

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
  const projectDir = process.env.REACT_CLIENT_PATH ? path.resolve(process.env.REACT_CLIENT_PATH) : path.dirname(fileURLToPath(import.meta.url))
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

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOriginsFromEnv(),
  transpilePackages: ['foliate-js'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  images: {
    localPatterns: [{ pathname: '/api/**' }, { pathname: '/images/**' }]
  }
}

export default runWithProjectCwd(() => withNextIntl(nextConfig))
