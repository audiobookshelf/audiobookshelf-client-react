import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts')

const nextConfig = async (phase: string, { defaultConfig }: { defaultConfig: NextConfig }) => {
  const baseConfig: NextConfig = {
    ...defaultConfig,
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb'
      }
    },
    images: {
      localPatterns: [{ pathname: '/api/**' }, { pathname: '/images/**' }]
    }
  }
  return withNextIntl(baseConfig)
}

export default nextConfig
