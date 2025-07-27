import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig = async (phase: string, { defaultConfig }: { defaultConfig: NextConfig }) => {
  return defaultConfig
}

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts')
export default withNextIntl(nextConfig)
