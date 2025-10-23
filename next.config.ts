import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig = async (phase: string, { defaultConfig }: { defaultConfig: NextConfig }) => {
  const config: NextConfig = {
    ...defaultConfig,
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb'
      }
    }
  }
  return config
}

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts')
export default withNextIntl(nextConfig)
