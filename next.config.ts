import type { NextConfig } from 'next'

const nextConfig = async (phase: string, { defaultConfig }: { defaultConfig: NextConfig }) => {
  return defaultConfig
}

export default nextConfig
